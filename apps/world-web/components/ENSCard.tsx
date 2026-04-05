"use client"

import { Button } from '@/components/ui/button'
import { getLevelFromStreak } from '@/lib/ens'
import { useEffect, useState } from 'react'

interface ENSCardProps {
  ensName?: string
  streak?: number
  onUpdateRecords?: () => void
}

export function ENSCard({ ensName, streak = 0, onUpdateRecords }: ENSCardProps) {
  const [copied, setCopied] = useState(false)
  const level = getLevelFromStreak(streak)

  const copyToClipboard = () => {
    if (ensName) {
      navigator.clipboard.writeText(ensName)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!ensName) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="text-sm text-white/60">No ENS name yet</div>
        <div className="mt-1 text-xs text-white/40">Complete onboarding to mint your zenagent.eth subname</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#c4b5fd]/30 bg-[#c4b5fd]/10 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* ENS Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd]/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#c4b5fd]" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold text-[#c4b5fd]">{ensName}</div>
            <div className="text-sm text-white/60">{level} • {streak} day streak</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
            onClick={copyToClipboard}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {onUpdateRecords && (
            <Button
              size="sm"
              className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
              onClick={onUpdateRecords}
            >
              Update Records
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
