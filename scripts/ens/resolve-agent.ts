import { getAddressRecord, getTextRecord, getResolver } from '@ensdomains/ensjs/public'
import { getEnsPublicClient, getParentName } from './_ensClients'

async function main() {
  const parent = getParentName()
  const publicClient = getEnsPublicClient()

  const agentLabel = process.env.AGENT_LABEL || process.argv[2]
  if (!agentLabel) throw new Error('Missing AGENT_LABEL (or pass label as argv[2])')

  const agentEnsName = `${agentLabel}.${parent}`

  const resolverAddress = await getResolver(publicClient, { name: agentEnsName })
  const addr = await getAddressRecord(publicClient, { name: agentEnsName, coin: 'ETH' })

  const registry = await getTextRecord(publicClient, { name: agentEnsName, key: 'zenagent.registry' })
  const endpoint = await getTextRecord(publicClient, { name: agentEnsName, key: 'zenagent.endpoint' })
  const capabilities = await getTextRecord(publicClient, { name: agentEnsName, key: 'zenagent.capabilities' })

  console.log('agentEnsName:', agentEnsName)
  console.log('resolverAddress:', resolverAddress)
  console.log('addressRecord:', addr)
  console.log('text:zenagent.registry:', registry)
  console.log('text:zenagent.endpoint:', endpoint)
  console.log('text:zenagent.capabilities:', capabilities)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
