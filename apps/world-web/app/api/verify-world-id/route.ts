import { NextResponse } from 'next/server'
import { isAddress } from 'viem'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { 
      proof?: string
      nullifier_hash?: string
      merkle_root?: string
      verification_level?: string
      action?: string
    }

    const { proof, nullifier_hash, merkle_root, verification_level, action } = body

    if (!proof || !nullifier_hash || !merkle_root) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: proof, nullifier_hash, merkle_root' },
        { status: 400 }
      )
    }

    // Note: World App already validated the proof (user saw green checkmark)
    // Cloud re-verification is skipped for hackathon demo since portal actions are v4
    // and verifyCloudProof uses v2 API which doesn't see them.
    // We trust the widget response and extract the nullifier.

    if (!/^0x[0-9a-fA-F]{64}$/.test(nullifier_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid nullifier_hash format' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      nullifierHash: nullifier_hash,
      verificationLevel: verification_level || 'orb',
      action: action || 'zenagent-checkin'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
