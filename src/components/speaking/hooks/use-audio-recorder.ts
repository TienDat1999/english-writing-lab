"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type AudioRecorderState = "inactive" | "recording" | "processing"

export interface UseAudioRecorderOptions {
  deviceId?: string
  onAudioReady?: (blob: Blob, durationSeconds: number) => void
  onError?: (error: string) => void
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return ""
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ]
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return ""
}

export function useAudioRecorder({
  deviceId,
  onAudioReady,
  onError,
}: UseAudioRecorderOptions = {}) {
  const [state, setState] = useState<AudioRecorderState>("inactive")
  const [duration, setDuration] = useState<number>(0)
  const [audioLevel, setAudioLevel] = useState<number>(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const peakLevelRef = useRef<number>(0)

  const stopWaveformAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startWaveformAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const normalized = Math.min(1, avg / 60)
        peakLevelRef.current = Math.max(peakLevelRef.current, normalized)
        setAudioLevel(normalized)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch {
      // AudioContext not supported or blocked
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Trình duyệt của bạn không hỗ trợ thu âm từ Microphone.")
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
      if (deviceId) {
        audioConstraints.deviceId = { exact: deviceId }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      })

      peakLevelRef.current = 0
      startWaveformAnalysis(stream)

      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const streamTracks = stream.getTracks()
        streamTracks.forEach((track) => track.stop())
        stopWaveformAnalysis()

        const chosenMimeType = mediaRecorder.mimeType || mimeType || "audio/webm"
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: chosenMimeType,
        })
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))

        if (recordedBlob.size < 50) {
          onError?.("Không thu được dữ liệu âm thanh. Vui lòng kiểm tra quyền Micro và nói to hơn.")
          setState("inactive")
          return
        }

        if (peakLevelRef.current < 0.03) {
          onError?.("Microphone không bắt được âm thanh (Âm lượng 0%). Vui lòng kiểm tra cài đặt âm lượng đầu vào của Micro trên máy tính.")
          setState("inactive")
          return
        }

        if (onAudioReady) {
          onAudioReady(recordedBlob, durationSec)
        }
        setState("inactive")
      }

      mediaRecorder.start(200)
      startTimeRef.current = Date.now()
      setState("recording")
      setDuration(0)

      timerIntervalRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 500)
    } catch (err) {
      stopWaveformAnalysis()
      setState("inactive")
      let message = "Không thể truy cập Microphone."
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          message = "Trình duyệt chưa được cấp quyền Microphone. Vui lòng bấm vào biểu tượng Micro/Khóa trên thanh URL và chọn Cho phép (Allow)."
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          message = "Không tìm thấy thiết bị Microphone trên máy tính của bạn."
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          message = "Microphone đang bị ứng dụng khác chiếm dụng. Vui lòng đóng các ứng dụng gọi thoại khác và thử lại."
        } else {
          message = err.message
        }
      }
      onError?.(message)
    }
  }, [onAudioReady, onError, startWaveformAnalysis, stopWaveformAnalysis])

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      setState("processing")
      try {
        mediaRecorderRef.current.requestData()
      } catch {}
      mediaRecorderRef.current.stop()
    } else {
      setState("inactive")
      stopWaveformAnalysis()
    }
  }, [stopWaveformAnalysis])

  const cancelRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      const stream = mediaRecorderRef.current.stream
      stream?.getTracks().forEach((track) => track.stop())
    }
    stopWaveformAnalysis()
    setState("inactive")
    setDuration(0)
  }, [stopWaveformAnalysis])

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      stopWaveformAnalysis()
    }
  }, [stopWaveformAnalysis])

  return {
    state,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
