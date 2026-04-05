"use client";

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { WorldIDButton } from '@/components/WorldIDButton'
import { useAccount } from 'wagmi'
import { getUserProfile, ZENAGENT_REGISTRY_ADDRESS } from '@/lib/contract'

export default function OnboardingPage() {
  const { address } = useAccount()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string>('')
  const [lastTx, setLastTx] = useState<string>('')
  const [registered, setRegistered] = useState<boolean | null>(null)
  const [worldVerified, setWorldVerified] = useState(false)

  useEffect(() => {
    if (!address) { setRegistered(null); return }
    getUserProfile(address as `0x${string}`)
      .then(([uname, , , registeredAt, verified]) => {
        if (Number(registeredAt) > 0) {
          setRegistered(true)
          setWorldVerified(!!verified)
          if (uname) setUsername(uname)
        } else {
          setRegistered(false)
        }
      })
      .catch((err) => {
        console.warn('getUserProfile failed:', err)
        setRegistered(false)
      })
  }, [address])

  async function register() {
    try {
      setStatus('Registering user onchain...')
      setLastTx('')
      if (!address) throw new Error('Connect wallet first')
      if (!username) throw new Error('Enter a username')

      const res = await fetch('/api/registry/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, username }),
      }).then((r) => r.json())

      if (!res?.success) {
        const err = res?.error || 'Registration failed'
        if (err.includes('Already registered')) {
          setRegistered(true)
          setStatus('Already registered ✅ Proceed to World ID verification.')
          return
        }
        throw new Error(err)
      }
      setLastTx(res.txHash || '')
      setRegistered(true)
      setStatus('Registered ✅ Now verify with World ID.')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      if (message.includes('Already registered')) {
        setRegistered(true)
        setStatus('Already registered ✅ Proceed to World ID verification.')
        return
      }
      setStatus(`Error: ${message}`)
    }
  }

  if (!address) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-white">Onboarding</h1>
          <p className="mt-4 text-sm text-white/70">Connect your wallet (top-right) to get started.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Onboarding</h1>

        <div className="mt-6 grid gap-4">
          {/* Step 1: Register (only if not already registered) */}
          {registered === false && (
            <>
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
              <Button
                onClick={register}
                className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
              >
                Register
              </Button>
            </>
          )}

          {registered === true && !worldVerified && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm font-medium text-white">✅ Registered as {username || 'user'}</div>
              <div className="mb-3 text-xs text-white/60">Now verify your identity with World ID.</div>
              <WorldIDButton
                onVerified={({ txHash }) => {
                  if (txHash) setLastTx(txHash)
                  setWorldVerified(true)
                  setStatus('Verified and stored onchain ✅')
                }}
              />
            </div>
          )}

          {registered === true && worldVerified && (
            <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4">
              <div className="text-sm font-medium text-[#22c55e]">✅ Fully onboarded</div>
              <div className="text-xs text-white/60">Registered + World ID verified. You&apos;re ready to use ZenAgent.</div>
              <a href="/dashboard" className="mt-2 inline-block text-sm text-[#c4b5fd] underline">Go to Dashboard →</a>
            </div>
          )}

          {registered === null && (
            <div className="text-sm text-white/60">Checking registration status...</div>
          )}

          {status ? <div className="text-sm text-white/80">{status}</div> : null}
          {lastTx ? <div className="text-xs text-white/60">txHash: {lastTx}</div> : null}
        </div>
      </div>
    </main>
  )
}
