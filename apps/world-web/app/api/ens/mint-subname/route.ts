import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      username?: string
      userAddress?: string
      parentDomain?: string
    }

    const { username, userAddress, parentDomain } = body

    if (!username || !userAddress || !isAddress(userAddress)) {
      return NextResponse.json({ error: 'Missing/invalid username or userAddress' }, { status: 400 })
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
    const pk = process.env.PRIVATE_KEY

    if (!pk) return NextResponse.json({ error: 'Missing PRIVATE_KEY' }, { status: 500 })

    const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`))
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })

    // Demo response - full ENS subname minting requires ENS contract integration
    const demoTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')

    return NextResponse.json({
      success: true,
      txHash: demoTxHash,
      ensName: `${username}.${parentDomain || 'zenagent.eth'}`,
      message: 'ENS subname minted (demo - full ENS integration requires contract setup)',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
