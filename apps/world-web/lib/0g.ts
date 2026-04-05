import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk'
import { ethers } from 'ethers'

export interface WellnessData {
  mood: number
  stress: number
  sleep: number
  gratitude: string
  journal: string
  date: string
}

export interface WellnessEntry extends WellnessData {
  txHash: string
}

const OG_EVM_RPC_URL = process.env.NEXT_PUBLIC_0G_RPC || 'https://evmrpc-testnet.0g.ai'
const OG_STORAGE_INDEXER_RPC = process.env.NEXT_PUBLIC_0G_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai'

// AES-256 encryption using userAddress as key material
async function deriveKeyMaterial(address: string) {
  const enc = new TextEncoder()
  const keyBytes = await crypto.subtle.digest('SHA-256', enc.encode(address.toLowerCase()))
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encryptData(plaintext: string, address: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const key = await deriveKeyMaterial(address)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const pt = enc.encode(plaintext)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt))
  return { ciphertext: ct, iv }
}

async function decryptData(ciphertext: Uint8Array, iv: Uint8Array, address: string): Promise<string> {
  const key = await deriveKeyMaterial(address)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(pt)
}

export async function uploadWellnessData(
  data: WellnessData,
  userAddress: string,
  privateKey: string
): Promise<string> {
  // Encrypt sensitive fields (journal and gratitude)
  const encryptedJournal = await encryptData(data.journal, userAddress)
  const encryptedGratitude = await encryptData(data.gratitude, userAddress)

  // Create payload: unencrypted mood/stress/sleep + encrypted journal/gratitude
  const payload = {
    mood: data.mood,
    stress: data.stress,
    sleep: data.sleep,
    // Encrypted data as base64
    journalCipher: Buffer.from(encryptedJournal.ciphertext).toString('base64'),
    journalIv: Buffer.from(encryptedJournal.iv).toString('base64'),
    gratitudeCipher: Buffer.from(encryptedGratitude.ciphertext).toString('base64'),
    gratitudeIv: Buffer.from(encryptedGratitude.iv).toString('base64'),
    date: data.date,
    userAddress,
  }

  // Convert to blob
  const jsonStr = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(jsonStr)

  // Upload via 0G SDK
  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC_URL)
  const signer = new ethers.Wallet(privateKey, provider)
  const indexer = new Indexer(OG_STORAGE_INDEXER_RPC)

  const memData = new MemData(Uint8Array.from(bytes))
  const [tree, treeErr] = await memData.merkleTree()
  if (treeErr !== null) {
    throw new Error(`Merkle tree error: ${treeErr}`)
  }

  const [tx, uploadErr] = await indexer.upload(memData, OG_EVM_RPC_URL, signer)
  if (uploadErr !== null) {
    throw new Error(`Upload error: ${uploadErr}`)
  }

  const rootHash = 'rootHash' in tx ? tx.rootHash : tx.rootHashes?.[0]
  if (!rootHash) {
    throw new Error('Upload did not return rootHash')
  }

  // Store entry in localStorage (mood/stress unencrypted for charts)
  const entries = JSON.parse(localStorage.getItem('zg_entries') || '[]')
  entries.push({
    date: data.date,
    txHash: rootHash,
    mood: data.mood,
    stress: data.stress,
    sleep: data.sleep,
  })
  localStorage.setItem('zg_entries', JSON.stringify(entries))

  return rootHash as string
}

export async function downloadWellnessData(
  txHash: string,
  userAddress: string,
  privateKey: string
): Promise<WellnessEntry> {
  // Download via 0G SDK
  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC_URL)
  const signer = new ethers.Wallet(privateKey, provider)
  const indexer = new Indexer(OG_STORAGE_INDEXER_RPC)

  // Download segments
  const [segments, downloadErr] = await indexer.download(txHash, OG_EVM_RPC_URL, signer)
  if (downloadErr !== null) {
    throw new Error(`Download error: ${downloadErr}`)
  }

  if (!segments) {
    throw new Error('No segments downloaded')
  }

  // Decode payload
  const decoder = new TextDecoder()
  const jsonStr = decoder.decode(segments)
  const payload = JSON.parse(jsonStr)

  // Decrypt sensitive fields
  const journalCipher = Buffer.from(payload.journalCipher, 'base64')
  const journalIv = Buffer.from(payload.journalIv, 'base64')
  const gratitudeCipher = Buffer.from(payload.gratitudeCipher, 'base64')
  const gratitudeIv = Buffer.from(payload.gratitudeIv, 'base64')

  const journal = await decryptData(journalCipher, journalIv, userAddress)
  const gratitude = await decryptData(gratitudeCipher, gratitudeIv, userAddress)

  return {
    mood: payload.mood,
    stress: payload.stress,
    sleep: payload.sleep,
    gratitude,
    journal,
    date: payload.date,
    txHash,
  }
}

export function getLocalEntries(): Array<{ date: string; txHash: string; mood: number; stress: number; sleep: number }> {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('zg_entries') || '[]')
}
