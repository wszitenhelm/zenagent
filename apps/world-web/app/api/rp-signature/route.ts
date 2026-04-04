import { NextResponse } from 'next/server'
import { signRequest } from '@worldcoin/idkit-core/signing'

export async function POST(request: Request): Promise<Response> {
  const { action } = (await request.json()) as { action?: string }
  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  const signingKeyHex = process.env.WORLD_RP_SIGNING_KEY
  if (!signingKeyHex) return NextResponse.json({ error: 'Missing WORLD_RP_SIGNING_KEY' }, { status: 500 })

  const { sig, nonce, createdAt, expiresAt } = signRequest({
    signingKeyHex,
    action,
  })

  return NextResponse.json({
    sig,
    nonce,
    created_at: createdAt,
    expires_at: expiresAt,
  })
}
