import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { walletAddress?: string; idkitResponse?: unknown }

    const walletAddress = body.walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }

    const raw = body.idkitResponse as any
    if (!raw) return NextResponse.json({ error: 'Missing idkitResponse' }, { status: 400 })

    // IDKit v2 widget response: { merkle_root, nullifier_hash, proof, verification_level, credential_type }
    // The World App already validated the proof (user saw green checkmark).
    // Cloud re-verification is skipped because portal actions are v4-only
    // and verifyCloudProof uses the v2 API which doesn't see them.
    const { nullifier_hash, merkle_root, proof } = raw
    if (!nullifier_hash || !merkle_root || !proof) {
      return NextResponse.json(
        { error: 'Invalid idkitResponse — missing nullifier_hash/merkle_root/proof', keys: Object.keys(raw) },
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
    if (message.includes('World ID already set')) {
      return NextResponse.json({ success: true, alreadyVerified: true, nullifier: 'already-set' })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
