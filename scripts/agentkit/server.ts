import 'dotenv/config'

import { Hono } from 'hono'
import { serve } from '@hono/node-server'

import { HTTPFacilitatorClient } from '@x402/core/http'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import {
  paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer,
  x402ResourceServer,
} from '@x402/hono'

import {
  agentkitResourceServerExtension,
  createAgentBookVerifier,
  createAgentkitHooks,
  declareAgentkitExtension,
  InMemoryAgentKitStorage,
} from '@worldcoin/agentkit'

import { createPublicClient, http, isAddress, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const PORT = Number(process.env.AGENTKIT_PORT || 4021)

const WORLD_CHAIN = 'eip155:480'
const BASE = 'eip155:8453'

const WORLD_USDC = '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'

const envPayTo = process.env.AGENTKIT_PAY_TO as `0x${string}` | undefined
const envPrivateKey = process.env.PRIVATE_KEY

const payTo = (() => {
  if (envPayTo && isAddress(envPayTo)) return envPayTo
  if (envPrivateKey) {
    const pk = envPrivateKey.startsWith('0x') ? (envPrivateKey as `0x${string}`) : (`0x${envPrivateKey}` as `0x${string}`)
    return privateKeyToAccount(pk).address
  }
  return undefined
})()

if (!payTo || !isAddress(payTo)) {
  throw new Error(
    'Missing/invalid AGENTKIT_PAY_TO and PRIVATE_KEY. Set AGENTKIT_PAY_TO to a wallet address that will receive x402 payments (can be your own address), or set PRIVATE_KEY so it can be derived.',
  )
}

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
if (!SEPOLIA_RPC_URL) throw new Error('Missing SEPOLIA_RPC_URL. Reuse the same Sepolia RPC URL you use for Hardhat scripts.')

const ZENAGENT_REGISTRY_ADDRESS = process.env.ZENAGENT_REGISTRY_ADDRESS as `0x${string}` | undefined
if (!ZENAGENT_REGISTRY_ADDRESS || !isAddress(ZENAGENT_REGISTRY_ADDRESS)) {
  throw new Error('Missing/invalid ZENAGENT_REGISTRY_ADDRESS. Set it to your deployed ZenAgentRegistry contract on Sepolia.')
}

const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://x402-worldchain.vercel.app/facilitator',
})

const evmScheme = new ExactEvmScheme().registerMoneyParser(async (amount, network) => {
  if (network !== WORLD_CHAIN) return null
  return {
    amount: String(Math.round(amount * 1e6)),
    asset: WORLD_USDC,
    extra: { name: 'USD Coin', version: '2' },
  }
})

const agentBook = createAgentBookVerifier() as any
const storage = new InMemoryAgentKitStorage()

const hooks = createAgentkitHooks({
  agentBook,
  storage,
  mode: { type: 'free-trial', uses: 3 },
})

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(WORLD_CHAIN, evmScheme)
  .registerExtension(agentkitResourceServerExtension)

const routes = {
  'GET /agent/summary': {
    accepts: [
      { scheme: 'exact', price: '$0.01', network: WORLD_CHAIN, payTo },
    ],
    extensions: declareAgentkitExtension({
      statement: 'Verify your agent is backed by a real human',
      mode: { type: 'free-trial', uses: 3 },
    }),
  },
}

const httpServer = new x402HTTPResourceServer(resourceServer, routes as any).onProtectedRequest(hooks.requestHook)

const app = new Hono()
app.use(paymentMiddlewareFromHTTPServer(httpServer))

const registryAbi = parseAbi([
  'function getUserProfile(address user) external view returns (string username,uint256 streak,uint256 totalCheckIns,uint256 registeredAt,bool worldIDVerified,string ensName)',
])

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
})

app.get('/agent/summary', async (c) => {
  const user = c.req.query('user')
  if (!user || !isAddress(user)) {
    return c.json({ error: 'Missing/invalid ?user=0x...' }, 400)
  }

  const profile = await sepoliaClient.readContract({
    address: ZENAGENT_REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'getUserProfile',
    args: [user],
  })

  const [username, streak, totalCheckIns, registeredAt, worldIDVerified, ensName] = profile

  if (!worldIDVerified) {
    return c.json({ error: 'User is not World ID verified', user }, 403)
  }

  const summary = {
    username,
    ensName,
    streak: Number(streak),
    totalCheckIns: Number(totalCheckIns),
    registeredAt: Number(registeredAt),
    message: `Daily summary for ${username}: you are on a ${Number(streak)} check-in streak. Keep going.`,
  }

  return c.json({ success: true, user, summary })
})

serve({ fetch: app.fetch, port: PORT })
console.log(`AgentKit server running on http://localhost:${PORT}`)
