import 'dotenv/config'

import { privateKeyToAccount } from 'viem/accounts'

type AgentkitChallengeInfo = {
  domain: string
  uri: string
  version: string
  nonce: string
  issuedAt: string
  statement?: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
}

type AgentkitExtension = {
  info: AgentkitChallengeInfo
  supportedChains: Array<{ chainId: string; type: 'eip191' | 'eip1271' }>
}

function toNumericChainId(chainId: string): number {
  const parts = chainId.split(':')
  if (parts.length !== 2) throw new Error(`Invalid chainId: ${chainId}`)
  const n = Number(parts[1])
  if (!Number.isFinite(n)) throw new Error(`Invalid chainId: ${chainId}`)
  return n
}

function buildSiweMessage(params: {
  info: AgentkitChallengeInfo
  address: string
  chainId: string
}): string {
  const { info, address, chainId } = params
  const lines: string[] = []

  lines.push(`${info.domain} wants you to sign in with your Ethereum account:`)
  lines.push(address)
  lines.push('')

  if (info.statement) {
    lines.push(info.statement)
    lines.push('')
  } else {
    lines.push('')
  }

  lines.push(`URI: ${info.uri}`)
  lines.push(`Version: ${info.version}`)
  lines.push(`Chain ID: ${toNumericChainId(chainId)}`)
  lines.push(`Nonce: ${info.nonce}`)
  lines.push(`Issued At: ${info.issuedAt}`)

  if (info.expirationTime) lines.push(`Expiration Time: ${info.expirationTime}`)
  if (info.notBefore) lines.push(`Not Before: ${info.notBefore}`)
  if (info.requestId) lines.push(`Request ID: ${info.requestId}`)
  if (info.resources?.length) {
    lines.push('Resources:')
    for (const r of info.resources) lines.push(`- ${r}`)
  }

  return lines.join('\n')
}

function base64Json(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
}

async function main() {
  const baseUrl = process.env.AGENTKIT_BASE_URL || 'http://localhost:4021'
  const user = process.env.AGENTKIT_USER
  if (!user) throw new Error('Missing AGENTKIT_USER (the ZenAgent user address to summarize)')

  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error('Missing PRIVATE_KEY (agent wallet signing key)')

  const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`))

  const url = `${baseUrl}/agent/summary?user=${encodeURIComponent(user)}`

  const first = await fetch(url)
  if (first.status !== 402) {
    const text = await first.text().catch(() => '')
    throw new Error(`Expected 402 challenge. Got ${first.status}: ${text}`)
  }

  const challenge = (await first.json()) as any
  const agentkit: AgentkitExtension | undefined = challenge?.extensions?.agentkit
  if (!agentkit) throw new Error('Missing extensions.agentkit in 402 response')

  const supported = agentkit.supportedChains?.[0]
  if (!supported) throw new Error('Missing agentkit.supportedChains')

  const message = buildSiweMessage({
    info: agentkit.info,
    address: account.address,
    chainId: supported.chainId,
  })

  const signature = await account.signMessage({ message })

  const headerObj = {
    ...agentkit.info,
    address: account.address,
    chainId: supported.chainId,
    type: supported.type,
    signature,
  }

  const res = await fetch(url, {
    headers: {
      agentkit: base64Json(headerObj),
    },
  })

  const outText = await res.text().catch(() => '')
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${outText}`)

  console.log(outText)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
