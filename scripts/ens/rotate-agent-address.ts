import { setAddressRecord } from '@ensdomains/ensjs/wallet'
import { getResolver } from '@ensdomains/ensjs/public'
import { isAddress } from 'viem'
import { getEnsPublicClient, getEnsWalletClient, getParentName, waitForTx } from './_ensClients'

async function main() {
  const parent = getParentName()
  const publicClient = getEnsPublicClient()
  const wallet = getEnsWalletClient()

  const agentLabel = process.env.AGENT_LABEL || process.argv[2]
  if (!agentLabel) throw new Error('Missing AGENT_LABEL (or pass label as argv[2])')

  const newAddress = (process.env.ROTATE_TO_ADDRESS || process.argv[3]) as `0x${string}` | undefined
  if (!newAddress || !isAddress(newAddress)) throw new Error('Missing/invalid ROTATE_TO_ADDRESS (or argv[3])')

  const agentEnsName = `${agentLabel}.${parent}`

  const agentResolverAddress = await getResolver(publicClient, { name: agentEnsName })
  if (!agentResolverAddress) throw new Error(`No resolver found for agent name: ${agentEnsName}`)

  const tx = await setAddressRecord(wallet, {
    name: agentEnsName,
    coin: 'ETH',
    value: newAddress,
    resolverAddress: agentResolverAddress,
  })
  await waitForTx(tx as `0x${string}`)

  console.log('agentEnsName:', agentEnsName)
  console.log('resolverAddress:', agentResolverAddress)
  console.log('tx:setAddressRecord:', tx)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
