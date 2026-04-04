import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const EXPECTED_ACTION = 'zenagent-checkin'

type VerifyPayload = {
  protocol_version: string
  action: string
  nonce?: string
  environment?: string
  responses: Array<{
    identifier: string
    merkle_root: `0x${string}`
    nullifier: `0x${string}`
    proof: string
    signal_hash: `0x${string}`
    max_age?: number
  }>
}

type WidgetCompactResponse = {
  merkle_root?: `0x${string}`
  nullifier_hash?: `0x${string}`
  proof?: unknown
  credential_type?: string
  signal_hash?: `0x${string}`
}

function getNullifier(payload: VerifyPayload): `0x${string}` {
  const n = payload?.responses?.[0]?.nullifier
  if (!n) throw new Error('Missing nullifier in idkitResponse')
  return n
}

function normalizeToVerifyPayload(input: unknown): VerifyPayload {
  if (!input || typeof input !== 'object') throw new Error('Invalid idkitResponse')

  const asAny = input as any

  const normalizeProofValue = (value: unknown) => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return JSON.stringify(value.map((v) => (typeof v === 'bigint' ? v.toString(10) : String(v))))
    if (typeof value === 'object' && value !== null) return JSON.stringify(value)
    return String(value)
  }

  if (typeof asAny.protocol_version === 'string' && Array.isArray(asAny.responses)) {
    const p = asAny as VerifyPayload
    if (p.responses?.[0] && typeof (p.responses[0] as any).proof !== 'string') {
      ;(p.responses[0] as any).proof = normalizeProofValue((p.responses[0] as any).proof)
    }
    return p
  }

  const compact = asAny as WidgetCompactResponse
  if (!compact.merkle_root || !compact.nullifier_hash || !compact.proof || !compact.signal_hash) {
    const keys = Object.keys(asAny || {})
    throw new Error(
      `Unsupported idkitResponse shape (missing merkle_root/nullifier_hash/proof/signal_hash). keys=${JSON.stringify(keys)}`,
    )
  }

  let proof: any = compact.proof
  proof = normalizeProofValue(proof)
  if (typeof proof !== 'string') {
    throw new Error('Unsupported idkitResponse shape (proof must be a string or array/object that can be JSON-encoded)')
  }

  return {
    protocol_version: '3.0',
    action: EXPECTED_ACTION,
    nonce: '0x0',
    responses: [
      {
        identifier: (compact.credential_type || 'orb') as string,
        merkle_root: compact.merkle_root,
        nullifier: compact.nullifier_hash,
        proof,
        signal_hash: compact.signal_hash,
      },
    ],
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { walletAddress?: string; idkitResponse?: unknown }

    const rpId = process.env.WORLD_RP_ID
    if (!rpId) return NextResponse.json({ error: 'Missing WORLD_RP_ID' }, { status: 500 })

    const walletAddress = body.walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }

    const raw = body.idkitResponse
    if (!raw) return NextResponse.json({ error: 'Missing idkitResponse' }, { status: 400 })

    const idkitResponse = normalizeToVerifyPayload(raw)

    if (idkitResponse.action !== EXPECTED_ACTION) {
      return NextResponse.json(
        { error: 'Action mismatch', expected: EXPECTED_ACTION, received: idkitResponse.action },
        { status: 400 },
      )
    }

    const verifyRes = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(idkitResponse),
    })

    if (!verifyRes.ok) {
      const text = await verifyRes.text().catch(() => '')
      return NextResponse.json(
        {
          error: 'World proof verification failed',
          status: verifyRes.status,
          sent: {
            protocol_version: idkitResponse.protocol_version,
            action: idkitResponse.action,
            identifier: idkitResponse.responses?.[0]?.identifier,
            proofType: typeof idkitResponse.responses?.[0]?.proof,
            proofPreview: typeof idkitResponse.responses?.[0]?.proof === 'string' ? idkitResponse.responses[0].proof.slice(0, 32) : null,
          },
          details: text,
        },
        { status: 400 },
      )
    }

    const nullifier = getNullifier(idkitResponse)
    if (!/^0x[0-9a-fA-F]{64}$/.test(nullifier)) {
      return NextResponse.json({ error: 'Invalid nullifier format' }, { status: 400 })
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL
    const pk = process.env.PRIVATE_KEY
    const registryAddress = process.env.ZENAGENT_REGISTRY_ADDRESS

    if (!rpcUrl) return NextResponse.json({ error: 'Missing SEPOLIA_RPC_URL' }, { status: 500 })
    if (!pk) return NextResponse.json({ error: 'Missing PRIVATE_KEY' }, { status: 500 })
    if (!registryAddress || !isAddress(registryAddress)) {
      return NextResponse.json({ error: 'Missing/invalid ZENAGENT_REGISTRY_ADDRESS' }, { status: 500 })
    }

    const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`))
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const abi = parseAbi(['function setWorldIDVerified(address user, bytes32 nullifierHash) external'])

    const txHash = await client.writeContract({
      address: registryAddress,
      abi,
      functionName: 'setWorldIDVerified',
      args: [walletAddress, nullifier],
    })

    return NextResponse.json({ success: true, nullifier, txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
