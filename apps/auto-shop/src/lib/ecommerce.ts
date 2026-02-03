/**
 * E-commerce client for Auto Shop
 * Uses shared Payload CMS via service binding
 */
import {
  createPayloadClient,
  type ServiceBinding,
  type PayloadClient,
  type Product,
  type Cart,
} from '@repo/payload-client';

const PAYLOAD_API_URL = 'https://astro-payload-ecom.agenticflows.workers.dev/api';
const TENANT_SLUG = 'auto-shop';

export type { Product, Cart };

/**
 * Create Payload client for Auto Shop
 * Automatically scopes all queries to the auto-shop tenant
 */
export function createEcommerceClient(serviceBinding?: ServiceBinding) {
  return createPayloadClient({
    baseURL: PAYLOAD_API_URL,
    serviceBinding,
    tenantId: TENANT_SLUG,
  });
}

/**
 * Get products for the auto shop
 */
export async function getProducts(
  client: PayloadClient,
  options: {
    category?: string;
    limit?: number;
    page?: number;
  } = {}
) {
  const { category, limit = 20, page = 1 } = options;

  const where: Record<string, unknown> = {
    _status: { equals: 'published' },
  };

  // Add tenant filter
  if (client.tenantId) {
    where['tenant.slug'] = { equals: client.tenantId };
  }

  // Add category filter if specified
  if (category) {
    where.category = { equals: category };
  }

  return client.find({
    collection: 'products',
    where,
    limit,
    page,
    depth: 2,
  });
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(client: PayloadClient, slug: string) {
  const where: Record<string, unknown> = {
    slug: { equals: slug },
    _status: { equals: 'published' },
  };

  if (client.tenantId) {
    where['tenant.slug'] = { equals: client.tenantId };
  }

  const result = await client.find({
    collection: 'products',
    where,
    limit: 1,
    depth: 2,
  });

  if (result.docs.length === 0) {
    return null;
  }

  return result.docs[0];
}

/**
 * Create or get cart for the auto shop
 */
export async function getOrCreateCart(
  client: PayloadClient,
  cartId?: string
): Promise<Cart> {
  if (cartId) {
    try {
      const cart = await client.findByID({
        collection: 'carts',
        id: cartId,
        depth: 2,
      });
      return cart as Cart;
    } catch {
      // Cart not found, create new one
    }
  }

  // Create new cart with tenant
  const cart = await client.create({
    collection: 'carts',
    data: {
      items: [],
      currency: 'USD',
      // Note: tenant will need to be set - this requires knowing the tenant ID
    } as any,
  });

  return cart as Cart;
}

/**
 * Add item to cart
 */
export async function addToCart(
  client: PayloadClient,
  cartId: string,
  productId: number,
  quantity: number = 1,
  variantId?: number
) {
  const cart = await client.findByID({
    collection: 'carts',
    id: cartId,
    depth: 2,
  }) as Cart;

  const existingItemIndex = cart.items?.findIndex((item: any) => {
    const itemProductId = typeof item.product === 'number' ? item.product : item.product?.id;
    const itemVariantId = typeof item.variant === 'number' ? item.variant : item.variant?.id;
    return itemProductId === productId && itemVariantId === variantId;
  }) ?? -1;

  let newItems: any[];

  if (existingItemIndex >= 0 && cart.items) {
    newItems = cart.items.map((item: any, idx: number) =>
      idx === existingItemIndex
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    newItems = [
      ...(cart.items || []),
      {
        id: crypto.randomUUID(),
        product: productId,
        variant: variantId,
        quantity,
      },
    ];
  }

  return client.update({
    collection: 'carts',
    id: cartId,
    data: { items: newItems },
  });
}
