import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'source', 'tenant', 'createdAt'],
    group: 'CRM',
  },
  access: {
    create: () => true, // Public create for form submissions
    // read/update/delete require authentication (default)
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
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
            { name: 'trim', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'service',
      type: 'text',
      admin: {
        description: 'Service they are interested in',
      },
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Converted', value: 'converted' },
        { label: 'Lost', value: 'lost' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'website',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'AI Assistant', value: 'ai_assistant' },
        { label: 'Phone', value: 'phone' },
        { label: 'Walk-in', value: 'walkin' },
        { label: 'Referral', value: 'referral' },
        { label: 'Social Media', value: 'social' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this lead',
      },
    },
  ],
}
