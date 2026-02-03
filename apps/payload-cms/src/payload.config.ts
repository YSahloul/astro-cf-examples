import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { seedEndpoint } from './endpoints/seed'
import {
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
} from './access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  endpoints: [seedEndpoint],
  collections: [Users, Media, Tenants],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2 as any,
      collections: { media: true },
    }),
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess,
        adminOrPublishedStatus,
        isAdmin,
        isAuthenticated,
        isCustomer,
        isDocumentOwner,
      },
      customers: {
        slug: 'users',
      },
      // Enable all ecommerce features with custom product fields
      products: {
        productsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: {
            ...defaultCollection.admin,
            useAsTitle: 'title',
            defaultColumns: ['title', 'tenant', 'priceInUSD', 'inventory', '_status'],
          },
          access: {
            // Anyone can read published products (filtered by tenant in query)
            read: () => true,
            // Only admins and tenant owners can create/update
            create: ({ req: { user } }) => {
              if (!user) return false
              return user.roles?.includes('admin') || Boolean(user.tenant)
            },
            update: ({ req: { user } }) => {
              if (!user) return false
              if (user.roles?.includes('admin')) return true
              // Tenant users can only update their own products
              return { tenant: { equals: user.tenant } }
            },
            delete: ({ req: { user } }) => {
              if (!user) return false
              if (user.roles?.includes('admin')) return true
              return { tenant: { equals: user.tenant } }
            },
          },
          fields: [
            // Tenant field for multi-tenancy
            {
              name: 'tenant',
              type: 'relationship',
              relationTo: 'tenants',
              required: true,
              index: true,
              admin: {
                position: 'sidebar',
                description: 'The store this product belongs to',
              },
              // Auto-set tenant from current user if not admin
              hooks: {
                beforeValidate: [
                  ({ value, req }) => {
                    if (value) return value
                    const user = req.user as { tenant?: number; roles?: string[] } | undefined
                    if (user?.tenant && !user?.roles?.includes('admin')) {
                      return user.tenant
                    }
                    return value
                  },
                ],
              },
            },
            // Add custom fields before the default ones
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              unique: true,
              admin: {
                position: 'sidebar',
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (!value && data?.title) {
                      return data.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                    }
                    return value
                  },
                ],
              },
            },
            {
              name: 'description',
              type: 'richText',
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              admin: {
                description: 'Brief description for product cards',
              },
            },
            {
              name: 'images',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'alt',
                  type: 'text',
                },
              ],
            },
            {
              name: 'category',
              type: 'text',
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'sku',
              type: 'text',
              admin: {
                position: 'sidebar',
              },
            },
            // Include all default fields from the plugin
            ...defaultCollection.fields,
          ],
        }),
      },
      carts: {
        allowGuestCarts: true,
        cartsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          fields: [
            // Tenant field for multi-tenancy
            {
              name: 'tenant',
              type: 'relationship',
              relationTo: 'tenants',
              required: true,
              index: true,
              admin: {
                position: 'sidebar',
              },
            },
            ...defaultCollection.fields,
          ],
        }),
      },
      addresses: true,
      inventory: true,
      orders: true,
      transactions: true,
      // Stripe payments (configure with env vars)
      // payments: {
      //   paymentMethods: [
      //     stripeAdapter({
      //       secretKey: process.env.STRIPE_SECRET_KEY!,
      //       publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      //       webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
      //     }),
      //   ],
      // },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
