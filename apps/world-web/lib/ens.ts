import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { addEnsContracts } from '@ensdomains/ensjs'

export function getEnsPublicClient() {
  return createPublicClient({ chain: addEnsContracts(sepolia), transport: http() })
}

export async function mintSubname() {
  throw new Error('mintSubname not wired yet')
}

export async function updateWellnessTextRecords() {
  throw new Error('updateWellnessTextRecords not wired yet')
}
