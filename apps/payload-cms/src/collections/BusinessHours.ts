import type { CollectionConfig } from 'payload'

export const BusinessHours: CollectionConfig = {
  slug: 'business-hours',
  admin: {
    useAsTitle: 'day',
    defaultColumns: ['day', 'open', 'close', 'closed', 'tenant'],
    group: 'Business',
  },
  fields: [
    {
      name: 'day',
      type: 'select',
      required: true,
      options: [
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'open',
          type: 'text',
          defaultValue: '08:00',
          admin: { placeholder: '08:00' },
        },
        {
          name: 'close',
          type: 'text',
          defaultValue: '18:00',
          admin: { placeholder: '18:00' },
        },
      ],
    },
    {
      name: 'closed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Check if closed this day',
      },
    },
  ],
}
