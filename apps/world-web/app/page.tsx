"use client";

import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const router = useRouter()

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4b5fd]/10 blur-3xl" />
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2">
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
            {isConnected ? (
              <Button
                className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
                onClick={() => router.push('/onboarding')}
              >
                Start Your Journey
              </Button>
            ) : (
              <Button
                className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isPending || connectors.length === 0}
              >
                Start Your Journey
              </Button>
            )}

            <Button
              variant="outline"
              className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
              onClick={() => router.push('/dashboard')}
            >
              View Dashboard
            </Button>
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

        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="h-[280px] w-[280px] rounded-full bg-[#c4b5fd]/15 blur-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="zen-breathe h-[220px] w-[220px] rounded-full border border-[#c4b5fd]/40 bg-[#c4b5fd]/10" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
