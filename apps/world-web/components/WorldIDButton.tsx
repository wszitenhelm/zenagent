"use client"

import { IDKitWidget, VerificationLevel, type ISuccessResult, type IVerifyResponse } from '@worldcoin/idkit'
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
  const rpId = process.env.NEXT_PUBLIC_WORLD_RP_ID

  if (!appId || !rpId) {
    return (
      <div className="text-xs text-white/60">
        Missing NEXT_PUBLIC_WORLD_APP_ID / NEXT_PUBLIC_WORLD_RP_ID
      </div>
    )
  }

  if (!IDKitWidget) {
    return <div className="text-xs text-white/60">World ID widget unavailable (check @worldcoin/idkit exports/version).</div>
  }

  async function handleVerify(result: IVerifyResponse) {
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
      throw e
    } finally {
      setBusy(false)
    }
  }

  function onSuccess(_result: ISuccessResult) {
  }

  return (
    <IDKitWidget
      app_id={appId as `app_${string}`}
      action="zenagent-checkin"
      signal={address || '0x0'}
      verification_level={VerificationLevel?.Orb ?? 'orb'}
      handleVerify={handleVerify}
      onSuccess={onSuccess}
      {...({ rp_id: rpId } as any)}
    >
      {({ open }: { open: () => void }) => (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => open()}
            disabled={busy || !address}
            className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90 disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Verify World ID'}
          </Button>
          {error ? <div className="text-xs text-[#fbbf24]">{error}</div> : null}
        </div>
      )}
    </IDKitWidget>
  )
}
