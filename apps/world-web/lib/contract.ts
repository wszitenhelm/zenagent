import { createWalletClient, http, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'
import { publicClient } from '@/lib/publicClient'

export const ZENAGENT_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined) ||
  ('0xA53AEc82fEa6d20df89C2b7112aE0200ea37a088' as const)

export const zenAgentRegistryAbi = parseAbi([
  'function registerUser(string username) external',
  'function logCheckIn(uint8 mood,uint8 stress,uint8 sleep,string gratitude) external',
  'function setENSName(string ensName) external',
  'function getUserProfile(address user) external view returns (string username,uint256 streak,uint256 totalCheckIns,uint256 registeredAt,bool worldIDVerified,string ensName)',
  'function getBadges(address user) external view returns (bool sevenDay,bool thirtyDay,bool ninetyDay)',
  'function getStreak(address user) external view returns (uint256)',
  'function getTotalCheckIns(address user) external view returns (uint256)',
  'function getReferralCount(address user) external view returns (uint256)',
  'function isUsernameAvailable(string username) external view returns (bool)',
])

export function getPublicClient() {
  return publicClient
}

export function getWalletClient(account: any) {
  return createWalletClient({ account, chain: sepolia, transport: http() })
}

export async function getUserProfile(address: `0x${string}`) {
  return getPublicClient().readContract({
    address: ZENAGENT_REGISTRY_ADDRESS,
    abi: zenAgentRegistryAbi,
    functionName: 'getUserProfile',
    args: [address],
  })
}

export async function getBadges(address: `0x${string}`) {
  return getPublicClient().readContract({
    address: ZENAGENT_REGISTRY_ADDRESS,
    abi: zenAgentRegistryAbi,
    functionName: 'getBadges',
    args: [address],
  })
}

export async function getReferralCount(address: `0x${string}`) {
  return getPublicClient().readContract({
    address: ZENAGENT_REGISTRY_ADDRESS,
    abi: zenAgentRegistryAbi,
    functionName: 'getReferralCount',
    args: [address],
  })
}
