import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      walletAddress?: string
      mood?: number
      stress?: number
      sleep?: number
      gratitude?: string
    }

    const { walletAddress, mood, stress, sleep, gratitude } = body

    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }
    if (typeof mood !== 'number' || typeof stress !== 'number' || typeof sleep !== 'number') {
      return NextResponse.json({ error: 'Missing mood/stress/sleep values' }, { status: 400 })
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
    const pk = process.env.PRIVATE_KEY
    const registryAddress = process.env.ZENAGENT_REGISTRY_ADDRESS as `0x${string}` | undefined

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

    const abi = parseAbi(['function logCheckIn(uint8 mood, uint8 stress, uint8 sleep, string gratitude) external'])

    const txHash = await client.writeContract({
      address: registryAddress,
      abi,
      functionName: 'logCheckIn',
      args: [mood, stress, sleep, gratitude || ''],
    })

    return NextResponse.json({ success: true, txHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
