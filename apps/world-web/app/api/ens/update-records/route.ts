import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, namehash, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

// ENS Public Resolver ABI for setText
const resolverAbi = parseAbi([
  'function setText(bytes32 node, string key, string value) external',
])

// ENS Registry ABI for getting resolver
const registryAbi = parseAbi([
  'function resolver(bytes32 node) external view returns (address)',
])

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

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

    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
    const pk = process.env.PRIVATE_KEY

    if (!pk) {
      return NextResponse.json({ error: 'Missing PRIVATE_KEY' }, { status: 500 })
    }

    const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`))
    
    // Public client for reading
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    })
    
    // Wallet client for writing
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    })

    const node = namehash(ensName)
    
    // Get the resolver address for this name
    const resolverAddress = await publicClient.readContract({
      address: ENS_REGISTRY,
      abi: registryAbi,
      functionName: 'resolver',
      args: [node],
    })

    if (!resolverAddress || resolverAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ error: 'No resolver set for this ENS name' }, { status: 400 })
    }

    // Update each text record
    const updatedKeys: string[] = []
    for (const [key, value] of Object.entries(records)) {
      try {
        const txHash = await walletClient.writeContract({
          address: resolverAddress,
          abi: resolverAbi,
          functionName: 'setText',
          args: [node, key, value],
        })
        updatedKeys.push(key)
        console.log(`[ENS] Updated ${key}: ${txHash}`)
      } catch (err) {
        console.error(`[ENS] Failed to update ${key}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      ensName,
      recordsUpdated: updatedKeys,
      resolverAddress,
      message: `ENS text records updated onchain: ${updatedKeys.join(', ')}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ENS Update Error]:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
