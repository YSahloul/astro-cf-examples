import type { Endpoint } from 'payload'

// Tenant definitions
const tenants = [
  {
    name: 'Storefront',
    slug: 'storefront',
    domain: 'astro-storefront.agenticflows.workers.dev',
    domains: [
      { domain: 'localhost:4321' },
    ],
    currency: 'USD' as const,
    allowGuestCheckout: true,
    description: 'General e-commerce storefront',
    active: true,
  },
  {
    name: 'Auto Shop',
    slug: 'auto-shop',
    domain: 'auto-shop-astro.agenticflows.workers.dev',
    domains: [
      { domain: 'localhost:4322' },
    ],
    currency: 'USD' as const,
    allowGuestCheckout: true,
    description: 'Automotive wheels, tires, and accessories',
    active: true,
  },
]

// Products for the general storefront
const storefrontProducts = [
  {
    title: 'Classic Cotton T-Shirt',
    shortDescription: 'A comfortable, everyday essential made from 100% organic cotton.',
    category: 'Clothing',
    sku: 'TSH-001',
    inventory: 50,
    priceInUSD: 29.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Wireless Bluetooth Headphones',
    shortDescription: 'Premium sound quality with 30-hour battery life and active noise cancellation.',
    category: 'Electronics',
    sku: 'WBH-002',
    inventory: 25,
    priceInUSD: 149.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Leather Messenger Bag',
    shortDescription: 'Handcrafted genuine leather bag, perfect for work or weekend adventures.',
    category: 'Accessories',
    sku: 'LMB-003',
    inventory: 15,
    priceInUSD: 199.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Stainless Steel Water Bottle',
    shortDescription: 'Double-walled insulated bottle keeps drinks cold for 24 hours or hot for 12.',
    category: 'Home & Kitchen',
    sku: 'SWB-004',
    inventory: 100,
    priceInUSD: 34.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Running Sneakers',
    shortDescription: 'Lightweight and breathable with advanced cushioning for maximum comfort.',
    category: 'Footwear',
    sku: 'RSN-005',
    inventory: 30,
    priceInUSD: 119.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Organic Coffee Blend',
    shortDescription: 'Fair-trade certified, medium roast with notes of chocolate and caramel.',
    category: 'Food & Beverage',
    sku: 'OCB-006',
    inventory: 200,
    priceInUSD: 18.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
]

// Products for the auto shop
const autoShopProducts = [
  {
    title: 'Fuel Off-Road Wheels - 20x10',
    shortDescription: 'Aggressive off-road wheels with -18mm offset. Perfect for lifted trucks.',
    category: 'Wheels',
    sku: 'FUEL-D531-20',
    inventory: 24,
    priceInUSD: 349.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'BFGoodrich All-Terrain T/A KO2 - 285/70R17',
    shortDescription: 'The toughest all-terrain tire for trucks and SUVs. CoreGard Technology.',
    category: 'Tires',
    sku: 'BFG-KO2-285',
    inventory: 40,
    priceInUSD: 289.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Rough Country 3" Leveling Kit',
    shortDescription: 'Easy bolt-on installation. Fits 2019-2024 Silverado/Sierra 1500.',
    category: 'Suspension',
    sku: 'RC-1323',
    inventory: 15,
    priceInUSD: 149.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Method Race Wheels MR305 NV - 17x8.5',
    shortDescription: 'HD Series. Machined face with matte black lip. 6x139.7 bolt pattern.',
    category: 'Wheels',
    sku: 'METHOD-305-17',
    inventory: 16,
    priceInUSD: 289.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Nitto Ridge Grappler - 33x12.50R20',
    shortDescription: 'Hybrid terrain tire. Quiet on-road, aggressive off-road performance.',
    category: 'Tires',
    sku: 'NITTO-RG-33',
    inventory: 32,
    priceInUSD: 379.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
  {
    title: 'Wheel Installation Kit',
    shortDescription: 'Includes lug nuts, hub rings, and valve stems. Universal fit.',
    category: 'Accessories',
    sku: 'ACC-INSTALL-KIT',
    inventory: 100,
    priceInUSD: 49.99,
    priceInUSDEnabled: true,
    _status: 'published' as const,
  },
]

export const seedEndpoint: Endpoint = {
  path: '/seed',
  method: 'post',
  handler: async (req) => {
    const { payload } = req
    const results: string[] = []

    try {
      // Check for seed secret (simple protection)
      const seedSecret = req.headers.get('x-seed-secret')
      if (seedSecret !== 'seed-my-store-2024') {
        return Response.json({ error: 'Invalid seed secret' }, { status: 401 })
      }

      // Create or get admin user
      const existingUsers = await payload.find({
        collection: 'users',
        limit: 1,
      })

      let adminUser: any
      if (existingUsers.docs.length === 0) {
        adminUser = await payload.create({
          collection: 'users',
          data: {
            email: 'admin@example.com',
            password: 'Admin123!',
            roles: ['admin'],
            name: 'Admin User',
          },
        })
        results.push('Created admin user: admin@example.com / Admin123!')
      } else {
        adminUser = existingUsers.docs[0]
        results.push('Admin user already exists')
      }

      // Create tenants
      const createdTenants: Record<string, number> = {}
      
      for (const tenantData of tenants) {
        const existing = await payload.find({
          collection: 'tenants',
          where: {
            slug: { equals: tenantData.slug },
          },
        })

        if (existing.docs.length > 0) {
          createdTenants[tenantData.slug] = existing.docs[0].id
          results.push(`Tenant "${tenantData.name}" already exists (ID: ${existing.docs[0].id})`)
        } else {
          const tenant = await payload.create({
            collection: 'tenants',
            data: tenantData,
          })
          createdTenants[tenantData.slug] = tenant.id
          results.push(`Created tenant: ${tenantData.name} (ID: ${tenant.id})`)
        }
      }

      // Create tenant users (one per tenant)
      const tenantUsers = [
        {
          email: 'storefront@example.com',
          password: 'Store123!',
          name: 'Storefront Manager',
          roles: ['customer'] as ('customer' | 'admin')[],
          tenantSlug: 'storefront',
        },
        {
          email: 'autoshop@example.com',
          password: 'Auto123!',
          name: 'Auto Shop Manager',
          roles: ['customer'] as ('customer' | 'admin')[],
          tenantSlug: 'auto-shop',
        },
      ]

      for (const userData of tenantUsers) {
        const existing = await payload.find({
          collection: 'users',
          where: { email: { equals: userData.email } },
        })

        if (existing.docs.length > 0) {
          results.push(`User ${userData.email} already exists`)
          continue
        }

        const tenantId = createdTenants[userData.tenantSlug]
        if (!tenantId) {
          results.push(`Tenant ${userData.tenantSlug} not found for user ${userData.email}`)
          continue
        }

        await payload.create({
          collection: 'users',
          data: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            roles: userData.roles,
            tenants: [{ tenant: tenantId }],
          },
        })
        results.push(`Created user: ${userData.email} / ${userData.password} (tenant: ${userData.tenantSlug})`)
      }

      // Delete incomplete products
      const existingProducts = await payload.find({
        collection: 'products',
        limit: 100,
      })

      for (const product of existingProducts.docs) {
        if (!product.title) {
          await payload.delete({
            collection: 'products',
            id: product.id,
          })
          results.push(`Deleted incomplete product ${product.id}`)
        }
      }

      // Seed storefront products
      const storefrontTenantId = createdTenants['storefront']
      if (storefrontTenantId) {
        for (const productData of storefrontProducts) {
          const existing = await payload.find({
            collection: 'products',
            where: {
              sku: { equals: productData.sku },
            },
          })

          if (existing.docs.length > 0) {
            const existingProduct = existing.docs[0]
            // Update tenant if not set
            if (!existingProduct.tenant) {
              await payload.update({
                collection: 'products',
                id: existingProduct.id,
                data: { tenant: storefrontTenantId },
              })
              results.push(`Updated product ${productData.sku} with tenant: storefront`)
            } else {
              results.push(`Product ${productData.sku} already exists, skipping`)
            }
            continue
          }

          const product = await payload.create({
            collection: 'products',
            data: {
              ...productData,
              tenant: storefrontTenantId,
            },
          })
          results.push(`Created storefront product: ${product.title}`)
        }
      }

      // Seed auto shop products
      const autoShopTenantId = createdTenants['auto-shop']
      if (autoShopTenantId) {
        for (const productData of autoShopProducts) {
          const existing = await payload.find({
            collection: 'products',
            where: {
              sku: { equals: productData.sku },
            },
          })

          if (existing.docs.length > 0) {
            results.push(`Product ${productData.sku} already exists, skipping`)
            continue
          }

          const product = await payload.create({
            collection: 'products',
            data: {
              ...productData,
              tenant: autoShopTenantId,
            },
          })
          results.push(`Created auto shop product: ${product.title}`)
        }
      }

      return Response.json({ 
        success: true, 
        results,
        tenants: createdTenants,
      })
    } catch (error) {
      console.error('Seed error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error', results },
        { status: 500 }
      )
    }
  },
}
