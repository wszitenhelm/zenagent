"use client"

import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import type { ISuccessResult } from '@worldcoin/idkit'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function WorldIDButton({
  onVerified,
}: {
  onVerified?: (payload: { txHash?: string }) => void
}) {
  const { address } = useAccount()
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID

  if (!appId) {
    return (
      <div className="text-xs text-white/60">
        Missing NEXT_PUBLIC_WORLD_APP_ID
      </div>
    )
  }

  async function handleVerify(result: ISuccessResult) {
    setError('')
    setBusy(true)
    try {
      if (!address) throw new Error('Connect wallet first')

      const res = await fetch('/api/world/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, idkitResponse: result }),
      }).then((r) => r.json())

      if (!res?.success) {
        throw new Error(res?.error || 'Verification failed')
      }

      onVerified?.({ txHash: res.txHash })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <IDKitWidget
        app_id={appId as `app_${string}`}
        action="zenagent-checkin"
        signal={address || '0x0'}
        verification_level={VerificationLevel.Orb}
        handleVerify={handleVerify}
        onSuccess={() => {}}
        aria-label="World ID Verification"
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
