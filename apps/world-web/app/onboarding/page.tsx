"use client";

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WorldIDButton } from '@/components/WorldIDButton'
import { useAccount } from 'wagmi'

export default function OnboardingPage() {
  const { address } = useAccount()
  const [walletAddress, setWalletAddress] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string>('')
  const [lastTx, setLastTx] = useState<string>('')

  async function register() {
    try {
      setStatus('Registering user onchain...')
      setLastTx('')

      const addr = walletAddress || address
      if (!addr) throw new Error('Missing wallet address')
      if (!username) throw new Error('Missing username')

      const res = await fetch('/api/registry/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: addr, username }),
      }).then((r) => r.json())

      if (!res?.success) throw new Error(res?.error || 'Registration failed')
      setLastTx(res.txHash || '')
      setStatus('Registered ✅ Now run World ID verification.')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setStatus(`Error: ${message}`)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Onboarding</h1>
        <p className="mt-2 text-sm text-white/70">Register first (contract requirement), then verify with World ID widget.</p>

        <div className="mt-6 grid gap-4">
          <div>
            <div className="mb-2 text-sm text-white/80">Wallet address</div>
            <input
              value={walletAddress || address || ''}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <div className="mb-2 text-sm text-white/80">Username → preview.zenagent.eth</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="wikusia"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
            {username ? <div className="mt-2 text-xs text-white/60">Preview: {username}.zenagent.eth</div> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={register}
              className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
            >
              1) Register
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/70">2)</div>
              <WorldIDButton
                onVerified={({ txHash }) => {
                  if (txHash) setLastTx(txHash)
                  setStatus('Verified and stored onchain ✅')
                }}
              />
            </div>
          </div>

          {status ? <div className="text-sm text-white/80">{status}</div> : null}
          {!status && address ? (
            <div className="text-xs text-white/60">Tip: if verification fails with "Not registered", click Register first.</div>
          ) : null}
          {lastTx ? <div className="text-xs text-white/60">txHash: {lastTx}</div> : null}
        </div>
      </div>
    </main>
  )
}
