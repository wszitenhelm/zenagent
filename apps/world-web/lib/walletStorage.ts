// Wallet-based storage system
// Each wallet address has its own verification and ENS data

export interface WalletData {
  humanVerified: boolean
  ensName: string | null
  worldIdNullifier: string | null
  username: string | null
  verifiedAt: string | null
}

const STORAGE_KEY = 'zenagent_wallets'

export function getWalletData(address: string): WalletData {
  if (typeof window === 'undefined') {
    return { humanVerified: false, ensName: null, worldIdNullifier: null, username: null, verifiedAt: null }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  const wallets: Record<string, WalletData> = stored ? JSON.parse(stored) : {}
  
  return wallets[address.toLowerCase()] || {
    humanVerified: false,
    ensName: null,
    worldIdNullifier: null,
    username: null,
    verifiedAt: null,
  }
}

export function setWalletData(address: string, data: Partial<WalletData>): void {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem(STORAGE_KEY)
  const wallets: Record<string, WalletData> = stored ? JSON.parse(stored) : {}
  
  const existing = wallets[address.toLowerCase()] || {
    humanVerified: false,
    ensName: null,
    worldIdNullifier: null,
    username: null,
    verifiedAt: null,
  }
  
  wallets[address.toLowerCase()] = {
    ...existing,
    ...data,
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets))
}

export function isHumanVerified(address: string): boolean {
  return getWalletData(address).humanVerified
}

export function getENSName(address: string): string | null {
  return getWalletData(address).ensName
}

// Migration from old storage format
export function migrateOldStorage(address: string): void {
  if (typeof window === 'undefined') return
  
  const oldVerified = localStorage.getItem('worldid_verified')
  const oldEns = localStorage.getItem('ens_name')
  const oldNullifier = localStorage.getItem('worldid_nullifier')
  const oldUsername = localStorage.getItem('username')
  
  if (oldVerified && address) {
    setWalletData(address, {
      humanVerified: true,
      ensName: oldEns,
      worldIdNullifier: oldNullifier,
      username: oldUsername,
      verifiedAt: new Date().toISOString(),
    })
    
    // Clear old keys
    localStorage.removeItem('worldid_verified')
    localStorage.removeItem('ens_name')
    localStorage.removeItem('worldid_nullifier')
    localStorage.removeItem('username')
  }
}
