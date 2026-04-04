import { NextResponse } from 'next/server'

import { ethers } from 'ethers'
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'

function parse0gAmountToWei(amount: string) {
  const normalized = amount.trim()
  if (!normalized) throw new Error('Empty amount')
  return ethers.parseEther(normalized)
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      deposit0g?: string
      transfer0g?: string
      providerAddress?: string
    }

    const OG_COMPUTE_RPC_URL = process.env.OG_COMPUTE_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    const OG_COMPUTE_PRIVATE_KEY = process.env.OG_COMPUTE_PRIVATE_KEY

    if (!OG_COMPUTE_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Missing OG_COMPUTE_PRIVATE_KEY' }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(OG_COMPUTE_RPC_URL)
    const wallet = new ethers.Wallet(OG_COMPUTE_PRIVATE_KEY, provider)
    const broker = await createZGComputeNetworkBroker(wallet)

    const services = await broker.inference.listService()
    const chatbot = services.find((s: any) => s.serviceType === 'chatbot')

    const providerAddress =
      body.providerAddress ||
      process.env.OG_COMPUTE_PROVIDER_ADDRESS ||
      (chatbot ? (chatbot.provider as string) : null)

    if (!providerAddress) {
      return NextResponse.json({ error: 'Missing providerAddress and no chatbot provider discovered' }, { status: 500 })
    }

    const deposit0g = body.deposit0g ?? '3'
    const transfer0g = body.transfer0g ?? '1'

    const depositNumber = Number(deposit0g)
    if (!Number.isFinite(depositNumber) || depositNumber <= 0) {
      return NextResponse.json({ error: 'deposit0g must be a positive number string' }, { status: 400 })
    }

    const depositTx = await broker.ledger.depositFund(depositNumber)
    const transferWei = parse0gAmountToWei(transfer0g)
    const transferTx = await broker.ledger.transferFund(providerAddress, 'inference', transferWei)

    return NextResponse.json({
      success: true,
      providerAddress,
      deposit0g,
      transfer0g,
      depositTx,
      transferTx,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
