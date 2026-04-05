"use client"

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { getBadges, getReferralCount, getUserProfile } from '@/lib/contract'
import { ENSCard } from '@/components/ENSCard'
import { getLevelFromStreak } from '@/lib/ens'

export default function ProfilePage() {
  const { address } = useAccount()
  const [nullifierHash, setNullifierHash] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)

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

  // Load nullifier and ENS from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('worldid_nullifier')
      if (stored) {
        setNullifierHash(stored)
      }
      const storedEns = localStorage.getItem('ens_name')
      setEnsName(storedEns)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!address) return
      const p = await getUserProfile(address)
      const b = await getBadges(address)
      const r = await getReferralCount(address)
      if (!mounted) return
      setProfile({
        username: p[0],
        streak: p[1],
        totalCheckIns: p[2],
        registeredAt: p[3],
        worldIDVerified: p[4],
        ensName: p[5],
      })
      setBadges({ sevenDay: b[0], thirtyDay: b[1], ninetyDay: b[2] })
      setReferrals(r)
    }
    run().catch(() => {
      if (!mounted) return
      setProfile(null)
      setBadges(null)
      setReferrals(null)
    })
    return () => {
      mounted = false
    }
  }, [address])

  const level = profile ? getLevelFromStreak(Number(profile.streak)) : 'Seedling 🌱'
  const avgMood = 7.2 // Demo value
  const lastCheckin = new Date().toISOString().split('T')[0]
  const badgesList = [
    badges?.sevenDay ? '7day' : null,
    badges?.thirtyDay ? '30day' : null,
    badges?.ninetyDay ? '90day' : null,
  ].filter(Boolean) as string[]

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* ENS Hero Card */}
      <ENSCard 
        ensName={ensName || profile?.ensName || undefined} 
        streak={profile ? Number(profile.streak) : 0}
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="text-xs text-white/60">Profile</div>
        <div className="mt-1 text-2xl font-semibold text-white">{address ? (ensName || profile?.username || 'agent-1') : 'Connect wallet'}</div>

        {address ? (
          <div className="mt-4 flex flex-col gap-2">
            <div
              className={`inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs ${profile?.worldIDVerified ? 'text-[#6ee7b7]' : 'text-[#fbbf24]'}`}
            >
              World ID {profile?.worldIDVerified ? 'verified' : 'not verified'}
            </div>
            {/* Nullifier Hash Display */}
            {nullifierHash && (
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
            <div className="text-xs text-white/60">Check-ins</div>
            <div className="mt-1 text-xl font-semibold text-white">{profile ? Number(profile.totalCheckIns) : 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Streak</div>
            <div className="mt-1 text-xl font-semibold text-white">{profile ? Number(profile.streak) : 0}🔥</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Badges</div>
            <div className="mt-2 flex gap-2 text-sm">
              <span className={badges?.sevenDay ? '' : 'text-white/40'}>🌱</span>
              <span className={badges?.thirtyDay ? '' : 'text-white/40'}>🌿</span>
              <span className={badges?.ninetyDay ? '' : 'text-white/40'}>🌳</span>
            </div>
          </div>
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
