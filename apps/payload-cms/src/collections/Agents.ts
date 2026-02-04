import type { CollectionConfig } from 'payload'

export const Agents: CollectionConfig = {
  slug: 'agents',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'status', 'tenant', 'updatedAt'],
    group: 'AI',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Fitment Assistant', value: 'fitment' },
        { label: 'Lead Qualification', value: 'lead_qual' },
        { label: 'Customer Support', value: 'support' },
        { label: 'Appointment Scheduler', value: 'scheduler' },
        { label: 'Quote Generator', value: 'quote' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'inactive',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Paused', value: 'paused' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'config',
      type: 'json',
      admin: {
        description: 'Agent-specific configuration',
      },
    },
    {
      name: 'durableObjectId',
      type: 'text',
      admin: {
        description: 'Cloudflare Durable Object ID',
        position: 'sidebar',
      },
    },
    {
      name: 'metrics',
      type: 'group',
      admin: {
        description: 'Usage metrics',
      },
      fields: [
        { name: 'totalSessions', type: 'number', defaultValue: 0 },
        { name: 'totalMessages', type: 'number', defaultValue: 0 },
        { name: 'leadsGenerated', type: 'number', defaultValue: 0 },
        { name: 'quotesGenerated', type: 'number', defaultValue: 0 },
        { name: 'lastActiveAt', type: 'date' },
      ],
    },
  ],
}
