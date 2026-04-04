import { NextResponse } from 'next/server'
import { createWalletClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { walletAddress?: string; username?: string }

    const walletAddress = body.walletAddress
    const username = body.username

    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: 'Missing/invalid walletAddress' }, { status: 400 })
    }
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 })
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
    if (account.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          error: 'walletAddress must match the backend signer address (PRIVATE_KEY)',
          signer: account.address,
          walletAddress,
        },
        { status: 400 },
      )
    }

    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const abi = parseAbi(['function registerUser(string username) external'])

    const txHash = await client.writeContract({
      address: registryAddress,
      abi,
      functionName: 'registerUser',
      args: [username],
    })

    return NextResponse.json({ success: true, txHash, walletAddress, username })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
