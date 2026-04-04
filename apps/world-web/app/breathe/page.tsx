"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type Preset = 180 | 300 | 600

export default function BreathePage() {
  const [preset, setPreset] = useState<Preset>(180)
  const [secondsLeft, setSecondsLeft] = useState(preset)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) return

    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, secondsLeft])

  useEffect(() => {
    setSecondsLeft(preset)
  }, [preset])

  const cycles = useMemo(() => {
    const total = preset - secondsLeft
    return Math.floor(total / 16)
  }, [preset, secondsLeft])

  const label = useMemo(() => {
    const phase = (preset - secondsLeft) % 16
    if (phase < 4) return 'Inhale'
    if (phase < 8) return 'Hold'
    if (phase < 12) return 'Exhale'
    return 'Hold'
  }, [preset, secondsLeft])

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-white/60">Breathing session</div>
            <div className="text-2xl font-semibold text-white">Breathe</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
              onClick={() => setPreset(180)}
            >
              3min
            </Button>
            <Button
              variant="outline"
              className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
              onClick={() => setPreset(300)}
            >
              5min
            </Button>
            <Button
              variant="outline"
              className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
              onClick={() => setPreset(600)}
            >
              10min
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-[#c4b5fd]/10 blur-3xl" />
            <div className="zen-breathe-16 flex h-[260px] w-[260px] items-center justify-center rounded-full border border-white/10 bg-white/5">
              <div className="text-center">
                <div className="text-sm text-white/60">{label}</div>
                <div className="mt-1 text-3xl font-semibold text-white">{Math.max(0, secondsLeft)}s</div>
                <div className="mt-2 text-xs text-white/60">Cycles: {cycles}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {!running ? (
              <Button
                className="rounded-xl bg-[#6ee7b7] text-[#0f172a] hover:scale-105 hover:bg-[#6ee7b7]/90"
                onClick={() => setRunning(true)}
              >
                Start
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
                onClick={() => setRunning(false)}
              >
                Pause
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
              onClick={() => {
                setRunning(false)
                setSecondsLeft(preset)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
