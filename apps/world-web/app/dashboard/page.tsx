"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'

const sample = [
  { day: 'Mon', mood: 6 },
  { day: 'Tue', mood: 7 },
  { day: 'Wed', mood: 5 },
  { day: 'Thu', mood: 8 },
  { day: 'Fri', mood: 7 },
  { day: 'Sat', mood: 8 },
  { day: 'Sun', mood: 9 },
]

export default function DashboardPage() {
  const { address } = useAccount()
  const router = useRouter()

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
              ENS: {address ? 'agent-1.zenagent.eth' : '—'}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
              Streak: 7🔥
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-[#6ee7b7] backdrop-blur-sm">
              World ID: Verified
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Mood History</div>
                <div className="text-xs text-white/60">Last 7 check-ins</div>
              </div>
            </div>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sample}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" />
                  <YAxis domain={[1, 10]} stroke="rgba(255,255,255,0.35)" />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="mood" stroke="#c4b5fd" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
              <div className="text-xs text-white/60">7-day 🌱 in 0 days</div>
            </div>
            <div className="mt-4 h-3 w-full rounded-full bg-white/10">
              <div className="h-3 w-[35%] rounded-full bg-[#c4b5fd]" />
            </div>
            <div className="mt-6 text-sm text-white/70">Community pulse: Today 42 people checked in</div>
          </div>
        </div>
      </div>
    </main>
  )
}
