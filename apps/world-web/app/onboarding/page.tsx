"use client";

import { useState, useEffect } from 'react'
import { WorldIDButton } from '@/components/WorldIDButton'
import { useAccount } from 'wagmi'

export default function OnboardingPage() {
  const { address } = useAccount()
  const [status, setStatus] = useState<string>('')
  const [lastTx, setLastTx] = useState<string>('')
  const [verified, setVerified] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Onboarding</h1>
        <p className="mt-2 text-sm text-white/70">
          Verify your humanity with World ID to unlock check-ins and wellness tracking.
        </p>

        <div className="mt-6 grid gap-4">
          {!mounted && (
            <div className="text-sm text-white/60">Loading…</div>
          )}

          {mounted && !address && (
            <div className="text-sm text-white/60">Connect your wallet (top-right) to get started.</div>
          )}

          {mounted && address && !verified && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm font-medium text-white">Connected: {address.slice(0, 6)}…{address.slice(-4)}</div>
              <div className="mb-3 text-xs text-white/60">Click below to verify with World ID.</div>
              <WorldIDButton
                onVerified={({ txHash }) => {
                  if (txHash) setLastTx(txHash)
                  setVerified(true)
                  setStatus('Verified and stored onchain ✅')
                }}
              />
            </div>
          )}

          {verified && (
            <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4">
              <div className="text-sm font-medium text-[#22c55e]">✅ World ID Verified</div>
              <div className="text-xs text-white/60">Your humanity is verified onchain. You&apos;re ready to use ZenAgent.</div>
              <a href="/dashboard" className="mt-2 inline-block text-sm text-[#c4b5fd] underline">Go to Dashboard →</a>
            </div>
          )}

          {status ? <div className="text-sm text-white/80">{status}</div> : null}
          {lastTx ? <div className="text-xs text-white/60">txHash: {lastTx}</div> : null}
        </div>
      </div>
    </main>
  )
}
