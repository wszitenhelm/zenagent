"use client"

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { getBadges, getReferralCount, getUserProfile } from '@/lib/contract'
import { ENSCard } from '@/components/ENSCard'
import { getLevelFromStreak } from '@/lib/ens'
import { getLocalEntries } from '@/lib/localStorage'
import { getWalletData, isHumanVerified, getENSName, setWalletData } from '@/lib/walletStorage'

export default function ProfilePage() {
  const { address } = useAccount()
  const [nullifierHash, setNullifierHash] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [entries, setEntries] = useState<Array<{date: string, mood: number}>>([])

  const [profile, setProfile] = useState<{
    username: string
    streak: bigint
    totalCheckIns: bigint
    registeredAt: bigint
    worldIDVerified: boolean
    ensName: string
  } | null>(null)
  const [badges, setBadges] = useState<{ sevenDay: boolean; thirtyDay: boolean; ninetyDay: boolean } | null>(null)
  const [referrals, setReferrals] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  // Load wallet-based data
  useEffect(() => {
    if (address) {
      const walletData = getWalletData(address)
      setNullifierHash(walletData.worldIdNullifier)
      setEnsName(walletData.ensName)
      setIsVerified(isHumanVerified(address))
    }
  }, [address])

  // Refresh data when page loads or becomes visible
  const loadData = async () => {
    if (!address) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      console.log('[profile] Loading data for address:', address)
      const p = await getUserProfile(address)
      console.log('[profile] Contract data:', { username: p[0], streak: p[1]?.toString(), totalCheckIns: p[2]?.toString(), worldIDVerified: p[4], ensName: p[5] })
      const r = await getReferralCount(address)
      setProfile({
        username: p[0],
        streak: p[1], // Real value from contract
        totalCheckIns: p[2], // Real value from contract
        registeredAt: p[3],
        worldIDVerified: p[4],
        ensName: p[5],
      })
      const b = await getBadges(address)
      setBadges({ sevenDay: b[0], thirtyDay: b[1], ninetyDay: b[2] }) // Convert tuple to object
      setReferrals(r)
      
      // Sync contract data to wallet storage
      if (p[5] && p[5].length > 0) {
        setWalletData(address, {
          ensName: p[5],
          username: p[0],
        })
        setEnsName(p[5])
      }
      if (p[4]) {
        setWalletData(address, {
          humanVerified: true,
        })
        setIsVerified(true)
      }
      
      // Also update localStorage entries
      const localEntries = getLocalEntries()
      setEntries(localEntries)
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    
    // Refresh every 5 seconds when on profile page
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadData()
    }, 5000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [address])

  const level = profile ? getLevelFromStreak(Number(profile.streak)) : 'Seedling 🌱'
  const avgMood = entries.length > 0 
    ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
    : '7.2'
  const lastCheckin = entries.length > 0 
    ? entries[entries.length - 1].date 
    : new Date().toISOString().split('T')[0]
  const badgesList = [
    badges?.sevenDay ? '7day' : null,
    badges?.thirtyDay ? '30day' : null,
    badges?.ninetyDay ? '90day' : null,
  ].filter(Boolean) as string[]

  // Use both contract data and localStorage for verification status
  const worldIdVerified = profile?.worldIDVerified || isVerified || !!nullifierHash

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* ENS Hero Card */}
      <ENSCard 
        ensName={ensName || profile?.ensName || undefined} 
        streak={profile ? Number(profile.streak) : 0}
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="text-xs text-white/60">Profile</div>
        <div className="mt-1 text-2xl font-semibold text-white">
          {!mounted ? '...' : (address ? (ensName || profile?.username || 'agent-1') : 'Connect wallet')}
          {loading && address && (
            <span className="ml-2 text-xs text-white/40">(syncing...)</span>
          )}
        </div>

        {address ? (
          <div className="mt-4 flex flex-col gap-2">
            <div
              className={`inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs ${worldIdVerified ? 'text-[#6ee7b7]' : 'text-[#fbbf24]'}`}
            >
              World ID {worldIdVerified ? 'verified ✓' : 'not verified'}
            </div>
            {/* Nullifier Hash Display */}
            {nullifierHash && worldIdVerified && (
              <div 
                className="inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 text-xs text-[#22c55e] cursor-help"
                title="Verified without revealing identity"
              >
                <span>Nullifier:</span>
                <span className="font-mono">{nullifierHash.slice(0, 10)}…{nullifierHash.slice(-6)}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Total Check-ins</div>
            <div className="mt-1 text-xl font-semibold text-white">
              {profile ? Number(profile.totalCheckIns).toString() : '0'}
            </div>
            <div className="text-xs text-white/40 mt-1">Onchain count</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Current Streak</div>
            <div className="mt-1 text-xl font-semibold text-white">
              {profile ? Number(profile.streak).toString() : '0'}🔥
            </div>
            <div className="text-xs text-white/40 mt-1">Days in a row</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Badges Earned</div>
            <div className="mt-2 flex gap-2 text-lg">
              <span title={badges?.sevenDay ? '7-day streak earned!' : 'Complete 7 days'} className={badges?.sevenDay ? '' : 'opacity-30 grayscale'}>🌱</span>
              <span title={badges?.thirtyDay ? '30-day streak earned!' : 'Complete 30 days'} className={badges?.thirtyDay ? '' : 'opacity-30 grayscale'}>🌿</span>
              <span title={badges?.ninetyDay ? '90-day streak earned!' : 'Complete 90 days'} className={badges?.ninetyDay ? '' : 'opacity-30 grayscale'}>🌳</span>
            </div>
            <div className="text-xs text-white/40 mt-1">
              {badgesList.length > 0 ? `${badgesList.length} earned` : 'Keep going!'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => loadData()}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
            disabled={loading}
          >
            {loading ? '↻ Syncing...' : '↻ Refresh data'}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-medium text-white">Referral</div>
          <div className="mt-2 text-sm text-white/70">
            Count: {referrals ? Number(referrals) : 0}
          </div>
          {ensName && (
            <div className="mt-2 text-xs text-[#c4b5fd]">
              Referral link: zenagent.app/join?ref={ensName}
            </div>
          )}
        </div>

        {/* ENS Text Records */}
        {ensName && (
          <div className="mt-8 rounded-2xl border border-[#c4b5fd]/20 bg-[#c4b5fd]/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#c4b5fd]">ENS Text Records</div>
              <button 
                className="text-xs text-white/60 hover:text-white"
                onClick={() => navigator.clipboard.writeText(ensName)}
              >
                Share
              </button>
            </div>
            <div className="mt-3 grid gap-2 text-xs">
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.streak</span>
                <span className="text-white">{profile ? Number(profile.streak).toString() : '0'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.level</span>
                <span className="text-white">{level}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.lastCheckin</span>
                <span className="text-white">{lastCheckin}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.avgMood</span>
                <span className="text-white">{avgMood}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.badges</span>
                <span className="text-white">{badgesList.join(',') || 'none'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">wellness.totalCheckins</span>
                <span className="text-white">{profile ? Number(profile.totalCheckIns).toString() : '0'}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">agent.name</span>
                <span className="text-white">ZenAgent</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1">
                <span className="text-white/60">agent.specialty</span>
                <span className="text-white">crypto-wellness</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/60">description</span>
                <span className="text-white text-right max-w-[200px]">ZenAgent wellness companion ETHGlobal Cannes 2026</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-white/60">Stored privately on 0G</div>
      </div>
    </main>
  )
}
