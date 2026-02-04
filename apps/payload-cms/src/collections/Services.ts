import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'featured', 'tenant', 'updatedAt'],
    group: 'Business',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: { placeholder: '0.00' },
        },
        {
          name: 'duration',
          type: 'text',
          admin: { placeholder: 'e.g., 1-2 hours' },
        },
      ],
    },
    {
      name: 'icon',
      type: 'select',
      defaultValue: 'wrench',
      options: [
        { label: 'Wrench', value: 'wrench' },
        { label: 'Tire', value: 'tire' },
        { label: 'Car', value: 'car' },
        { label: 'Gauge', value: 'gauge' },
        { label: 'Shield', value: 'shield' },
        { label: 'Settings', value: 'settings' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
