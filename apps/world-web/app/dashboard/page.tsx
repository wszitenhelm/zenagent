"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/contract'
import { getLocalEntries } from '@/lib/localStorage'
import { getENSName, isHumanVerified } from '@/lib/walletStorage'

export default function DashboardPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [streak, setStreak] = useState(0) // Real value from contract
  const [isVerified, setIsVerified] = useState(false)
  const [moodData, setMoodData] = useState<{ day: string; mood: number }[]>([])
  const [totalCheckIns, setTotalCheckIns] = useState(0) // Real value from contract

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load wallet data
  useEffect(() => {
    if (address) {
      setEnsName(getENSName(address))
      setIsVerified(isHumanVerified(address))
    }
  }, [address])

  useEffect(() => {
    const loadData = async () => {
      if (!address) return
      try {
        const profile = await getUserProfile(address)
        // Real values from contract
        setStreak(Number(profile[1])) // streak at index 1
        setTotalCheckIns(Number(profile[2])) // totalCheckIns at index 2
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
    }
    loadData()
  }, [address])

  useEffect(() => {
    const entries = getLocalEntries()
    const chartData = entries.slice(-7).map((entry, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
      mood: entry.mood
    }))
    if (chartData.length === 0) {
      setMoodData([
        { day: 'Start', mood: 5 },
      ])
    } else {
      setMoodData(chartData)
    }
  }, [totalCheckIns])

  const progressToNextBadge = streak < 7 ? (streak / 7) * 100 : streak < 30 ? ((streak - 7) / 23) * 100 : streak < 90 ? ((streak - 30) / 60) * 100 : 100
  const nextBadgeDays = streak < 7 ? 7 - streak : streak < 30 ? 30 - streak : streak < 90 ? 90 - streak : 0
  const nextBadgeName = streak < 7 ? '7-day 🌱' : streak < 30 ? '30-day 🌿' : streak < 90 ? '90-day 🌳' : 'Zen Master ☯️'

  // Prevent hydration mismatch - use consistent placeholder until mounted
  const ensDisplay = !mounted ? '—' : (ensName || (address ? 'Not set' : '—'))
  const worldIdDisplay = !mounted ? '—' : (isVerified ? 'Verified' : 'Not Verified')

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">Welcome back</div>
            <div className="text-2xl font-semibold text-white">Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
              ENS: {ensDisplay}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
              Streak: {!mounted ? '—' : streak}🔥
            </div>
            <div className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs backdrop-blur-sm ${!mounted ? '' : isVerified ? 'text-[#6ee7b7]' : 'text-[#fbbf24]'}`}>
              World ID: {worldIdDisplay}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Mood History</div>
                <div className="text-xs text-white/60">Last {moodData.length} check-ins</div>
              </div>
            </div>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" />
                  <YAxis domain={[1, 10]} stroke="rgba(255,255,255,0.35)" />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="mood" stroke="#c4b5fd" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {moodData.length <= 1 && (
              <div className="mt-4 text-xs text-white/50 text-center">
                Complete your first check-in to see your mood history here
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-sm font-medium text-white">Today's Manifestation</div>
            <div className="mt-3 text-sm text-white/80">
              “You are building calm momentum, one check-in at a time.”
            </div>
            <div className="mt-4 flex gap-3">
              <Button className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90">Refresh</Button>
              <Button variant="outline" className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10">
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-sm font-medium text-white">Quick Actions</div>
            <div className="mt-4 grid gap-3">
              <Button
                className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90"
                onClick={() => router.push('/checkin')}
              >
                Check In
              </Button>
              <Button
                variant="outline"
                className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
                onClick={() => router.push('/breathe')}
              >
                Breathe
              </Button>
              <Button
                variant="outline"
                className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
                onClick={() => router.push('/checkin')}
              >
                Gratitude
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Streak</div>
                <div className="text-xs text-white/60">Badge progress</div>
              </div>
              <div className="text-xs text-white/60">{nextBadgeName} in {nextBadgeDays} days</div>
            </div>
            <div className="mt-4 h-3 w-full rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-[#c4b5fd] transition-all" style={{ width: `${Math.min(progressToNextBadge, 100)}%` }} />
            </div>
            <div className="mt-6 text-sm text-white/70">Total check-ins: 1</div>
          </div>
        </div>
      </div>
    </main>
  )
}
