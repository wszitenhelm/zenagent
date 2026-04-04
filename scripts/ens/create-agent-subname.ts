import { createSubname, setAddressRecord, setRecords, setResolver } from '@ensdomains/ensjs/wallet'
import { getOwner, getResolver, getWrapperData } from '@ensdomains/ensjs/public'
import { isAddress } from 'viem'
import { getEnsPublicClient, getEnsWalletClient, getParentName, getZenAgentRegistryAddress, waitForTx } from './_ensClients'

async function main() {
  const parent = getParentName()
  const publicClient = getEnsPublicClient()
  const wallet = getEnsWalletClient()

  const parentOwner = await getOwner(publicClient, { name: parent })
  const parentWrapper = await getWrapperData(publicClient, { name: parent })
  const contract: 'registry' | 'nameWrapper' = parentWrapper ? 'nameWrapper' : 'registry'

  console.log('parent:', parent)
  console.log('parentOwner:', parentOwner)
  console.log('parentWrapped:', Boolean(parentWrapper))
  console.log('ensWriteContract:', contract)

  if (!parentOwner?.owner) throw new Error(`Parent name not found or has no owner: ${parent}`)
  if (wallet.account?.address && parentOwner.owner.toLowerCase() !== wallet.account.address.toLowerCase()) {
    throw new Error(
      `Wallet ${wallet.account.address} is not the manager/owner of ${parent} on Sepolia (owner is ${parentOwner.owner}). Ensure you're using the correct PRIVATE_KEY and that ${parent} is owned by this wallet on Sepolia.`,
    )
  }

  const resolverAddress = await getResolver(publicClient, { name: parent })
  if (!resolverAddress) throw new Error(`No resolver found for parent name: ${parent}`)

  const agentLabel = process.env.AGENT_LABEL || process.argv[2]
  if (!agentLabel) throw new Error('Missing AGENT_LABEL (or pass label as argv[2])')

  const agentEnsName = `${agentLabel}.${parent}`

  const owner = (process.env.AGENT_OWNER_ADDRESS || process.argv[3] || wallet.account?.address) as `0x${string}` | undefined
  if (!owner || !isAddress(owner)) throw new Error('Missing/invalid AGENT_OWNER_ADDRESS (or argv[3])')

  const endpoint = process.env.AGENT_ENDPOINT || ''
  const capabilities = process.env.AGENT_CAPABILITIES || ''

  const existingAgentOwner = await getOwner(publicClient, { name: agentEnsName })
  let tx1: string | null = null
  if (!existingAgentOwner) {
    tx1 = await createSubname(wallet, {
      name: agentEnsName,
      owner,
      contract,
    })
    await waitForTx(tx1 as `0x${string}`)
  } else {
    if (!existingAgentOwner.owner) throw new Error(`Agent name exists but has no owner: ${agentEnsName}`)
    if (existingAgentOwner.owner.toLowerCase() !== wallet.account.address.toLowerCase()) {
      throw new Error(
        `Agent name ${agentEnsName} already exists but is not owned by your wallet. Current owner: ${existingAgentOwner.owner}`,
      )
    }
  }

  const tx2 = await setResolver(wallet, {
    name: agentEnsName,
    contract,
    resolverAddress,
  })
  await waitForTx(tx2 as `0x${string}`)

  const agentResolverAddress = await getResolver(publicClient, { name: agentEnsName })
  if (!agentResolverAddress) throw new Error(`No resolver found for agent name after setResolver: ${agentEnsName}`)

  const tx3 = await setAddressRecord(wallet, {
    name: agentEnsName,
    coin: 'ETH',
    value: owner,
    resolverAddress: agentResolverAddress,
  })
  await waitForTx(tx3 as `0x${string}`)

  const texts: Array<{ key: string; value: string | null }> = [
    { key: 'zenagent.registry', value: getZenAgentRegistryAddress() },
    { key: 'zenagent.agent', value: 'true' },
    { key: 'zenagent.owner', value: owner },
  ]

  if (endpoint) texts.push({ key: 'zenagent.endpoint', value: endpoint })
  if (capabilities) texts.push({ key: 'zenagent.capabilities', value: capabilities })

  const tx4 = await setRecords(wallet, {
    name: agentEnsName,
    resolverAddress: agentResolverAddress,
    texts,
  })
  await waitForTx(tx4 as `0x${string}`)

  console.log('agentEnsName:', agentEnsName)
  console.log('parentResolverAddress:', resolverAddress)
  console.log('agentResolverAddress:', agentResolverAddress)
  console.log('tx:createSubname:', tx1)
  console.log('tx:setResolver:', tx2)
  console.log('tx:setAddressRecord:', tx3)
  console.log('tx:setRecords:', tx4)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
