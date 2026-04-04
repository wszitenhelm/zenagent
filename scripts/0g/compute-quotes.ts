import 'dotenv/config'

import { ethers } from 'ethers'
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

async function main() {
  const OG_COMPUTE_RPC_URL = getEnv('OG_COMPUTE_RPC_URL')
  const OG_COMPUTE_PRIVATE_KEY = getEnv('OG_COMPUTE_PRIVATE_KEY')

  const provider = new ethers.JsonRpcProvider(OG_COMPUTE_RPC_URL)
  const wallet = new ethers.Wallet(OG_COMPUTE_PRIVATE_KEY, provider)
  const broker = await createZGComputeNetworkBroker(wallet)

  const services = await broker.inference.listService()
  const chatbot = services.find((s: any) => s.serviceType === 'chatbot')
  if (!chatbot) throw new Error('No chatbot service available')

  const providerAddress = (process.env.OG_COMPUTE_PROVIDER_ADDRESS || chatbot.provider) as string

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress)
  const headers = await broker.inference.getRequestHeaders(providerAddress)

  const prompt = process.env.OG_QUOTE_PROMPT || process.argv.slice(2).join(' ') || 'Generate 5 short manifestation quotes about calm, health, and consistency.'

  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ]

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
    throw new Error(`Inference error: ${JSON.stringify(data)}`)
  }

  const answer = data?.choices?.[0]?.message?.content
  console.log(answer || JSON.stringify(data, null, 2))

  const chatID = response.headers.get('ZG-Res-Key') || data.id
  if (chatID) {
    await broker.inference.processResponse(providerAddress, chatID)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
