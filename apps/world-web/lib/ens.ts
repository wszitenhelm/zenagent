import { createPublicClient, createWalletClient, http, type WalletClient } from 'viem'
import { sepolia } from 'viem/chains'
import { addEnsContracts } from '@ensdomains/ensjs'

const ZENAGENT_ETH = 'zenagent.eth'

export function getEnsPublicClient() {
  return createPublicClient({ chain: addEnsContracts(sepolia), transport: http() })
}

function getLevel(streak: number): string {
  if (streak < 7) return 'Seedling 🌱'
  if (streak < 30) return 'Growing 🌿'
  if (streak < 60) return 'Blooming 🌸'
  if (streak < 90) return 'Thriving 🌳'
  return 'Zen Master ☯️'
}

export async function checkAvailability(username: string): Promise<boolean> {
  try {
    const publicClient = getEnsPublicClient()
    const fullName = `${username}.${ZENAGENT_ETH}`
    
    // Check if name is available by trying to get address record
    const records = await publicClient.getEnsAddress({ name: fullName })
    return !records // If no address set, name is available
  } catch {
    return true // Assume available if check fails
  }
}

export async function mintSubname(
  username: string,
  userAddress: string,
  walletClient: WalletClient
): Promise<{ ensName: string; txHash: string }> {
  const fullName = `${username}.${ZENAGENT_ETH}`
  
  // Use backend API for minting to avoid wallet popup issues
  const res = await fetch('/api/ens/mint-subname', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username,
      userAddress,
      parentDomain: ZENAGENT_ETH,
    }),
  }).then((r) => r.json())

  if (!res?.success) {
    throw new Error(res?.error || 'ENS subname minting failed')
  }

  return { ensName: fullName, txHash: res.txHash }
}

export async function updateWellnessTextRecords(
  ensName: string,
  records: {
    streak: number
    level?: string
    lastCheckin: string
    avgMood: number
    badges: string[]
    totalCheckins: number
  },
  walletClient: WalletClient
): Promise<void> {
  const level = records.level || getLevel(records.streak)
  
  const textRecords = {
    'wellness.streak': String(records.streak),
    'wellness.level': level,
    'wellness.lastCheckin': records.lastCheckin,
    'wellness.avgMood': String(records.avgMood),
    'wellness.badges': records.badges.join(','),
    'wellness.totalCheckins': String(records.totalCheckins),
    'agent.name': 'ZenAgent',
    'agent.specialty': 'crypto-wellness',
    'description': 'ZenAgent wellness companion - ETHGlobal Cannes 2026',
  }

  // Use backend API to update records
  const res = await fetch('/api/ens/update-records', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ensName,
      records: textRecords,
    }),
  }).then((r) => r.json())

  if (!res?.success) {
    throw new Error(res?.error || 'ENS records update failed')
  }
}

export function getLevelFromStreak(streak: number): string {
  return getLevel(streak)
}
