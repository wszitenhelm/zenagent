"use client"

import { useState, useEffect, useCallback } from 'react'

const PHASES = [
  { name: 'Inhale', duration: 4, text: 'Inhale...' },
  { name: 'Hold', duration: 4, text: 'Hold...' },
  { name: 'Exhale', duration: 4, text: 'Exhale...' },
  { name: 'Hold', duration: 4, text: 'Hold...' },
]

export default function BreathePage() {
  const [duration, setDuration] = useState(3) // minutes
  const [isActive, setIsActive] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(4)
  const [sessionTime, setSessionTime] = useState(0)
  const [cycles, setCycles] = useState(0)

  const cycleDuration = 16 // 4 phases × 4 seconds
  const targetCycles = Math.floor((duration * 60) / cycleDuration)

  const reset = useCallback(() => {
    setIsActive(false)
    setPhaseIndex(0)
    setTimeLeft(4)
    setSessionTime(0)
    setCycles(0)
  }, [])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setSessionTime((t) => t + 1)
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhaseIndex((p) => {
            const next = (p + 1) % 4
            if (next === 0) {
              setCycles((c) => c + 1)
            }
            return next
          })
          return 4
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive])

  // Auto-stop when target reached
  useEffect(() => {
    if (cycles >= targetCycles && isActive) {
      setIsActive(false)
    }
  }, [cycles, targetCycles, isActive])

  const currentPhase = PHASES[phaseIndex]
  
  // Debug: log current phase
  console.log('[Breathe] Phase:', phaseIndex, currentPhase.name, 'timeLeft:', timeLeft)
  
  const progress = ((cycles + (4 - timeLeft) / 4) / targetCycles) * 100

  // Circle animation styles
  const getCircleStyle = () => {
    const base = { transition: 'all 1s ease-in-out' }
    
    if (!isActive) {
      return { ...base, width: 200, height: 200, background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)' }
    }
    
    if (currentPhase.name === 'Inhale') {
      return { 
        ...base, 
        width: 200 + (100 * (4 - timeLeft) / 4), 
        height: 200 + (100 * (4 - timeLeft) / 4),
        background: `linear-gradient(135deg, #c4b5fd 0%, #6ee7b7 ${(4 - timeLeft) * 25}%)`
      }
    }
    if (currentPhase.name === 'Hold' && phaseIndex === 1) {
      return { 
        ...base, 
        width: 300, 
        height: 300,
        background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)'
      }
    }
    if (currentPhase.name === 'Hold' && phaseIndex === 3) {
      return { 
        ...base, 
        width: 200, 
        height: 200,
        background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)'
      }
    }
    if (currentPhase.name === 'Exhale') {
      return { 
        ...base, 
        width: 300 - (100 * (4 - timeLeft) / 4), 
        height: 300 - (100 * (4 - timeLeft) / 4),
        background: `linear-gradient(135deg, #6ee7b7 ${(4 - timeLeft) * 25}%, #c4b5fd 100%)`
      }
    }
    return { 
      ...base, 
      width: 200, 
      height: 200,
      background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] px-6 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-white">Breathe</h1>
        <p className="mt-2 text-sm text-white/60">4-4-4-4 box breathing technique</p>

        {/* Duration pills */}
        <div className="mt-6 flex justify-center gap-3">
          {[3, 5, 10].map((min) => (
            <button
              key={min}
              onClick={() => { setDuration(min); reset(); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                duration === min
                  ? 'bg-[#c4b5fd] text-[#0f172a]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {min} min
            </button>
          ))}
        </div>

        {/* Breathing circle */}
        <div className="mt-12 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full shadow-2xl"
            style={getCircleStyle()}
          >
            <span className="text-lg font-medium text-[#0f172a]">
              {isActive ? currentPhase.text : 'Ready?'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-white">{formatTime(sessionTime)}</div>
            <div className="text-xs text-white/60">Session</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-[#6ee7b7]">{cycles}</div>
            <div className="text-xs text-white/60">Cycles</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold text-[#c4b5fd]">{targetCycles}</div>
            <div className="text-xs text-white/60">Target</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#c4b5fd] to-[#6ee7b7] transition-all duration-1000"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/60">{Math.round(progress)}% complete</div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="rounded-xl bg-[#c4b5fd] px-8 py-3 text-sm font-medium text-[#0f172a] hover:bg-[#c4b5fd]/90 transition-all hover:scale-105"
          >
            {isActive ? 'Pause' : cycles > 0 ? 'Resume' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            Reset
          </button>
        </div>

        {/* Phase indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {PHASES.map((phase, i) => (
            <div
              key={phase.name + i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === phaseIndex ? 'bg-[#c4b5fd] w-6' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
