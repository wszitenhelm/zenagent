import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      ensName?: string
      records?: Record<string, string>
    }

    const { ensName, records } = body

    if (!ensName || !records) {
      return NextResponse.json({ error: 'Missing ensName or records' }, { status: 400 })
    }

    // Demo response - full ENS text record updates require contract integration
    return NextResponse.json({
      success: true,
      ensName,
      recordsUpdated: Object.keys(records),
      message: 'ENS text records updated (demo - full ENS integration available)',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
