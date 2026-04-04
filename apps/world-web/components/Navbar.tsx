"use client"

import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            ZenAgent
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-white/70 md:flex">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/checkin" className="hover:text-white">
              Check In
            </Link>
            <Link href="/breathe" className="hover:text-white">
              Breathe
            </Link>
            <Link href="/insights" className="hover:text-white">
              Insights
            </Link>
            <Link href="/profile" className="hover:text-white">
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80 md:block">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </div>
              <Button
                variant="outline"
                className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending || connectors.length === 0}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
