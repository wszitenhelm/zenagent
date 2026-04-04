"use client"

import { IDKitRequestWidget, orbLegacy, type IDKitResult, IDKitErrorCodes } from '@worldcoin/idkit'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useState, useCallback, useEffect } from 'react'

type RpContext = {
  rp_id: string
  nonce: string
  created_at: number
  expires_at: number
  signature: string
}

export function WorldIDButton({
  onVerified,
}: {
  onVerified?: (payload: { txHash?: string }) => void
}) {
  const { address } = useAccount()
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [rpContext, setRpContext] = useState<RpContext | null>(null)

  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID
  const rpId = process.env.NEXT_PUBLIC_WORLD_RP_ID

  if (!appId || !rpId) {
    return (
      <div className="text-xs text-white/60">
        Missing NEXT_PUBLIC_WORLD_APP_ID / NEXT_PUBLIC_WORLD_RP_ID
      </div>
    )
  }

  const fetchRpContext = useCallback(async () => {
    const res = await fetch('/api/rp-signature', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'zenagent-checkin' }),
    })
    const data = await res.json()
    if (!data.sig) throw new Error(data.error || 'Failed to get RP signature')
    return {
      rp_id: rpId!,
      nonce: data.nonce,
      created_at: data.created_at,
      expires_at: data.expires_at,
      signature: data.sig,
    } as RpContext
  }, [rpId])

  const handleOpen = useCallback(async () => {
    setError('')
    try {
      const ctx = await fetchRpContext()
      setRpContext(ctx)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to prepare verification')
    }
  }, [fetchRpContext])

  const handleVerify = useCallback(async (result: IDKitResult) => {
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
  }, [address, onVerified])

  const handleSuccess = useCallback((_result: IDKitResult) => {
    // verification already handled in handleVerify
  }, [])

  const handleError = useCallback((code: IDKitErrorCodes) => {
    setError(`World ID error: ${code}`)
    setOpen(false)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleOpen}
        disabled={busy || !address}
        className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90 disabled:opacity-60"
      >
        {busy ? 'Verifying…' : 'Verify World ID'}
      </Button>
      {error ? <div className="text-xs text-[#fbbf24]">{error}</div> : null}

      {rpContext ? (
        <IDKitRequestWidget
          app_id={appId as `app_${string}`}
          action="zenagent-checkin"
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: address || '0x0' })}
          open={open}
          onOpenChange={setOpen}
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ) : null}
    </div>
  )
}
