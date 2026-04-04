import { NextResponse } from 'next/server'

import { ethers } from 'ethers'
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { prompt?: string }

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
    if (!chatbot) {
      return NextResponse.json({ error: 'No chatbot service available' }, { status: 500 })
    }

    const providerAddress = (process.env.OG_COMPUTE_PROVIDER_ADDRESS || chatbot.provider) as string
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress)
    const headers = await broker.inference.getRequestHeaders(providerAddress)

    const prompt =
      body.prompt ||
      process.env.OG_QUOTE_PROMPT ||
      'Generate 5 short manifestation quotes about calm, health, and consistency.'

    const messages = [{ role: 'user', content: prompt }]

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ messages, model }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: 'Inference error', details: data }, { status: 500 })
    }

    const quote = data?.choices?.[0]?.message?.content ?? null

    const chatID = response.headers.get('ZG-Res-Key') || data.id
    if (chatID) {
      await broker.inference.processResponse(providerAddress, chatID)
    }

    return NextResponse.json({ success: true, quote, providerAddress, model })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
