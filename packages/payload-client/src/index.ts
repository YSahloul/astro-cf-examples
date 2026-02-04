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
 * Tenant info resolved from domain
 */
export interface TenantInfo {
  id: number;
  slug: string;
  name: string;
  domain?: string;
  settings?: {
    currency?: string;
    allowGuestCheckout?: boolean;
  };
}

/**
 * Options for creating a Payload client
 */
export interface PayloadClientOptions {
  /** The base URL of the Payload API */
  baseURL: string;
  /** Optional service binding for Worker-to-Worker communication */
  serviceBinding?: ServiceBinding;
  /** Tenant ID (numeric) for multi-tenant setups */
  tenantId?: number;
  /** Tenant slug for multi-tenant setups */
  tenantSlug?: string;
}

/**
 * Create a typed Payload SDK client
 */
export function createPayloadClient(options: PayloadClientOptions) {
  const { baseURL, serviceBinding, tenantId, tenantSlug } = options;

  const sdk = new PayloadSDK<Config>({
    baseURL,
    fetch: serviceBinding
      ? (url, init) => serviceBinding.fetch(new Request(url, init))
      : undefined,
  });

  // Return SDK with tenant context helper
  return Object.assign(sdk, {
    tenantId,
    tenantSlug,
    /**
     * Helper to add tenant filter to queries (by ID)
     */
    withTenantId<T extends Record<string, unknown>>(where: T): T & { tenant: { equals: number } } {
      if (!tenantId) return where as T & { tenant: { equals: number } };
      return { ...where, tenant: { equals: tenantId } };
    },
    /**
     * Helper to add tenant filter to queries (by slug via relationship)
     */
    withTenantSlug<T extends Record<string, unknown>>(where: T): T & { 'tenant.slug': { equals: string } } {
      if (!tenantSlug) return where as T & { 'tenant.slug': { equals: string } };
      return { ...where, 'tenant.slug': { equals: tenantSlug } };
    },
  });
}

export type PayloadClient = ReturnType<typeof createPayloadClient>;

/**
 * Domain to tenant mapping
 * Maps worker domains to tenant slugs
 */
const DOMAIN_TENANT_MAP: Record<string, string> = {
  // Production domains
  'astro-storefront.agenticflows.workers.dev': 'storefront',
  'auto-shop-astro.agenticflows.workers.dev': 'auto-shop',
  
  // Local development
  'localhost:4321': 'storefront',
  'localhost:4322': 'auto-shop',
  
  // Custom domains can be added here
};

/**
 * Resolve tenant from request URL/hostname
 */
export function resolveTenantFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const host = url.host;
  
  // Check direct domain mapping
  if (DOMAIN_TENANT_MAP[host]) {
    return DOMAIN_TENANT_MAP[host];
  }
  
  // Check if domain contains tenant slug pattern
  // e.g., auto-shop.example.com -> auto-shop
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www') {
    return subdomain;
  }
  
  return null;
}

/**
 * Fetch tenant info from Payload by domain or slug
 */
export async function fetchTenantByDomain(
  sdk: PayloadClient,
  domain: string
): Promise<TenantInfo | null> {
  try {
    const result = await sdk.find({
      collection: 'tenants',
      where: {
        or: [
          { domain: { equals: domain } },
          { slug: { equals: domain } },
        ],
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return null;
    }

    const tenant = result.docs[0] as any;
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain,
      settings: tenant.settings,
    };
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    return null;
  }
}

/**
 * Fetch tenant info from Payload by slug
 */
export async function fetchTenantBySlug(
  sdk: PayloadClient,
  slug: string
): Promise<TenantInfo | null> {
  try {
    const result = await sdk.find({
      collection: 'tenants',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return null;
    }

    const tenant = result.docs[0] as any;
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain,
      settings: tenant.settings,
    };
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    return null;
  }
}
