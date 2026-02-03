import { PayloadSDK } from '@payloadcms/sdk';
import type { Config } from './types';

export * from './types';

// Re-export common types for convenience
export type {
  Product,
  Cart,
  Variant,
  Order,
  Transaction,
  Address,
  Media,
  User,
} from './types';

/**
 * Service binding interface for Cloudflare Workers
 */
export interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

/**
 * Options for creating a Payload client
 */
export interface PayloadClientOptions {
  /** The base URL of the Payload API */
  baseURL: string;
  /** Optional service binding for Worker-to-Worker communication */
  serviceBinding?: ServiceBinding;
  /** Tenant ID for multi-tenant setups */
  tenantId?: string;
}

/**
 * Create a typed Payload SDK client
 * 
 * @example
 * // In Astro page (with service binding)
 * const payload = createPayloadClient({
 *   baseURL: 'https://payload-cms.workers.dev/api',
 *   serviceBinding: Astro.locals.runtime?.env?.PAYLOAD_CMS,
 *   tenantId: 'auto-shop'
 * });
 * 
 * // Fetch products for this tenant
 * const products = await payload.find({
 *   collection: 'products',
 *   where: { tenant: { equals: 'auto-shop' } }
 * });
 */
export function createPayloadClient(options: PayloadClientOptions) {
  const { baseURL, serviceBinding, tenantId } = options;

  const sdk = new PayloadSDK<Config>({
    baseURL,
    fetch: serviceBinding
      ? (url, init) => serviceBinding.fetch(new Request(url, init))
      : undefined,
  });

  // Return SDK with tenant context helper
  return Object.assign(sdk, {
    tenantId,
    /**
     * Helper to add tenant filter to queries
     */
    withTenant<T extends Record<string, unknown>>(where: T): T & { tenant: { equals: string } } {
      if (!tenantId) return where as T & { tenant: { equals: string } };
      return { ...where, tenant: { equals: tenantId } };
    },
  });
}

export type PayloadClient = ReturnType<typeof createPayloadClient>;
