import "server-only"

import {
  createSttGateway,
  createSpeakingCoachGateway,
  createTtsGateway,
} from "@/server/ai/gateway.factory"
import type { TtsVoice } from "@/server/ai/tts.gateway"
import { SpeakingSessionRepository } from "../infrastructure/speaking-session.repository"
import { SpeakingQuotaService } from "./speaking-quota.service"
import type { SpeakingMode, TargetLevel } from "../domain/speaking.types"

export class SpeakingSessionService {
  constructor(
    private readonly sessionRepo = new SpeakingSessionRepository(),
    private readonly quotaService = new SpeakingQuotaService(),
    private readonly sttGateway = createSttGateway(),
    private readonly coachGateway = createSpeakingCoachGateway(),
    private readonly ttsGateway = createTtsGateway(),
  ) {}

  async startSession(input: {
    userId: string
    mode: SpeakingMode
    topicTitle: string
    topicScenario?: string
    targetLevel?: TargetLevel
    voicePersona?: string
    speechRate?: number
    examPart?: import("../domain/speaking.types").ExamPart
    cueCard?: import("../domain/speaking.types").CueCardData
  }) {
    const quota = await this.quotaService.getUserQuotaStatus(input.userId)
    if (!quota.canRecord) {
      throw new Error("QUOTA_EXCEEDED: You have used your 5-minute daily free speaking quota.")
    }

    return this.sessionRepo.createSession(input)
  }

  async processAudioTurn(input: {
    sessionId: string
    userId: string
    audioBuffer: Buffer
    mimeType: string
    clientDurationSeconds?: number
  }) {
    const session = await this.sessionRepo.findSessionById(input.sessionId, input.userId)
    if (!session) {
      throw new Error("SESSION_NOT_FOUND: Speaking session not found.")
    }
    if (session.status !== "IN_PROGRESS") {
      throw new Error("SESSION_CLOSED: This speaking session is already completed.")
    }

    const quota = await this.quotaService.getUserQuotaStatus(input.userId)
    if (!quota.canRecord) {
      throw new Error("QUOTA_EXCEEDED: You have used your 5-minute daily free speaking quota.")
    }

    // 1. Transcribe audio with Whisper
    const sttResult = await this.sttGateway.transcribeAudio({
      audioBuffer: input.audioBuffer,
      mimeType: input.mimeType,
      language: "en",
      prompt: "English speaking practice session. Clear conversation, answers, thoughts, and opinions.",
    })

    const rawTranscript = sttResult.text.trim()
    const cleaned = rawTranscript.toLowerCase().replace(/[.,!?;:"]/g, "").trim()
    const isHallucination =
      !cleaned ||
      cleaned === "you" ||
      cleaned === "you you" ||
      cleaned === "thank you" ||
      cleaned === "thanks for watching" ||
      cleaned === "subscribe" ||
      cleaned === "mbc"

    if (isHallucination) {
      throw new Error("EMPTY_SPEECH: Micro chưa thu được câu nói tiếng Anh rõ ràng hoặc âm lượng quá nhỏ. Vui lòng nói to hơn và thử lại.")
    }

    const userTranscript = rawTranscript

    // 2. Compute audio duration to deduct (bounded between 1s and 120s)
    const rawDuration = sttResult.durationSeconds ?? input.clientDurationSeconds ?? 3
    const durationSeconds = Math.min(120, Math.max(1, Math.round(rawDuration)))

    // 3. Deduct quota atomically
    const updatedQuota = await this.quotaService.deductUserAudioSeconds(input.userId, durationSeconds)

    // 4. Generate AI Coach response
    const history = (session.turns || []).slice(-6).flatMap((t: { userTranscript: string; aiReplyText: string }) => [
      { speaker: "user" as const, text: t.userTranscript },
      { speaker: "assistant" as const, text: t.aiReplyText },
    ])

    const coachResponse = await this.coachGateway.generateTurnResponse({
      mode: session.mode as SpeakingMode,
      targetLevel: session.targetLevel as TargetLevel,
      topicTitle: session.topicTitle,
      topicScenario: session.topicScenario,
      voicePersona: session.voicePersona,
      history,
      userTranscript,
    })

    // 5. Generate AI Audio (TTS)
    let aiAudioBase64: string | undefined = undefined
    try {
      const voice = (session.voicePersona as TtsVoice) || "nova"
      const audioArrayBuffer = await this.ttsGateway.generateSpeech({
        text: coachResponse.replyText,
        voice,
        speed: session.speechRate ?? 1.0,
      })
      aiAudioBase64 = Buffer.from(audioArrayBuffer).toString("base64")
    } catch (ttsErr) {
      console.error("TTS generation warning:", ttsErr)
    }

    // 6. Append Turn to Session
    const turnNumber = (session.turns?.length ?? 0) + 1
    const newTurn = {
      turnNumber,
      userAudioDurationSeconds: durationSeconds,
      userTranscript,
      aiReplyText: coachResponse.replyText,
      aiAudioBase64,
      instantFeedbackVi: coachResponse.instantFeedbackVi,
      suggestedPhrases: coachResponse.suggestedPhrases,
    }

    await this.sessionRepo.addTurn(input.sessionId, newTurn)

    if (coachResponse.isSessionEndSuggested) {
      await this.sessionRepo.completeSession(input.sessionId)
    }

    return {
      turn: newTurn,
      quota: updatedQuota,
      isCompleted: Boolean(coachResponse.isSessionEndSuggested),
    }
  }

  async getSession(sessionId: string, userId: string) {
    return this.sessionRepo.findSessionById(sessionId, userId)
  }

  async listUserSessions(userId: string, limit: number = 20, skip: number = 0) {
    return this.sessionRepo.listSessions(userId, limit, skip)
  }

  async finishSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId, userId)
    if (!session) throw new Error("SESSION_NOT_FOUND: Speaking session not found.")
    return this.sessionRepo.completeSession(sessionId)
  }

