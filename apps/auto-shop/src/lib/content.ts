/**
 * Content API for Auto Shop
 * Fetches all content from Payload CMS instead of local D1
 */
import {
  createPayloadClient,
  type ServiceBinding,
  type PayloadClient,
} from '@repo/payload-client';

const PAYLOAD_API_URL = 'https://astro-payload-ecom.agenticflows.workers.dev/api';
const TENANT_SLUG = 'auto-shop';

// Re-export types that match Payload collections
export interface BusinessProfile {
  id: number;
  name: string;
  tagline?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  heroImage?: { url?: string | null } | number | null;
  social?: {
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    youtube?: string | null;
  };
  financingUrl?: string | null;
}

export interface BusinessHour {
  id: number;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open?: string | null;
  close?: string | null;
  closed?: boolean | null;
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: string | null;
  icon?: 'wrench' | 'tire' | 'car' | 'gauge' | 'shield' | 'settings' | null;
  featured?: boolean | null;
  sortOrder?: number | null;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating?: number | null;
  source?: 'google' | 'yelp' | 'facebook' | 'website' | 'other' | null;
  date?: string | null;
  featured?: boolean | null;
}

export interface Lead {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    trim?: string | null;
  };
  service?: string | null;
  message?: string | null;
  status?: 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost' | null;
  source?: 'website' | 'ai_assistant' | 'phone' | 'walkin' | 'referral' | 'social' | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: number;
  quoteId: string;
  lead?: Lead | number | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
  };
  intent?: 'tires_only' | 'wheels_only' | 'wheels_and_tires' | 'package' | null;
  items?: Array<{
    type?: 'wheel' | 'tire' | 'suspension' | 'accessory' | 'labor' | null;
    name?: string | null;
    specs?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
    totalPrice?: number | null;
    id?: string | null;
  }> | null;
  totalPrice?: number | null;
  evidenceBuilds?: unknown;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'declined' | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: number;
  name: string;
  type: 'fitment' | 'lead_qual' | 'support' | 'scheduler' | 'quote';
  description?: string | null;
  status?: 'active' | 'inactive' | 'paused' | null;
  config?: unknown;
  durableObjectId?: string | null;
  metrics?: {
    totalSessions?: number | null;
    totalMessages?: number | null;
    leadsGenerated?: number | null;
    quotesGenerated?: number | null;
    lastActiveAt?: string | null;
  };
}

/**
 * Create content client for Auto Shop
 */
export function createContentClient(serviceBinding?: ServiceBinding) {
  return createPayloadClient({
    baseURL: PAYLOAD_API_URL,
    serviceBinding,
    tenantSlug: TENANT_SLUG,
  });
}

/**
 * Helper to add tenant filter to queries
 */
function withTenant(client: PayloadClient): any {
  if (client.tenantSlug) {
    return { 'tenant.slug': { equals: client.tenantSlug } };
  }
  return {};
}

// ============ BUSINESS PROFILE ============

/**
 * Get business profile (single document per tenant)
 */
export async function getProfile(client: PayloadClient): Promise<BusinessProfile | null> {
  const result = await client.find({
    collection: 'business-profiles',
    where: withTenant(client),
    limit: 1,
    depth: 1,
  });

  if (result.docs.length === 0) {
    return null;
  }

  return result.docs[0] as unknown as BusinessProfile;
}

/**
 * Update or create business profile
 */
export async function updateProfile(
  client: PayloadClient,
  data: Partial<Omit<BusinessProfile, 'id'>>
): Promise<BusinessProfile> {
  const existing = await getProfile(client);

  if (existing) {
    const updated = await client.update({
      collection: 'business-profiles',
      id: existing.id,
      data: data as any,
    });
    return updated as unknown as BusinessProfile;
  }

  // Create new profile - need to get tenant ID first
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const tenantId = tenantResult.docs[0]?.id;

  const created = await client.create({
    collection: 'business-profiles',
    data: {
      ...data,
      tenant: tenantId,
    } as any,
  });

  return created as unknown as BusinessProfile;
}

// ============ BUSINESS HOURS ============

/**
 * Get business hours
 */
