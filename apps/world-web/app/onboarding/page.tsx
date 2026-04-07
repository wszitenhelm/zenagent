"use client";

import { useState, useEffect } from 'react'
import { WorldIDButton } from '@/components/WorldIDButton'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { checkAvailability, mintSubname } from '@/lib/ens'
import { getUserProfile } from '@/lib/contract'
import { setWalletData, isHumanVerified, getENSName } from '@/lib/walletStorage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [lastTx, setLastTx] = useState<string>('')
  const [verified, setVerified] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [ensName, setEnsName] = useState<string>('')
  const [registered, setRegistered] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  
  useEffect(() => setMounted(true), [])
  
  // Check if already has ENS on this wallet - redirect to dashboard
  useEffect(() => {
    const checkExisting = async () => {
      if (!address) {
        setLoadingExisting(false)
        return
      }
      
      // Check wallet storage first
      const existingEns = getENSName(address)
      if (existingEns) {
        router.push('/dashboard')
        return
      }
      
      // Also check contract (for data stored onchain but not in localStorage)
      try {
        const profile = await getUserProfile(address)
        const contractEns = profile[5]
        if (contractEns && contractEns.length > 0) {
          // Save to wallet storage and redirect
          setWalletData(address, {
            ensName: contractEns,
            username: profile[0],
          })
          router.push('/dashboard')
          return
        }
      } catch (e) {
        console.log('No existing profile found onchain')
      }
      
      // Check if already verified (skip to step 2)
      if (isHumanVerified(address)) {
        setVerified(true)
        setStep(2)
      }
      
      setLoadingExisting(false)
    }
    checkExisting()
  }, [address, router])
  
  // Update step when verified changes
  useEffect(() => {
    if (verified && step === 1) {
      setStep(2)
    }
  }, [verified, step])

  const checkUsername = async () => {
    if (!username || username.length < 3) {
      setStatus('Username must be at least 3 characters')
      return
    }
    setChecking(true)
    setStatus('Checking availability...')
    try {
      const available = await checkAvailability(username)
      setIsAvailable(available)
      if (available) {
        setStatus(`✅ ${username}.zenagent.eth is available!`)
      } else {
        setStatus(`❌ ${username}.zenagent.eth is taken`)
      }
    } catch {
      setStatus('Error checking availability')
    }
    setChecking(false)
  }

  const register = async () => {
    if (!address || !username) return
    setStatus('Registering...')
    console.log('[onboarding] Starting registration...')
    try {
      // Register user in contract
      console.log('[onboarding] Calling /api/registry/register...')
      const registerRes = await fetch('/api/registry/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, username }),
      }).then((r) => r.json())
      console.log('[onboarding] Register response:', registerRes)

      // If already registered, that's fine - continue to ENS
      if (!registerRes?.success && !registerRes?.error?.includes('Already registered')) {
        throw new Error(registerRes?.error || 'Registration failed')
      }

      // Mint ENS subname
      console.log('[onboarding] Calling mintSubname...')
      const ensRes = await mintSubname(username, address, {} as any)
      console.log('[onboarding] ENS response:', ensRes)
      setEnsName(ensRes.ensName)
      
      // Store in wallet-based storage
      setWalletData(address, {
        ensName: ensRes.ensName,
        username: username,
      })

      setLastTx(ensRes.txHash)
      setRegistered(true)
      setStatus('Registration complete! ✅')
      setStep(3)
    } catch (e) {
      console.error('[onboarding] Registration error:', e)
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setStatus(`Error: ${msg}`)
      alert(`Registration failed: ${msg}`)
    }
  }

  if (!mounted || loadingExisting) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-sm text-white/60">Checking your profile…</div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Onboarding</h1>
        <p className="mt-2 text-sm text-white/70">
          Complete 3 steps to unlock ZenAgent: verify humanity, choose your name, and register.
        </p>

        {/* Step indicators */}
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-medium ${
                s === step
                  ? 'bg-[#c4b5fd] text-[#0f172a]'
                  : s < step
                  ? 'bg-[#22c55e]/20 text-[#22c55e]'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {s < step ? '✓' : s} {s === 1 ? 'World ID' : s === 2 ? 'Username' : 'Complete'}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {/* Step 1: World ID Verification */}
          {step === 1 && (
            <>
              {!address && (
                <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-4">
                  <div className="text-sm text-[#fbbf24]">Connect your wallet (top-right) to get started.</div>
                </div>
              )}

              {address && !verified && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-1 text-sm font-medium text-white">
                    Step 1: Verify with World ID
                  </div>
                  <div className="mb-3 text-xs text-white/60">
                    Connected: {address.slice(0, 6)}…{address.slice(-4)}
                  </div>
                  <WorldIDButton
                    onVerified={({ txHash, nullifierHash }) => {
                      if (txHash) setLastTx(txHash)
                      setVerified(true)
                      setStatus('Verified and stored onchain ✅')
                      setStep(2)
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* Step 2: Username & ENS */}
          {step === 2 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 text-sm font-medium text-white">Step 2: Choose your username</div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    setIsAvailable(null)
                    setStatus('')
                  }}
                  placeholder="your-name"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />
                <Button
                  onClick={checkUsername}
                  disabled={checking || username.length < 3}
                  className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:bg-[#c4b5fd]/90 disabled:opacity-50"
                >
                  {checking ? 'Checking…' : 'Check'}
                </Button>
              </div>

              {isAvailable === true && (
                <div className="mt-3 rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-3">
                  <div className="text-sm text-[#22c55e]">✅ {username}.zenagent.eth is available!</div>
                  <div className="mt-2 text-xs text-white/60">
                    Preview:
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#c4b5fd]" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span className="text-lg font-semibold text-[#c4b5fd]">{username}.zenagent.eth</span>
                  </div>
                  <Button
                    onClick={register}
                    className="mt-3 w-full rounded-xl bg-[#22c55e] text-white hover:bg-[#22c55e]/90"
                  >
                    Register & Mint ENS
                  </Button>
                </div>
              )}

              {isAvailable === false && (
                <div className="mt-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
                  <div className="text-sm text-[#ef4444]">❌ {username}.zenagent.eth is already taken</div>
                  <div className="mt-1 text-xs text-white/60">Try a different username</div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4">
              <div className="text-lg font-medium text-[#22c55e]">🎉 Welcome to ZenAgent!</div>
              
              {ensName && (
                <div className="mt-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#c4b5fd]" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="text-xl font-semibold text-[#c4b5fd]">{ensName}</span>
                </div>
              )}
              
              <div className="mt-3 text-sm text-white/80">
                ✅ World ID verified<br/>
                ✅ ENS subname minted<br/>
                ✅ Registered onchain
              </div>

              {lastTx && (
                <div className="mt-2 text-xs text-white/60">tx: {lastTx}</div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-xl bg-[#c4b5fd] px-4 py-2 text-center text-sm font-medium text-[#0f172a] hover:bg-[#c4b5fd]/90"
                >
                  Go to Dashboard →
                </Link>
                <Link
                  href="/checkin"
                  className="flex-1 rounded-xl bg-[#6ee7b7] px-4 py-2 text-center text-sm font-medium text-[#0f172a] hover:bg-[#6ee7b7]/90"
                >
                  First Check-in →
                </Link>
              </div>
            </div>
          )}

          {status && !isAvailable && (
            <div className="text-sm text-white/80">{status}</div>
          )}
        </div>
      </div>
    </main>
  )
}
