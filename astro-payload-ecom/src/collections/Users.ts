import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'createdAt'],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Customer', value: 'customer' },
      ],
      defaultValue: ['customer'],
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => {
          const u = user as { roles?: string[] } | null
          return u?.roles?.includes('admin') ?? false
        },
      },
    },
  ],
}
