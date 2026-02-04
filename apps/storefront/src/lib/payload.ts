// Re-export from shared package
export {
  createPayloadClient,
  type PayloadClient,
  type ServiceBinding,
  type Product,
  type Cart,
  type Variant,
  type Media,
  type Order,
} from '@repo/payload-client';

import { createPayloadClient, type ServiceBinding, type PayloadClient } from '@repo/payload-client';

const PAYLOAD_API_URL = 'https://astro-payload-ecom.agenticflows.workers.dev/api';

// Storefront tenant ID
export const TENANT_ID = 1;

/**
 * Create Payload client for this storefront
 */
export function createPayload(serviceBinding?: ServiceBinding) {
  return createPayloadClient({
    baseURL: PAYLOAD_API_URL,
    serviceBinding,
    tenantId: TENANT_ID,
  });
}

/**
 * Helper to get product by ID or slug
 */
export async function getProductByIdOrSlug(
  sdk: PayloadClient,
  idOrSlug: string
) {
  const isNumeric = !isNaN(Number(idOrSlug));

  if (isNumeric) {
    return sdk.findByID({
      collection: 'products',
      id: idOrSlug,
    });
  }

  const result = await sdk.find({
    collection: 'products',
    where: {
      slug: { equals: idOrSlug },
      _status: { equals: 'published' },
    },
    limit: 1,
  });

  if (result.docs.length === 0) {
    throw new Error('Product not found');
  }

  return result.docs[0];
}
