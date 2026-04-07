import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, namehash, parseAbi, keccak256, toHex, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

// ENS Registry ABI
const ensRegistryAbi = parseAbi([
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
  'function owner(bytes32 node) external view returns (address)',
])

// Public Resolver ABI
const publicResolverAbi = parseAbi([
  'function setAddr(bytes32 node, address a) external',
  'function setText(bytes32 node, string key, string value) external',
])

// Sepolia ENS contracts
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const PUBLIC_RESOLVER = '0x4677e7b99739e6e05a8655848e1e371604dc7386' // Sepolia public resolver (lowercase)

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

    const parentName = parentDomain || 'zenagent.eth'
    const fullName = `${username}.${parentName}`
    
    // Calculate namehash and labelhash
    const parentNode = namehash(parentName)
    const label = keccak256(toHex(username)) // Proper labelhash
    const subnode = namehash(fullName)

    // Check if parent domain owner matches the private key address
    const parentOwner = await publicClient.readContract({
      address: ENS_REGISTRY,
      abi: ensRegistryAbi,
      functionName: 'owner',
      args: [parentNode],
    })

    if (parentOwner.toLowerCase() !== account.address.toLowerCase()) {
      return NextResponse.json({ 
        error: `Not owner of ${parentName}. Owner: ${parentOwner}, Your address: ${account.address}` 
      }, { status: 403 })
    }

    // Mint subname using setSubnodeRecord
    // This creates the subname, sets the owner to the user, and sets the resolver
    const txHash = await walletClient.writeContract({
      address: ENS_REGISTRY,
      abi: ensRegistryAbi,
      functionName: 'setSubnodeRecord',
      args: [
        parentNode,
        label,
        userAddress as `0x${string}`,
        PUBLIC_RESOLVER,
        BigInt(0), // ttl
      ],
    })

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      txHash,
      ensName: fullName,
      subnode,
      message: `ENS subname ${fullName} minted successfully with public resolver`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ENS Mint Error]:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
