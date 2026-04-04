import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const EXPECTED_ACTION = 'zenagent-checkin'

type IDKitV4Response = {
  protocol_version: string
  action: string
  responses: Array<{
    identifier: string
    merkle_root: `0x${string}`
    nullifier: `0x${string}`
    proof: `0x${string}`
    signal_hash: `0x${string}`
    max_age?: number
  }>
}

function getNullifier(idkitResponse: IDKitV4Response): `0x${string}` {
  const n = idkitResponse?.responses?.[0]?.nullifier
  if (!n) throw new Error('Missing nullifier in idkitResponse')
  return n
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { walletAddress?: string; idkitResponse?: IDKitV4Response }

    const rpId = process.env.WORLD_RP_ID
    if (!rpId) return NextResponse.json({ error: 'Missing WORLD_RP_ID' }, { status: 500 })

    const walletAddress = body.walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }

    const idkitResponse = body.idkitResponse
    if (!idkitResponse) return NextResponse.json({ error: 'Missing idkitResponse' }, { status: 400 })

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
      return NextResponse.json({ error: 'World proof verification failed', details: text }, { status: 400 })
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
