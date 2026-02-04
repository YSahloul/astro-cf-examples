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
      const existingAdmin = await payload.find({
        collection: 'users',
        where: { email: { equals: 'admin@example.com' } },
        limit: 1,
      })

      let adminUser: any
      if (existingAdmin.docs.length === 0) {
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
        // Reset admin password to ensure it works
        adminUser = await payload.update({
          collection: 'users',
          id: existingAdmin.docs[0].id,
          data: {
            password: 'Admin123!',
          },
        })
        results.push('Reset admin user password: admin@example.com / Admin123!')
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

        // Seed auto shop business profile
        const existingProfile = await payload.find({
          collection: 'business-profiles',
          where: { 'tenant.id': { equals: autoShopTenantId } },
          limit: 1,
        })

        if (existingProfile.docs.length === 0) {
          await payload.create({
            collection: 'business-profiles',
            data: {
              tenant: autoShopTenantId,
              name: "Sal's Wheels & Tires",
              tagline: "Your Trusted Source for Wheels, Tires & Suspension",
              description: "Family-owned since 2010, we specialize in custom wheel and tire packages for trucks, Jeeps, and SUVs. Expert fitment advice and professional installation.",
              phone: "(555) 123-4567",
              email: "info@salswheels.com",
              address: {
                street: "1234 Auto Center Drive",
                city: "Dallas",
                state: "TX",
                zip: "75001",
              },
              social: {
                instagram: "salswheels",
                facebook: "salswheelsandtires",
              },
              financingUrl: "https://apply.credova.com/example",
            },
          })
          results.push("Created auto shop business profile")
        } else {
          results.push("Auto shop business profile already exists")
        }

        // Seed auto shop business hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
        for (const day of days) {
          const existing = await payload.find({
            collection: 'business-hours',
            where: {
              'tenant.id': { equals: autoShopTenantId },
              day: { equals: day },
            },
            limit: 1,
          })

          if (existing.docs.length === 0) {
            const isSunday = day === 'sunday'
            await payload.create({
              collection: 'business-hours',
              data: {
                tenant: autoShopTenantId,
                day,
                open: isSunday ? null : '08:00',
                close: isSunday ? null : (day === 'saturday' ? '14:00' : '18:00'),
                closed: isSunday,
              },
            })
          }
        }
        results.push("Seeded auto shop business hours")

        // Seed auto shop services
        const services = [
          { name: "Wheel & Tire Package", description: "Complete wheel and tire setup including mounting, balancing, and installation", price: 199, duration: "2-3 hours", icon: 'tire' as const, featured: true, sortOrder: 1 },
          { name: "Suspension Lift Installation", description: "Professional lift kit installation with alignment", price: 499, duration: "4-6 hours", icon: 'car' as const, featured: true, sortOrder: 2 },
          { name: "Tire Mounting & Balancing", description: "Per tire mounting and high-speed balancing", price: 25, duration: "30 min", icon: 'wrench' as const, featured: false, sortOrder: 3 },
          { name: "Alignment Service", description: "Full 4-wheel alignment with computerized equipment", price: 89, duration: "1 hour", icon: 'gauge' as const, featured: false, sortOrder: 4 },
          { name: "TPMS Service", description: "Tire pressure monitoring system sensor replacement or reprogramming", price: 45, duration: "30 min", icon: 'settings' as const, featured: false, sortOrder: 5 },
        ]

        for (const serviceData of services) {
          const existing = await payload.find({
            collection: 'services',
            where: {
              'tenant.id': { equals: autoShopTenantId },
              name: { equals: serviceData.name },
            },
            limit: 1,
          })

          if (existing.docs.length === 0) {
            await payload.create({
              collection: 'services',
              data: {
                tenant: autoShopTenantId,
                ...serviceData,
              },
            })
          }
        }
        results.push("Seeded auto shop services")

        // Seed auto shop testimonials
        const testimonials = [
          { name: "Mike T.", text: "Best wheel shop in Dallas! They helped me find the perfect setup for my Tacoma. Great prices and the install was flawless.", rating: 5, source: 'google' as const, featured: true },
          { name: "Sarah K.", text: "Very knowledgeable staff. They took the time to explain all my options and made sure I got exactly what I wanted.", rating: 5, source: 'google' as const, featured: true },
          { name: "Carlos R.", text: "Got my F-150 leveled and put on 35s. Looks amazing and drives great. Highly recommend!", rating: 5, source: 'yelp' as const, featured: false },
        ]

        for (const testimonialData of testimonials) {
          const existing = await payload.find({
            collection: 'testimonials',
            where: {
              'tenant.id': { equals: autoShopTenantId },
              name: { equals: testimonialData.name },
            },
            limit: 1,
          })

          if (existing.docs.length === 0) {
            await payload.create({
              collection: 'testimonials',
              data: {
                tenant: autoShopTenantId,
                ...testimonialData,
                date: new Date().toISOString().split('T')[0],
              },
            })
          }
        }
        results.push("Seeded auto shop testimonials")
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
