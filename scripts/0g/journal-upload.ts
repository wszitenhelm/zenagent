import 'dotenv/config'

import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk'
import { ethers } from 'ethers'
import { randomBytes, scryptSync, createCipheriv } from 'crypto'
import { mkdirSync, writeFileSync } from 'fs'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function encryptAesGcm(plaintext: Uint8Array, passphrase: string) {
  const salt = randomBytes(16)
  const key = scryptSync(passphrase, salt, 32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const c1 = cipher.update(plaintext)
  const c2 = cipher.final()
  const tag = cipher.getAuthTag()
  const ciphertext = Buffer.concat([c1, c2])

  // payload = salt || iv || tag || ciphertext
  return Buffer.concat([salt, iv, tag, ciphertext])
}

async function main() {
  const OG_EVM_RPC_URL = getEnv('OG_EVM_RPC_URL')
  const OG_STORAGE_INDEXER_RPC = getEnv('OG_STORAGE_INDEXER_RPC')
  const OG_PRIVATE_KEY = getEnv('OG_PRIVATE_KEY')
  const OG_JOURNAL_PASSPHRASE = getEnv('OG_JOURNAL_PASSPHRASE')

  const entry = process.env.OG_JOURNAL_TEXT || process.argv.slice(2).join(' ') || ''
  if (!entry) throw new Error('Missing journal text. Provide OG_JOURNAL_TEXT or argv text')

  const provider = new ethers.JsonRpcProvider(OG_EVM_RPC_URL)
  const signer = new ethers.Wallet(OG_PRIVATE_KEY, provider)
  const indexer = new Indexer(OG_STORAGE_INDEXER_RPC)

  const plaintext = new TextEncoder().encode(entry)
  const encryptedPayload = encryptAesGcm(plaintext, OG_JOURNAL_PASSPHRASE)

  const memData = new MemData(Uint8Array.from(encryptedPayload))
  const [tree, treeErr] = await memData.merkleTree()
  if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`)

  const [tx, uploadErr] = await indexer.upload(memData, OG_EVM_RPC_URL, signer)
  if (uploadErr !== null) throw new Error(`Upload error: ${uploadErr}`)

  const rootHash = 'rootHash' in tx ? tx.rootHash : tx.rootHashes?.[0]
  if (!rootHash) throw new Error('Upload did not return rootHash')

  mkdirSync('downloads', { recursive: true })
  const receipt = {
    rootHash,
    tx,
    createdAt: new Date().toISOString(),
    note: 'Payload format: salt(16) || iv(12) || tag(16) || ciphertext',
  }
  writeFileSync('downloads/journal-upload.json', JSON.stringify(receipt, null, 2))

  console.log('rootHash:', rootHash)
  console.log('saved:', 'downloads/journal-upload.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
