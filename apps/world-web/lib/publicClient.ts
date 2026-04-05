import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const rpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  process.env.SEPOLIA_RPC_URL ||
  'https://rpc.sepolia.org'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
})
