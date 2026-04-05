"use client"

import { useEffect, useState } from 'react'
import { X, Sparkles, Bookmark } from 'lucide-react'

interface ManifestationToastProps {
  quote: string
  onDismiss: () => void
  onSave: () => void
}

export function ManifestationToast({ quote, onDismiss, onSave }: ManifestationToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after 3 seconds
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="rounded-2xl border border-[#c4b5fd]/30 bg-[#1a1625] p-4 shadow-2xl max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c4b5fd]/20">
            <Sparkles className="h-5 w-5 text-[#c4b5fd]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#c4b5fd]">✨ Your daily manifestation</span>
              <button
                onClick={onDismiss}
                className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white/80 italic">"{quote}"</p>
            <button
              onClick={onSave}
              className="mt-3 flex items-center gap-1.5 text-xs text-[#c4b5fd] hover:text-[#c4b5fd]/80"
            >
              <Bookmark className="h-3 w-3" />
              Save to insights
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
