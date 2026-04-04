import 'dotenv/config'
import { addEnsContracts } from '@ensdomains/ensjs'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY

export function getEnsPublicClient() {
  if (!SEPOLIA_RPC_URL) throw new Error('Missing SEPOLIA_RPC_URL')
  return createPublicClient({
    chain: addEnsContracts(sepolia),
    transport: http(SEPOLIA_RPC_URL),
  })
}

export async function waitForTx(hash: `0x${string}`) {
  const client = getEnsPublicClient()
  await client.waitForTransactionReceipt({ hash })
}

export function getEnsWalletClient() {
  if (!SEPOLIA_RPC_URL) throw new Error('Missing SEPOLIA_RPC_URL')
  if (!PRIVATE_KEY) throw new Error('Missing PRIVATE_KEY')

  const pk = PRIVATE_KEY.startsWith('0x') ? (PRIVATE_KEY as `0x${string}`) : (`0x${PRIVATE_KEY}` as `0x${string}`)
  const account = privateKeyToAccount(pk)

  return createWalletClient({
    account,
    chain: addEnsContracts(sepolia),
    transport: http(SEPOLIA_RPC_URL),
  })
}

export function getParentName() {
  const parent = process.env.ENS_PARENT_NAME
  if (!parent) throw new Error('Missing ENS_PARENT_NAME')
  return parent
}

export function getZenAgentRegistryAddress() {
  const addr = process.env.ZENAGENT_REGISTRY_ADDRESS
  if (!addr) throw new Error('Missing ZENAGENT_REGISTRY_ADDRESS')
  return addr
}
