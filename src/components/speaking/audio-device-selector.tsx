"use client"

import React, { useState, useEffect } from "react"
import { HeadphonesIcon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export interface AudioDeviceSelectorProps {
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
  className?: string
}

export function AudioDeviceSelector({
  selectedDeviceId,
  onDeviceChange,
  className = "",
}: AudioDeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const loadDevices = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput")
      setDevices(audioInputs)
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadDevices()
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices)
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", loadDevices)
      }
    }
  }, [])

  const currentDevice = devices.find((d) => d.deviceId === selectedDeviceId)
  const currentLabel =
    currentDevice?.label ||
    (devices.length > 0 ? "Microphone Mặc định / Tai nghe" : "Đang tìm Micro...")

  return (
    <div className={`relative inline-block text-xs ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          loadDevices()
          setIsOpen(!isOpen)
        }}
        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1.5 rounded-lg border border-border/50 bg-background/50"
        title="Chọn Microphone / Tai nghe Headphone"
      >
        <HugeiconsIcon icon={HeadphonesIcon} size={13} className="text-primary" />
        <span className="max-w-[160px] truncate">{currentLabel}</span>
        <HugeiconsIcon icon={Settings02Icon} size={11} className="opacity-60" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-xl bg-popover border border-border p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <HugeiconsIcon icon={HeadphonesIcon} size={14} className="text-primary" />
              <span>Chọn nguồn Micro thu âm</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-[10px] px-1"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Nếu bạn đang dùng tai nghe Headphone/AirPods, hãy chọn đúng tên tai nghe dưới đây:
          </p>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {devices.map((device, idx) => {
              const isSelected =
                device.deviceId === selectedDeviceId || (!selectedDeviceId && idx === 0)
              const label =
                device.label || `Microphone ${idx + 1} (${device.deviceId.slice(0, 6)}...)`

              return (
                <button
                  key={device.deviceId || idx}
                  type="button"
                  onClick={() => {
                    onDeviceChange(device.deviceId)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="truncate pr-2">{label}</span>
                  {isSelected && <span className="text-primary text-[11px]">✓</span>}
                </button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
            💡 Mẹo macOS: Kiểm tra thêm trong <span className="font-mono">Cài đặt Hệ thống &gt; Âm thanh &gt; Đầu vào (Input)</span> để tăng âm lượng Micro.
          </div>
        </div>
      )}
    </div>
  )
}
