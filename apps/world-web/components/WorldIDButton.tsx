"use client"

import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import type { ISuccessResult } from '@worldcoin/idkit'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

// Suppress Radix DialogTitle warning from IDKitWidget (internal, can't fix)
if (typeof window !== 'undefined') {
  const origError = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('DialogContent') && args[0].includes('DialogTitle')) return
    origError.apply(console, args)
  }
}

export function WorldIDButton({
  onVerified,
}: {
  onVerified?: (payload: { txHash?: string; nullifierHash?: string }) => void
}) {
  const { address } = useAccount()
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)

  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('worldid_verified')
      if (stored) {
        setVerified(true)
      }
    }
  }, [])

  if (!appId) {
    return (
      <div className="text-xs text-white/60">
        Missing NEXT_PUBLIC_WORLD_APP_ID
      </div>
    )
  }

  async function handleSuccess(result: ISuccessResult) {
    setError('')
    setBusy(true)
    try {
      if (!address) throw new Error('Connect wallet first')

      // Call backend to verify and store onchain
      const res = await fetch('/api/world/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address, 
          idkitResponse: result 
        }),
      }).then((r) => r.json())

      if (!res?.success && !res?.alreadyVerified) {
        throw new Error(res?.error || 'Verification failed')
      }

      // Store in localStorage
      localStorage.setItem('worldid_verified', 'true')
      localStorage.setItem('worldid_nullifier', result.nullifier_hash)
      localStorage.setItem('worldid_verified_at', Date.now().toString())

      setVerified(true)
      onVerified?.({ txHash: res.txHash, nullifierHash: result.nullifier_hash })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2">
        <span className="text-[#22c55e]">✓</span>
        <span className="text-sm text-[#22c55e]">Verified Human</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <IDKitWidget
        app_id={appId as `app_${string}`}
        action="zenagent-checkin"
        signal={address || '0x0'}
        verification_level={VerificationLevel.Orb}
        onSuccess={handleSuccess}
      >
        {({ open }: { open: () => void }) => (
          <Button
            onClick={() => open()}
            disabled={busy || !address}
            className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90 disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Verify World ID'}
          </Button>
        )}
      </IDKitWidget>
      {error ? <div className="text-xs text-[#fbbf24]">{error}</div> : null}
    </div>
  )
}
