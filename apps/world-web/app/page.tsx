"use client";

import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getWalletData, isHumanVerified, getENSName, migrateOldStorage } from '@/lib/walletStorage'

export default function Home() {
  const { isConnected, address } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hasENS, setHasENS] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Migrate old storage on mount
    if (address) {
      migrateOldStorage(address)
    }
  }, [address])
  
  // Check wallet state when connected
  useEffect(() => {
    if (address) {
      setIsVerified(isHumanVerified(address))
      const ens = getENSName(address)
      setHasENS(!!ens)
    }
  }, [address])

  const handleStart = async () => {
    if (connectors.length === 0) {
      alert('Please install MetaMask or another wallet')
      return
    }
    try {
      await connect({ connector: connectors[0] })
    } catch (e) {
      console.error('Connection failed:', e)
      alert('Could not connect wallet. Is it unlocked?')
    }
  }

  if (!mounted) return null

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4b5fd]/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span>🔐 World ID Verified</span>
            <span className="text-white/40">•</span>
            <span>🧠 AI-Powered</span>
            <span className="text-white/40">•</span>
            <span>⛓ Onchain</span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Your AI Wellness Companion
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70">
            Proof of human. Private by design. Yours forever.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!isConnected ? (
              // NOT connected: Start Your Journey (connect wallet)
              <Button
                className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
                onClick={handleStart}
                disabled={isPending}
              >
                {isPending ? 'Connecting...' : 'Start Your Journey'}
              </Button>
            ) : !isVerified ? (
              // Connected + NOT verified: Verify You Are Human
              <Button
                className="rounded-xl bg-[#22c55e] text-white hover:scale-105 hover:bg-[#22c55e]/90"
                onClick={() => router.push('/onboarding')}
              >
                🛡️ Verify You Are Human
              </Button>
            ) : !hasENS ? (
              // Connected + verified + NO ENS: Create ENS + View Dashboard
              <>
                <Button
                  className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
                  onClick={() => router.push('/onboarding')}
                >
                  Create ENS
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
                  onClick={() => router.push('/dashboard')}
                >
                  View Dashboard
                </Button>
              </>
            ) : (
              // Connected + verified + HAS ENS: View Dashboard only
              <Button
                className="rounded-xl bg-[#22c55e] text-white hover:scale-105 hover:bg-[#22c55e]/90"
                onClick={() => router.push('/dashboard')}
              >
                View Dashboard
              </Button>
            )}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-medium text-white">World</div>
              <div className="mt-1 text-xs text-white/60">World ID + AgentKit</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-medium text-white">ENS</div>
              <div className="mt-1 text-xs text-white/60">Agent subnames + records</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-medium text-white">0G</div>
              <div className="mt-1 text-xs text-white/60">Encrypted storage + compute</div>
            </div>
          </div>

          <div className="mt-10 text-xs text-white/50">Built at ETHGlobal Cannes 2026</div>
        </div>

        <div className="pointer-events-none flex items-center justify-center">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 h-[280px] w-[280px] rounded-full bg-[#c4b5fd]/20 animate-pulse blur-2xl" />
            {/* Breathing circle */}
            <div className="zen-hero-breathe h-[240px] w-[240px] rounded-full border-2 border-[#c4b5fd]/50 bg-gradient-to-br from-[#c4b5fd]/20 to-[#6ee7b7]/10 flex items-center justify-center shadow-2xl shadow-[#c4b5fd]/20">
              <div className="text-center">
                <div className="text-4xl mb-2">🧘</div>
                <div className="text-sm text-white/60">Breathe in</div>
                <div className="text-xs text-white/40 mt-1">4-4-4-4</div>
              </div>
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
              <div className="absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#c4b5fd]" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#6ee7b7]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
