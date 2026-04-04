import { getOwner, getResolver, getWrapperData } from '@ensdomains/ensjs/public'
import { getEnsPublicClient } from './_ensClients'

async function main() {
  const publicClient = getEnsPublicClient()
  const name = process.env.ENS_NAME || process.argv[2]
  if (!name) throw new Error('Missing ENS_NAME (or pass name as argv[2])')

  const owner = await getOwner(publicClient, { name })
  const resolver = await getResolver(publicClient, { name })
  const wrapper = await getWrapperData(publicClient, { name })

  console.log('name:', name)
  console.log('owner:', owner)
  console.log('resolver:', resolver)
  console.log('wrapped:', Boolean(wrapper))
  if (wrapper) console.log('wrapperData:', wrapper)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
