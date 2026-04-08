import { NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { saveCheckIn } from '@/lib/db'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      walletAddress?: string
      mood?: number
      stress?: number
      sleep?: number
      gratitude?: string
      journalHash?: string
    }

    const { walletAddress, mood, stress, sleep, gratitude, journalHash } = body

    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }
    if (typeof mood !== 'number' || typeof stress !== 'number' || typeof sleep !== 'number') {
      return NextResponse.json({ error: 'Missing mood/stress/sleep values' }, { status: 400 })
    }

    console.log('[checkin-api] Saving check-in for:', walletAddress)
    
    // Save to off-chain database
    const checkInData = {
      walletAddress: walletAddress.toLowerCase(),
      mood,
      stress,
      sleep,
      gratitude: gratitude || '',
      journalHash,
      timestamp: new Date().toISOString(),
    }
    console.log('[checkin-api] Check-in data:', checkInData)
    
    const stats = await saveCheckIn(checkInData)
    
    console.log('[checkin-api] Check-in saved. Streak:', stats.streak, 'Total:', stats.totalCheckIns)

    return NextResponse.json({ 
      success: true, 
      streak: stats.streak,
      totalCheckIns: stats.totalCheckIns 
    })
  } catch (err) {
    console.error('[checkin-api] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
