import { NextResponse } from 'next/server'
import { uploadWellnessData } from '@/lib/0g'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { walletAddress, journal, gratitude, mood, stress, sleep, date } = body
    
    if (!walletAddress || !journal) {
      return NextResponse.json({ error: 'Missing walletAddress or journal' }, { status: 400 })
    }
    
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({ error: 'Missing PRIVATE_KEY' }, { status: 500 })
    }
    
    // Upload to 0G Storage (encrypted)
    const rootHash = await uploadWellnessData(
      { mood, stress, sleep, gratitude: gratitude || '', journal, date: date || new Date().toISOString() },
      walletAddress,
      privateKey
    )
    
    return NextResponse.json({
      success: true,
      rootHash,
      message: 'Journal encrypted and uploaded to 0G Storage',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[0G Upload Error]:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
