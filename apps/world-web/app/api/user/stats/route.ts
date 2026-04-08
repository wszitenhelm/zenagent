import { NextResponse } from 'next/server'
import { getUserStats } from '@/lib/db'
import { isAddress } from 'viem'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Missing/invalid address' }, { status: 400 })
    }
    
    const stats = await getUserStats(address)
    
    return NextResponse.json({ 
      success: true, 
      streak: stats.streak,
      totalCheckIns: stats.totalCheckIns 
    })
  } catch (err) {
    console.error('[user-stats-api] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
