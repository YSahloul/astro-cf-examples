import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'

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

export async function seed() {
  const payload = await getPayload({ config })

  console.log('Starting seed...')

  // Check if admin user exists
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  })

  if (existingUsers.docs.length === 0) {
    console.log('Creating admin user...')
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@example.com',
        password: 'Admin123!',
        roles: ['admin'],
        name: 'Admin User',
      },
    })
    console.log('Admin user created: admin@example.com / Admin123!')
  } else {
    console.log('Users already exist, skipping admin creation')
  }

  // Get existing products
  const existingProducts = await payload.find({
    collection: 'products',
    limit: 100,
  })

  // Delete the incomplete product (id: 1 with null title)
  for (const product of existingProducts.docs) {
    if (!product.title) {
      console.log(`Deleting incomplete product ${product.id}...`)
      await payload.delete({
        collection: 'products',
        id: product.id,
      })
    }
  }

  // Create products
  console.log('Creating products...')
  for (const productData of products) {
    // Check if product with same SKU already exists
    const existing = await payload.find({
      collection: 'products',
      where: {
        sku: { equals: productData.sku },
      },
    })

    if (existing.docs.length > 0) {
      console.log(`Product ${productData.sku} already exists, skipping`)
      continue
    }

    const product = await payload.create({
      collection: 'products',
      data: productData,
    })
    console.log(`Created product: ${product.title} (${product.id})`)
  }

  console.log('Seed completed!')
}

// Run if called directly
seed().catch(console.error)
