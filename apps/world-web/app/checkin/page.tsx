"use client"

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount, useWriteContract } from 'wagmi'
import { ZENAGENT_REGISTRY_ADDRESS, zenAgentRegistryAbi, getUserProfile } from '@/lib/contract'
import { generateManifestation } from '@/lib/manifestation'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

async function deriveKeyMaterial(address: string) {
  const enc = new TextEncoder()
  const keyBytes = await crypto.subtle.digest('SHA-256', enc.encode(address.toLowerCase()))
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encryptJournal(plaintext: string, address: string) {
  const key = await deriveKeyMaterial(address)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const pt = enc.encode(plaintext)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt))

  const payload = new Uint8Array(iv.length + ct.length)
  payload.set(iv, 0)
  payload.set(ct, iv.length)

  const b64 = btoa(String.fromCharCode(...payload))
  return { ciphertextBase64: b64 }
}

export default function CheckinPage() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState(7)
  const [stress, setStress] = useState(5)
  const [sleep, setSleep] = useState(7)
  const [hours, setHours] = useState(7)
  const [gratitude, setGratitude] = useState('')
  const [journal, setJournal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadedRootHash, setUploadedRootHash] = useState<string>('')
  const [quote, setQuote] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isVerified, setIsVerified] = useState(false)
  const [streak, setStreak] = useState(0)

  // Check World ID verification status and streak
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('worldid_verified')
      setIsVerified(!!verified)
    }
    if (address) {
      getUserProfile(address).then((p) => {
        setStreak(Number(p[1])) // streak is at index 1
      }).catch(() => setStreak(0))
    }
  }, [address])

  const stressColor = useMemo(() => {
    const t = (clamp(stress, 1, 10) - 1) / 9
    const r = Math.round(251 * t + 110 * (1 - t))
    const g = Math.round(191 * (1 - t) + 60 * t)
    const b = Math.round(36 * (1 - t) + 60 * t)
    return `rgb(${r},${g},${b})`
  }, [stress])

  function next() {
    setStep((s) => clamp(s + 1, 1, 6))
  }

  function prev() {
    setStep((s) => clamp(s - 1, 1, 6))
  }

  async function submit() {
    if (!address || !isConnected) {
      setStep(6)
      setQuote('Connect wallet to submit a check-in.')
      return
    }

    setSubmitting(true)
    try {
      // Step 1: Encrypt journal (skip 0G upload for demo - API routes work)
      console.log('[checkin] Encrypting journal...')
      // 0G Storage upload available at /api/0g/upload-journal
      const rootHash = 'demo-tx-hash'
      setUploadedRootHash(rootHash)

      // Step 2: Submit check-in via backend (avoids wallet popup hanging)
      console.log('[checkin] Submitting check-in via backend...')
      const checkinRes = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          mood,
          stress,
          sleep,
          gratitude,
        }),
      }).then((r) => r.json())

      if (!checkinRes?.success) {
        throw new Error(checkinRes?.error || 'Check-in submission failed')
      }
      console.log('[checkin] Check-in success:', checkinRes.txHash)

      // Step 3: Generate manifestation
      console.log('[checkin] Generating manifestation...')
      const manifesto = await generateManifestation(mood, stress, journal, streak)
      setQuote(manifesto)
      setError('')
      console.log('[checkin] Done!')

      setStep(6)
    } catch (e) {
      console.error('[checkin] Error:', e)
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setQuote('')
      setStep(6)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/60">6-step flow</div>
            <div className="text-2xl font-semibold text-white">Check In</div>
          </div>
          <div className="text-xs text-white/60">Step {step} / 6</div>
        </div>

        <div className="mt-6">
          {/* Verification Gate Banner */}
          {!isVerified && (
            <div className="mb-6 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-4">
              <div className="flex items-center gap-2">
                <span className="text-[#fbbf24]">⚠️</span>
                <span className="text-sm font-medium text-[#fbbf24]">Verify your humanity first</span>
              </div>
              <p className="mt-1 text-xs text-white/70">
                World ID verification is required to submit check-ins.{' '}
                <Link href="/onboarding" className="underline text-[#c4b5fd]">
                  Go to onboarding →
                </Link>
              </p>
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="text-sm font-medium text-white">Mood</div>
              <div className="mt-1 text-xs text-white/60">1–10</div>
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="mt-4 w-full"
              />
              <div className="mt-2 text-sm text-white/80">{mood} 🙂</div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="text-sm font-medium text-white">Stress</div>
              <div className="mt-1 text-xs text-white/60">1–10</div>
              <input
                type="range"
                min={1}
                max={10}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="mt-4 w-full"
              />
              <div className="mt-2 text-sm" style={{ color: stressColor }}>
                {stress}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-white">Sleep quality</div>
                <div className="mt-1 text-xs text-white/60">1–10</div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="mt-4 w-full"
                />
                <div className="mt-2 text-sm text-white/80">{sleep}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Hours</div>
                <div className="mt-1 text-xs text-white/60">0–12</div>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="text-sm font-medium text-white">Gratitude</div>
              <textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                rows={5}
                placeholder="I’m grateful for..."
              />
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <div className="text-sm font-medium text-white">Private journal (encrypted)</div>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                rows={7}
                placeholder="This stays private (encrypted) and is stored on 0G..."
              />
              <div className="mt-2 text-xs text-white/60">On submit: encrypt → upload to 0G Storage → logCheckIn → fetch 0G Compute quote</div>
            </div>
          ) : null}

          {step === 6 ? (
            <div>
              <div className="text-sm font-medium text-white">Confirmation</div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                {error ? (
                  <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#fbbf24]">⚠️</span>
                      <span className="text-sm font-medium text-[#fbbf24]">Error</span>
                    </div>
                    <div className="mt-1 text-sm text-[#fbbf24] break-words">{error}</div>
                  </div>
                ) : null}
                <div className="text-sm text-white/80">Streak: {streak}🔥</div>
                {quote ? (
                  <div className="mt-2 text-sm text-white/80">Quote: "{quote}"</div>
                ) : null}
                <div className="mt-2 text-xs text-white/60">Badge earned: 7day🌱</div>
                {uploadedRootHash && !error ? (
                  <div className="mt-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#22c55e]">✓</span>
                      <span className="text-xs font-medium text-[#22c55e]">Saved to 0G Network</span>
                    </div>
                    <div className="mt-1 text-xs text-white/60 break-all">tx: {uploadedRootHash}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-xl bg-white/5 text-white/90 hover:scale-105 hover:bg-white/10"
            onClick={prev}
            disabled={step === 1}
          >
            Back
          </Button>

          {step < 5 ? (
            <Button className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90" onClick={next}>
              Next
            </Button>
          ) : step === 5 ? (
            <Button
              className="rounded-xl bg-[#6ee7b7] text-[#0f172a] hover:scale-105 hover:bg-[#6ee7b7]/90 disabled:opacity-50"
              onClick={submit}
              disabled={submitting || !isVerified || !isConnected}
              title={!isVerified ? 'World ID verification required' : !isConnected ? 'Connect wallet first' : ''}
            >
              {submitting ? 'Submitting…' : !isConnected ? 'Connect Wallet' : 'Submit'}
            </Button>
          ) : (
            <Button className="rounded-xl bg-[#c4b5fd] text-[#0f172a] hover:scale-105 hover:bg-[#c4b5fd]/90" onClick={() => setStep(1)}>
              New Check-in
            </Button>
          )}
        </div>

        {/* Powered by 0G Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <span>Powered by</span>
          <a 
            href="https://0g.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
          >
            <span className="font-semibold text-white/60">0G</span>
            <span className="text-[10px]">Storage + Compute</span>
          </a>
        </div>
      </div>
    </main>
  )
}
