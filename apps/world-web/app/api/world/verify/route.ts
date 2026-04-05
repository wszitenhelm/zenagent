import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const EXPECTED_ACTION = 'zenagent-checkin'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { walletAddress?: string; idkitResponse?: unknown }

    const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID
    if (!appId) return NextResponse.json({ error: 'Missing NEXT_PUBLIC_WORLD_APP_ID' }, { status: 500 })

    const walletAddress = body.walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }

    const raw = body.idkitResponse as any
    if (!raw) return NextResponse.json({ error: 'Missing idkitResponse' }, { status: 400 })

    // IDKit v2 returns: { merkle_root, nullifier_hash, proof, verification_level, credential_type }
    const { merkle_root, nullifier_hash, proof } = raw
    if (!merkle_root || !nullifier_hash || !proof) {
      return NextResponse.json(
        { error: 'Invalid idkitResponse', keys: Object.keys(raw) },
        { status: 400 },
      )
    }

    // Verify with World v2 API
    const verifyBody = {
      merkle_root,
      nullifier_hash,
      proof,
      action: EXPECTED_ACTION,
      signal_hash: raw.signal_hash || undefined,
    }

    const verifyRes = await fetch(`https://developer.worldcoin.org/api/v2/verify/${appId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(verifyBody),
    })

    if (!verifyRes.ok) {
      const text = await verifyRes.text().catch(() => '')
      return NextResponse.json(
        { error: 'World proof verification failed', status: verifyRes.status, details: text },
        { status: 400 },
      )
    }

    // Write nullifier onchain
    const nullifier = nullifier_hash as `0x${string}`
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

    // Use backend signer address (registered onchain) for the contract call
    const registeredUser = account.address

    const txHash = await client.writeContract({
      address: registryAddress,
      abi,
      functionName: 'setWorldIDVerified',
      args: [registeredUser, nullifier],
    })

    return NextResponse.json({ success: true, nullifier, txHash, verifiedAddress: registeredUser })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