  async evaluateSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId, userId)
    if (!session) throw new Error("SESSION_NOT_FOUND: Speaking session not found.")

    // If already evaluated, return existing report
    if (session.evaluationReport) {
      return {
        session,
        report: session.evaluationReport,
      }
    }

    const turns = session.turns || []
    if (turns.length === 0) {
      throw new Error("EMPTY_SESSION: Cannot evaluate a speaking session with 0 turns.")
    }

    const { createSpeakingEvaluatorGateway } = await import("@/server/ai/gateway.factory")
    const evaluator = createSpeakingEvaluatorGateway()

    const report = await evaluator.evaluateSpeakingSession({
      mode: session.mode as SpeakingMode,
      topicTitle: session.topicTitle,
      topicScenario: session.topicScenario,
      targetLevel: session.targetLevel as TargetLevel,
      turns: turns.map((t: { turnNumber: number; userTranscript: string; aiReplyText: string; userAudioDurationSeconds: number }) => ({
        turnNumber: t.turnNumber,
        userTranscript: t.userTranscript,
        aiReplyText: t.aiReplyText,
        userAudioDurationSeconds: t.userAudioDurationSeconds,
      })),
      totalUserDurationSeconds: session.totalUserDurationSeconds || 0,
    })

    const updatedSession = await this.sessionRepo.saveEvaluationReport(sessionId, report)
    return {
      session: updatedSession,
      report,
    }
  }

  async getScaffoldingHint(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId, userId)
    if (!session) throw new Error("SESSION_NOT_FOUND: Speaking session not found.")

    const lastTurn = session.turns?.[session.turns.length - 1]
    const currentPrompt =
      lastTurn?.aiReplyText ||
      (session.cueCard ? session.cueCard.topic : session.topicTitle)

    const { createScaffoldingGateway } = await import("@/server/ai/gateway.factory")
    const scaffoldingGateway = createScaffoldingGateway()

    const hint = await scaffoldingGateway.generateScaffoldingHint({
      topicTitle: session.topicTitle,
      topicScenario: session.topicScenario,
      currentAiPrompt: currentPrompt,
      targetLevel: session.targetLevel as TargetLevel,
    })

    const updatedSession = await this.sessionRepo.incrementHintsUsedCount(sessionId)

    return {
      hint,
      hintsUsedCount: updatedSession?.hintsUsedCount ?? 1,
    }
  }
}


