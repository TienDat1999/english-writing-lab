"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { playNaturalSpeech } from "@/lib/speech"

export function useSpeechPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
    setCurrentText(null)
  }, [])

  const playBase64Audio = useCallback(
    (base64: string, onEnded?: () => void) => {
      stopAudio()
      try {
        const audioSrc = `data:audio/mp3;base64,${base64}`
        const audio = new Audio(audioSrc)
        audioRef.current = audio
        setIsPlaying(true)

        audio.onended = () => {
          setIsPlaying(false)
          audioRef.current = null
          onEnded?.()
        }

        audio.onerror = () => {
          setIsPlaying(false)
          audioRef.current = null
        }

        audio.play().catch(() => {
          setIsPlaying(false)
        })
      } catch {
        setIsPlaying(false)
      }
    },
    [stopAudio],
  )

  const playSpeechText = useCallback(
    async (text: string, voice: "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer" = "nova") => {
      stopAudio()
      setCurrentText(text)
      await playNaturalSpeech(text, {
        voice,
        onStart: () => setIsPlaying(true),
        onEnd: () => {
          setIsPlaying(false)
          setCurrentText(null)
        },
      })
    },
    [stopAudio],
  )

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  return {
    isPlaying,
    currentText,
    playBase64Audio,
    playSpeechText,
    stopAudio,
  }
}
