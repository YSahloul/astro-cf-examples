import type { Endpoint } from 'payload'

const products = [
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

      // Check if admin user exists
      const existingUsers = await payload.find({
        collection: 'users',
        limit: 1,
      })

      if (existingUsers.docs.length === 0) {
        await payload.create({
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
        results.push('Users already exist, skipping admin creation')
      }

      // Get existing products and delete incomplete ones
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

      // Create products
      for (const productData of products) {
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
          data: productData,
        })
        results.push(`Created product: ${product.title} (ID: ${product.id})`)
      }

      return Response.json({ success: true, results })
    } catch (error) {
      console.error('Seed error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error', results },
        { status: 500 }
      )
    }
  },
}