export async function getHours(client: PayloadClient): Promise<BusinessHour[]> {
  const result = await client.find({
    collection: 'business-hours',
    where: withTenant(client),
    limit: 7,
    sort: 'day',
  });

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const docs = result.docs as unknown as BusinessHour[];
  
  return docs.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
}

/**
 * Update hours for a specific day
 */
export async function updateHours(
  client: PayloadClient,
  day: BusinessHour['day'],
  data: { open?: string; close?: string; closed?: boolean }
): Promise<BusinessHour> {
  // Find existing record for this day
  const existing = await client.find({
    collection: 'business-hours',
    where: {
      ...withTenant(client),
      day: { equals: day },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const updated = await client.update({
      collection: 'business-hours',
      id: existing.docs[0].id as number,
      data: data as any,
    });
    return updated as unknown as BusinessHour;
  }

  // Create new record
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'business-hours',
    data: {
      day,
      ...data,
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as BusinessHour;
}

// ============ SERVICES ============

/**
 * Get all services
 */
export async function getServices(client: PayloadClient): Promise<Service[]> {
  const result = await client.find({
    collection: 'services',
    where: withTenant(client),
    limit: 100,
    sort: '-featured,sortOrder',
  });

  return result.docs as unknown as Service[];
}

/**
 * Add a new service
 */
export async function addService(
  client: PayloadClient,
  data: Omit<Service, 'id'>
): Promise<Service> {
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'services',
    data: {
      ...data,
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as Service;
}

/**
 * Update a service
 */
export async function updateService(
  client: PayloadClient,
  id: number,
  data: Partial<Omit<Service, 'id'>>
): Promise<Service> {
  const updated = await client.update({
    collection: 'services',
    id,
    data: data as any,
  });

  return updated as unknown as Service;
}

/**
 * Delete a service
 */
export async function deleteService(client: PayloadClient, id: number): Promise<void> {
  await client.delete({
    collection: 'services',
    id,
  });
}

// ============ TESTIMONIALS ============

/**
 * Get all testimonials
 */
export async function getTestimonials(client: PayloadClient): Promise<Testimonial[]> {
  const result = await client.find({
    collection: 'testimonials',
    where: withTenant(client),
    limit: 100,
    sort: '-date',
  });

  return result.docs as unknown as Testimonial[];
}

/**
 * Add a testimonial
 */
export async function addTestimonial(
  client: PayloadClient,
  data: Omit<Testimonial, 'id'>
): Promise<Testimonial> {
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'testimonials',
    data: {
      ...data,
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as Testimonial;
}

/**
 * Delete a testimonial
 */
export async function deleteTestimonial(client: PayloadClient, id: number): Promise<void> {
  await client.delete({
    collection: 'testimonials',
    id,
  });
}

// ============ LEADS ============

/**
 * Get all leads
 */
export async function getLeads(client: PayloadClient): Promise<Lead[]> {
  const result = await client.find({
    collection: 'leads',
    where: withTenant(client),
    limit: 100,
    sort: '-createdAt',
  });

  return result.docs as unknown as Lead[];
}

/**
 * Get a single lead by ID
 */
export async function getLead(client: PayloadClient, id: number): Promise<Lead | null> {
  try {
    const lead = await client.findByID({
      collection: 'leads',
      id,
      depth: 1,
    });
    return lead as unknown as Lead;
  } catch {
    return null;
  }
}

/**
 * Create a new lead
 */
export async function createLead(
  client: PayloadClient,
  data: {
    name: string;
    email?: string;
    phone?: string;
    vehicle?: {
      year?: number;
      make?: string;
      model?: string;
      trim?: string;
    };
    service?: string;
    message?: string;
    source?: Lead['source'];
  }
): Promise<Lead> {
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'leads',
    data: {
      ...data,
      status: 'new',
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as Lead;
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  client: PayloadClient,
  id: number,
  status: Lead['status']
): Promise<Lead> {
  const updated = await client.update({
    collection: 'leads',
    id,
    data: { status } as any,
  });

  return updated as unknown as Lead;
}

/**
 * Update lead notes
 */
export async function updateLeadNotes(
  client: PayloadClient,
  id: number,
  notes: string
): Promise<Lead> {
  const updated = await client.update({
    collection: 'leads',
    id,
    data: { notes } as any,
  });

  return updated as unknown as Lead;
}

/**
 * Delete a lead
 */
export async function deleteLead(client: PayloadClient, id: number): Promise<void> {
  await client.delete({
    collection: 'leads',
    id,
  });
}

// ============ QUOTES ============

/**
 * Get all quotes
 */
export async function getQuotes(client: PayloadClient): Promise<Quote[]> {
  const result = await client.find({
    collection: 'quotes',
    where: withTenant(client),
    limit: 100,
    sort: '-createdAt',
    depth: 1,
  });

  return result.docs as unknown as Quote[];
}

/**
 * Get quote by quoteId
 */
export async function getQuoteById(client: PayloadClient, quoteId: string): Promise<Quote | null> {
  const result = await client.find({
    collection: 'quotes',
    where: {
      ...withTenant(client),
      quoteId: { equals: quoteId },
    },
    limit: 1,
    depth: 1,
  });

  if (result.docs.length === 0) {
    return null;
  }

  return result.docs[0] as unknown as Quote;
}

/**
 * Create a new quote
 */
export async function createQuote(
  client: PayloadClient,
  data: {
    quoteId: string;
    leadId?: number;
    vehicle?: Quote['vehicle'];
    intent?: Quote['intent'];
    items?: Quote['items'];
    totalPrice?: number;
    evidenceBuilds?: unknown;
    status?: Quote['status'];
    expiresAt?: string;
  }
): Promise<Quote> {
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'quotes',
    data: {
      ...data,
      lead: data.leadId,
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as Quote;
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  client: PayloadClient,
  id: number,
  status: Quote['status']
): Promise<Quote> {
  const updated = await client.update({
    collection: 'quotes',
    id,
    data: { status } as any,
  });

  return updated as unknown as Quote;
}

// ============ AGENTS ============

/**
 * Get all agents
 */
export async function getAgents(client: PayloadClient): Promise<Agent[]> {
  const result = await client.find({
    collection: 'agents',
    where: withTenant(client),
    limit: 100,
  });

  return result.docs as unknown as Agent[];
}

/**
 * Get or create an agent by type
 */
export async function getOrCreateAgent(
  client: PayloadClient,
  data: {
    name: string;
    type: Agent['type'];
    description?: string;
    config?: unknown;
    durableObjectId?: string;
  }
): Promise<Agent> {
  // Try to find existing agent
  const existing = await client.find({
    collection: 'agents',
    where: {
      ...withTenant(client),
      type: { equals: data.type },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return existing.docs[0] as unknown as Agent;
  }

  // Create new agent
  const tenantResult = await client.find({
    collection: 'tenants',
    where: { slug: { equals: client.tenantSlug } },
    limit: 1,
  });

  const created = await client.create({
    collection: 'agents',
    data: {
      ...data,
      status: 'active',
      tenant: tenantResult.docs[0]?.id,
    } as any,
  });

  return created as unknown as Agent;
}

/**
 * Update agent metrics
 */
export async function updateAgentMetrics(
  client: PayloadClient,
  id: number,
  metrics: Partial<NonNullable<Agent['metrics']>>
): Promise<Agent> {
  const agent = await client.findByID({
    collection: 'agents',
    id,
  }) as unknown as Agent;

  const updated = await client.update({
    collection: 'agents',
    id,
    data: {
      metrics: {
        ...agent.metrics,
        ...metrics,
        lastActiveAt: new Date().toISOString(),
      },
    } as any,
  });

  return updated as unknown as Agent;
}

/**
 * Update agent Durable Object ID
 */
export async function updateAgentDurableObjectId(
  client: PayloadClient,
  id: number,
  durableObjectId: string
): Promise<Agent> {
  const updated = await client.update({
    collection: 'agents',
    id,
    data: { durableObjectId } as any,
  });

  return updated as unknown as Agent;
}

// ============ TENANT INFO ============

/**
 * Get tenant info by slug
 */
export async function getTenantBySlug(client: PayloadClient, slug: string) {
  const result = await client.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
  });

  if (result.docs.length === 0) {
    return null;
  }

  return result.docs[0];
}

/**
 * Get current tenant ID
 */
export async function getTenantId(client: PayloadClient): Promise<number | null> {
  if (!client.tenantSlug) return null;
  
  const tenant = await getTenantBySlug(client, client.tenantSlug);
  return tenant?.id as number || null;
}
