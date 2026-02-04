import type { CollectionConfig } from 'payload'

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    useAsTitle: 'quoteId',
    defaultColumns: ['quoteId', 'lead', 'totalPrice', 'status', 'tenant', 'createdAt'],
    group: 'CRM',
  },
  fields: [
    {
      name: 'quoteId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique quote identifier (auto-generated)',
      },
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
    },
    {
      name: 'vehicle',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'year', type: 'number' },
            { name: 'make', type: 'text' },
            { name: 'model', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'intent',
      type: 'select',
      options: [
        { label: 'Tires Only', value: 'tires_only' },
        { label: 'Wheels Only', value: 'wheels_only' },
        { label: 'Wheels & Tires', value: 'wheels_and_tires' },
        { label: 'Full Package', value: 'package' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'type', type: 'select', options: ['wheel', 'tire', 'suspension', 'accessory', 'labor'] },
        { name: 'name', type: 'text' },
        { name: 'specs', type: 'text' },
        { name: 'quantity', type: 'number', defaultValue: 1 },
        { name: 'unitPrice', type: 'number' },
        { name: 'totalPrice', type: 'number' },
      ],
    },
    {
      name: 'totalPrice',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'evidenceBuilds',
      type: 'json',
      admin: {
        description: 'URLs to fitment evidence builds',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Viewed', value: 'viewed' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Expired', value: 'expired' },
        { label: 'Declined', value: 'declined' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
