import "server-only"

import { Types } from "mongoose"
import { connectMongoose } from "@/server/db/mongoose"
import { SpeakingSession } from "./speaking-session.schema"
import type { SpeakingMode, TargetLevel } from "../domain/speaking.types"

export class SpeakingSessionRepository {
  async createSession(input: {
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
    await connectMongoose()
    return SpeakingSession.create({
      userId: new Types.ObjectId(input.userId),
      mode: input.mode,
      topicTitle: input.topicTitle,
      topicScenario: input.topicScenario ?? "",
      targetLevel: input.targetLevel ?? "B1_B2",
      voicePersona: input.voicePersona ?? "nova",
      speechRate: input.speechRate ?? 1.0,
      examPart: input.examPart ?? null,
      cueCard: input.cueCard ?? null,
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
      turns: [],
      totalUserDurationSeconds: 0,
    })
  }

  async findSessionById(sessionId: string, userId: string) {
    await connectMongoose()
    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
      return null
    }
    return SpeakingSession.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    }).lean()
  }

  async listSessions(userId: string, limit: number = 20, skip: number = 0) {
    await connectMongoose()
    if (!Types.ObjectId.isValid(userId)) return []
    return SpeakingSession.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  }

  async addTurn(
    sessionId: string,
    turn: {
      turnNumber: number
      userAudioDurationSeconds: number
      userTranscript: string
      aiReplyText: string
      aiAudioBase64?: string
      instantFeedbackVi?: string
      suggestedPhrases?: Array<{ phrase: string; meaningVi: string }>
    },
  ) {
    await connectMongoose()
    return SpeakingSession.findByIdAndUpdate(
      new Types.ObjectId(sessionId),
      {
        $push: { turns: turn },
        $inc: { totalUserDurationSeconds: turn.userAudioDurationSeconds },
      },
      { new: true },
    ).lean()
  }

  async completeSession(sessionId: string) {
    await connectMongoose()
    return SpeakingSession.findByIdAndUpdate(
      new Types.ObjectId(sessionId),
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      },
      { new: true },
    ).lean()
  }

  async saveEvaluationReport(
    sessionId: string,
    report: import("../domain/speaking.types").SpeakingEvaluationReport,
  ) {
    await connectMongoose()
    return SpeakingSession.findByIdAndUpdate(
      new Types.ObjectId(sessionId),
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          evaluationReport: report,
        },
      },
      { new: true },
    ).lean()
  }

  async incrementHintsUsedCount(sessionId: string) {
    await connectMongoose()
    return SpeakingSession.findByIdAndUpdate(
      new Types.ObjectId(sessionId),
      { $inc: { hintsUsedCount: 1 } },
      { new: true },
    ).lean()
  }
}



