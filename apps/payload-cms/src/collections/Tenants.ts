import type { CollectionConfig } from 'payload'

/**
 * Tenants collection for multi-tenant e-commerce
 * 
 * Each tenant represents a separate store/shop with its own:
 * - Products
 * - Carts
 * - Orders
 * - Transactions
 * 
 * Tenants are resolved by domain in the frontend apps.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domain', 'active', 'createdAt'],
    description: 'Manage your store tenants. Each tenant has its own products, carts, and orders.',
  },
  access: {
    // Public read - storefronts need to resolve tenant by slug/domain
    read: () => true,
    // Only admins can create/update/delete tenants
    create: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    update: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
    delete: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the store (e.g., "Auto Shop", "General Store")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-safe identifier (e.g., "auto-shop", "storefront")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
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
      name: 'domain',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Primary domain for this tenant (e.g., "auto-shop-astro.agenticflows.workers.dev")',
      },
    },
    {
      name: 'domains',
      type: 'array',
      admin: {
        description: 'Additional domains that should resolve to this tenant',
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive tenants cannot be accessed',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Settings',
          fields: [
            {
              name: 'currency',
              type: 'select',
              defaultValue: 'USD',
              options: [
                { label: 'USD ($)', value: 'USD' },
                { label: 'EUR (€)', value: 'EUR' },
                { label: 'GBP (£)', value: 'GBP' },
                { label: 'CAD (C$)', value: 'CAD' },
              ],
            },
            {
              name: 'allowGuestCheckout',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Allow customers to checkout without creating an account',
              },
            },
            {
              name: 'taxRate',
              type: 'number',
              min: 0,
              max: 100,
              admin: {
                description: 'Default tax rate percentage',
              },
            },
          ],
        },
        {
          label: 'Branding',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'primaryColor',
              type: 'text',
              admin: {
                description: 'Hex color code (e.g., #3B82F6)',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Short description of the store',
              },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'email',
              type: 'email',
            },
            {
              name: 'phone',
              type: 'text',
            },
            {
              name: 'address',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
}
