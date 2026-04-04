import { NextResponse } from 'next/server'

import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk'
import { ethers } from 'ethers'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      ciphertextBase64?: string
      contentType?: string
      filename?: string
    }

    const ciphertextBase64 = body.ciphertextBase64
    if (!ciphertextBase64) {
      return NextResponse.json({ error: 'Missing ciphertextBase64' }, { status: 400 })
    }

    const OG_EVM_RPC_URL = process.env.OG_EVM_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    const OG_STORAGE_INDEXER_RPC = process.env.OG_STORAGE_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai'
    const OG_PRIVATE_KEY = process.env.OG_PRIVATE_KEY

    if (!OG_PRIVATE_KEY) return NextResponse.json({ error: 'Missing OG_PRIVATE_KEY' }, { status: 500 })

    const provider = new ethers.JsonRpcProvider(OG_EVM_RPC_URL)
    const signer = new ethers.Wallet(OG_PRIVATE_KEY, provider)
    const indexer = new Indexer(OG_STORAGE_INDEXER_RPC)

    const bytes = Buffer.from(ciphertextBase64, 'base64')
    const memData = new MemData(Uint8Array.from(bytes))

    const [tree, treeErr] = await memData.merkleTree()
    if (treeErr !== null) {
      return NextResponse.json({ error: `Merkle tree error: ${treeErr}` }, { status: 500 })
    }

    const [tx, uploadErr] = await indexer.upload(memData, OG_EVM_RPC_URL, signer)
    if (uploadErr !== null) {
      return NextResponse.json({ error: `Upload error: ${uploadErr}` }, { status: 500 })
    }

    const rootHash = 'rootHash' in tx ? tx.rootHash : tx.rootHashes?.[0]
    if (!rootHash) {
      return NextResponse.json({ error: 'Upload did not return rootHash' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      rootHash,
      tx,
      merkleRoot: tree?.rootHash?.() ?? null,
      meta: {
        contentType: body.contentType || null,
        filename: body.filename || null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
