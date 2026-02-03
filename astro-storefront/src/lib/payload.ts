// Payload CMS client using official SDK with Cloudflare Service Binding
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'

export type { Product, Cart, Variant, Media } from './payload-types'

const PAYLOAD_API_URL = 'https://astro-payload-ecom.agenticflows.workers.dev/api'

// Service binding interface
interface ServiceBinding {
  fetch(request: Request): Promise<Response>
}

// Create SDK with service binding for Worker-to-Worker calls
export function createPayload(serviceBinding?: ServiceBinding) {
  return new PayloadSDK<Config>({
    baseURL: PAYLOAD_API_URL,
    fetch: serviceBinding
      ? (url, init) => serviceBinding.fetch(new Request(url, init))
      : undefined,
  })
}

// Helper to get product by ID or slug
export async function getProductByIdOrSlug(
  sdk: PayloadSDK<Config>,
  idOrSlug: string
) {
  const isNumeric = !isNaN(Number(idOrSlug))

  if (isNumeric) {
    return sdk.findByID({
      collection: 'products',
      id: idOrSlug,
    })
  }

  const result = await sdk.find({
    collection: 'products',
    where: {
      slug: { equals: idOrSlug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })

  if (result.docs.length === 0) {
    throw new Error('Product not found')
  }

  return result.docs[0]
}
