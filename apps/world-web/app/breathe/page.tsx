"use client"

import { useEffect, useMemo, useState } from "react"

const PHASES = [
  { name: "Inhale", duration: 4, text: "Inhale..." },
  { name: "Hold", duration: 4, text: "Hold..." },
  { name: "Exhale", duration: 4, text: "Exhale..." },
  { name: "Hold", duration: 4, text: "Hold..." },
]

type BreathState = {
  isActive: boolean
  phaseIndex: number
  timeLeft: number
  sessionTime: number
  cycles: number
}

export default function BreathePage() {
  const [duration, setDuration] = useState(3)

  const [state, setState] = useState<BreathState>({
    isActive: false,
    phaseIndex: 0,
    timeLeft: PHASES[0].duration,
    sessionTime: 0,
    cycles: 0,
  })

  const cycleDuration = useMemo(
    () => PHASES.reduce((sum, phase) => sum + phase.duration, 0),
    []
  )

  const targetCycles = Math.max(1, Math.floor((duration * 60) / cycleDuration))
  const currentPhase = PHASES[state.phaseIndex]

  const reset = () => {
    setState({
      isActive: false,
      phaseIndex: 0,
      timeLeft: PHASES[0].duration,
      sessionTime: 0,
      cycles: 0,
    })
  }

  useEffect(() => {
    if (!state.isActive) return

    const interval = setInterval(() => {
      setState((prev) => {
        const nextSessionTime = prev.sessionTime + 1

        if (prev.timeLeft > 1) {
          return {
            ...prev,
            sessionTime: nextSessionTime,
            timeLeft: prev.timeLeft - 1,
          }
        }

        const nextPhaseIndex = (prev.phaseIndex + 1) % PHASES.length
        const completedCycle = nextPhaseIndex === 0
        const nextCycles = completedCycle ? prev.cycles + 1 : prev.cycles

        if (nextCycles >= targetCycles) {
          return {
            ...prev,
            isActive: false,
            sessionTime: nextSessionTime,
            cycles: nextCycles,
            phaseIndex: nextPhaseIndex,
            timeLeft: PHASES[nextPhaseIndex].duration,
          }
        }

        return {
          ...prev,
          sessionTime: nextSessionTime,
          phaseIndex: nextPhaseIndex,
          timeLeft: PHASES[nextPhaseIndex].duration,
          cycles: nextCycles,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isActive, targetCycles])

  const progress =
    ((state.cycles + (currentPhase.duration - state.timeLeft) / currentPhase.duration) /
      targetCycles) *
    100

  const getCircleStyle = () => {
    const base: React.CSSProperties = {
      transition: "all 1s ease-in-out",
    }

    if (!state.isActive) {
      return {
        ...base,
        width: 200,
        height: 200,
        background: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)",
      }
    }

    const phaseProgress =
      (currentPhase.duration - state.timeLeft) / currentPhase.duration

    if (state.phaseIndex === 0) {
      return {
        ...base,
        width: 200 + 100 * phaseProgress,
        height: 200 + 100 * phaseProgress,
        background: `linear-gradient(135deg, #c4b5fd 0%, #6ee7b7 ${phaseProgress * 100}%)`,
      }
    }

    if (state.phaseIndex === 1) {
      return {
        ...base,
        width: 300,
        height: 300,
        background: "linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)",
      }
    }

    if (state.phaseIndex === 2) {
      return {
        ...base,
        width: 300 - 100 * phaseProgress,
        height: 300 - 100 * phaseProgress,
        background: `linear-gradient(135deg, #6ee7b7 ${phaseProgress * 100}%, #c4b5fd 100%)`,
      }
    }

    return {
      ...base,
      width: 200,
      height: 200,
      background: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)",
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] px-6 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-white">Breathe</h1>
        <p className="mt-2 text-sm text-white/60">4-4-4-4 box breathing technique</p>

        <div className="mt-6 flex justify-center gap-3">
          {[3, 5, 10].map((min) => (
            <button
              key={min}
              onClick={() => {
                setDuration(min)
                setState({
                  isActive: false,
                  phaseIndex: 0,
                  timeLeft: PHASES[0].duration,
                  sessionTime: 0,
                  cycles: 0,
                })
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                duration === min
                  ? "bg-[#c4b5fd] text-[#0f172a]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {min} min
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <div className="text-2xl font-bold text-[#c4b5fd]">
            {state.isActive ? currentPhase.name : "Press Start"}
          </div>
          <div className="text-sm text-white/60">
            {state.isActive ? `Phase ${state.phaseIndex + 1} of 4` : ""}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full shadow-2xl"
            style={getCircleStyle()}
          >
            <span className="text-lg font-medium text-[#0f172a]">
              {state.isActive ? currentPhase.text : "Ready?"}
            </span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-white">
              {formatTime(state.sessionTime)}
            </div>
            <div className="text-xs text-white/60">Session</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-[#6ee7b7]">{state.cycles}</div>
            <div className="text-xs text-white/60">Cycles</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-[#c4b5fd]">{targetCycles}</div>
            <div className="text-xs text-white/60">Target</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#c4b5fd] to-[#6ee7b7] transition-all duration-1000"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/60">
            {Math.min(Math.round(progress), 100)}% complete
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                isActive: !prev.isActive,
              }))
            }
            className="rounded-xl bg-[#c4b5fd] px-8 py-3 text-sm font-medium text-[#0f172a] transition-all hover:scale-105 hover:bg-[#c4b5fd]/90"
          >
            {state.isActive ? "Pause" : state.cycles > 0 ? "Resume" : "Start"}
          </button>
          <button
            onClick={reset}
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            Reset
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === state.phaseIndex ? "w-6 bg-[#c4b5fd]" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}