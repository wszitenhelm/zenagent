"use client"

import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [demoDismissed, setDemoDismissed] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  // Check World ID verification status and ENS name
  useEffect(() => {
    const checkStorage = () => {
      if (typeof window !== 'undefined') {
        // Only show verified/ENS if wallet is connected
        if (!isConnected) {
          setIsVerified(false)
          setEnsName(null)
          return
        }
        const verified = localStorage.getItem('worldid_verified')
        setIsVerified(!!verified)
        const storedEns = localStorage.getItem('ens_name')
        setEnsName(storedEns)
        const dismissed = localStorage.getItem('demo_dismissed')
        setDemoDismissed(!!dismissed)
      }
    }
    
    checkStorage()
    
    // Refresh on window focus (when user returns to tab)
    const handleFocus = () => checkStorage()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [isConnected])

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
          {!mounted ? (
            <span className="text-xs text-white/40">Loading…</span>
          ) : isConnected ? (
            <div className="flex items-center gap-3">
              {/* Human Verified Shield */}
              {isVerified && (
                <div 
                  className="hidden md:flex items-center gap-1 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-1"
                  title="Verified without revealing identity"
                >
                  <span className="text-[#22c55e]">🛡️</span>
                  <span className="text-xs text-[#22c55e]">Human Verified</span>
                </div>
              )}
              {/* ENS Name Display */}
              {ensName && (
                <div className="hidden md:flex items-center gap-1 rounded-xl border border-[#c4b5fd]/30 bg-[#c4b5fd]/10 px-2 py-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#c4b5fd]" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="text-xs text-[#c4b5fd]">{ensName}</span>
                </div>
              )}
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
            <div className="flex items-center gap-2">
              {connectors.length > 0 ? (
                connectors.slice(0, 3).map((connector) => (
                  <Button
                    key={connector.uid}
                    className="rounded-xl bg-[#c4b5fd] text-[#0f172a] text-xs hover:scale-105 hover:bg-[#c4b5fd]/90"
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                  >
                    {connector.name}
                  </Button>
                ))
              ) : (
                <span className="text-xs text-white/50">No wallet detected</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
