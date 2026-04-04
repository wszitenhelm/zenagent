"use client"

import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'

const points = [
  { mood: 6, stress: 7 },
  { mood: 7, stress: 6 },
  { mood: 5, stress: 8 },
  { mood: 8, stress: 4 },
  { mood: 7, stress: 5 },
]

export default function InsightsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
          <div className="text-sm font-medium text-white">Weekly AI Letter</div>
          <div className="mt-3 text-sm leading-relaxed text-white/75">
            Dear you — this week you showed up with honest check-ins even on harder days. Your stress dipped as your sleep stabilized.
            Keep stacking small wins: one breath, one gratitude, one step at a time.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-sm font-medium text-white">Habit tracker</div>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <label className="flex items-center gap-2"><input type="checkbox" /> Walk 10 min</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> No phone 1h</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Drink water</label>
          </div>
          <div className="mt-6 text-xs text-white/60">AI suggested habits</div>
          <div className="mt-2 grid gap-2 text-xs text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Evening stretch</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Morning sunlight</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">2-min journaling</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-2">
          <div className="text-sm font-medium text-white">Mood vs Stress</div>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis dataKey="mood" type="number" domain={[1, 10]} stroke="rgba(255,255,255,0.35)" />
                <YAxis dataKey="stress" type="number" domain={[1, 10]} stroke="rgba(255,255,255,0.35)" />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Scatter data={points} fill="#c4b5fd" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-sm font-medium text-white">Manifestation feed</div>
          <div className="mt-4 grid gap-2 text-sm text-white/75">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">“I move with calm confidence.”</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">“My habits are my identity.”</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">“Small actions become big change.”</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">“I am consistent and kind to myself.”</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">“Today is a clean slate.”</div>
          </div>
        </div>
      </div>
    </main>
  )
}
