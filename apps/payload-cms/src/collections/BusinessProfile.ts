import type { CollectionConfig } from 'payload'

export const BusinessProfile: CollectionConfig = {
  slug: 'business-profiles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tenant', 'phone', 'email', 'updatedAt'],
    group: 'Business',
  },
  access: {
    read: () => true, // Public read for storefronts
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: 'My Business',
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      type: 'group',
      name: 'address',
      fields: [
        { name: 'street', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'state', type: 'text' },
            { name: 'zip', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'twitter', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    {
      name: 'financingUrl',
      type: 'text',
      admin: {
        description: 'External financing application URL',
      },
    },
  ],
}
