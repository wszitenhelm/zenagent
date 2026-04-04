import 'dotenv/config'

import { Indexer } from '@0gfoundation/0g-ts-sdk'
import { readFileSync } from 'fs'
import { scryptSync, createDecipheriv } from 'crypto'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function decryptAesGcm(payload: Uint8Array, passphrase: string) {
  const buf = Buffer.from(payload)
  const salt = buf.subarray(0, 16)
  const iv = buf.subarray(16, 28)
  const tag = buf.subarray(28, 44)
  const ciphertext = buf.subarray(44)

  const key = scryptSync(passphrase, salt, 32)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const p1 = decipher.update(ciphertext)
  const p2 = decipher.final()
  return Buffer.concat([p1, p2])
}

async function main() {
  const OG_STORAGE_INDEXER_RPC = getEnv('OG_STORAGE_INDEXER_RPC')
  const OG_JOURNAL_PASSPHRASE = getEnv('OG_JOURNAL_PASSPHRASE')

  const rootHash = process.env.OG_JOURNAL_ROOT_HASH || process.argv[2]
  if (!rootHash) throw new Error('Missing rootHash. Provide OG_JOURNAL_ROOT_HASH or argv[2]')

  const outPath = process.env.OG_JOURNAL_OUT || `downloads/${rootHash}.bin`

  const indexer = new Indexer(OG_STORAGE_INDEXER_RPC)
  const err = await indexer.download(rootHash, outPath, true)
  if (err !== null) throw new Error(`Download error: ${err}`)

  const encryptedPayload = readFileSync(outPath)
  const plaintext = decryptAesGcm(encryptedPayload, OG_JOURNAL_PASSPHRASE)

  console.log(plaintext.toString('utf8'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
