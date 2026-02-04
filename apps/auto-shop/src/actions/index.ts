/**
 * Astro Actions using Payload CMS instead of local D1
 * This replaces the Drizzle-based actions with Payload API calls
 */
import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import {
  createContentClient,
  getProfile,
  updateProfile,
  getHours,
  updateHours,
  getServices,
  addService,
  updateService,
  deleteService,
  getTestimonials,
  addTestimonial,
  deleteTestimonial,
  getLeads,
  createLead,
  updateLeadStatus,
  deleteLead,
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  getAgents,
  getOrCreateAgent,
  updateAgentMetrics,
  type BusinessProfile,
  type BusinessHour,
  type Service,
  type Testimonial,
  type Lead,
  type Quote,
} from "@/lib/content";

// Helper to get Payload client
function getClient() {
  // Use service binding if available, otherwise direct URL
  // Cast env to access PAYLOAD_CMS binding
  const workerEnv = env as unknown as { PAYLOAD_CMS?: Fetcher };
  return createContentClient(workerEnv.PAYLOAD_CMS);
}

// Helper functions for AI recommendations (kept from original)
function getRecommendationName(rec: any, index: number): string {
  const names = ['Street Performance', 'Off-Road Ready', 'Daily Driver', 'Aggressive Stance', 'Budget Friendly'];
  if (rec.suspensionType?.includes('Lift')) {
    return 'Off-Road Ready';
  }
  if (rec.suspensionType === 'Stock') {
    return 'Daily Driver';
  }
  return names[index] || `Option ${index + 1}`;
}

function estimatePriceRange(rec: any): string {
  if (rec.suspensionType?.includes('Lift')) {
    return '$3,500 - $5,500';
  }
  if (rec.suspensionType === 'Leveling Kit') {
    return '$2,000 - $3,500';
  }
  return '$1,500 - $2,800';
}

function generateExplanation(rec: any, intent: string): string {
  const parts = [];
  
  if (rec.evidence_builds > 0) {
    parts.push(`Verified by ${rec.evidence_builds} real builds`);
  }
  
  if (rec.rubbing_status?.includes('No rubbing')) {
    parts.push('no rubbing reported');
  }
  
  if (rec.trimming_status?.includes('No') || rec.trimming_status?.includes('None')) {
    parts.push('no trimming required');
  }
  
  if (parts.length === 0) {
    return 'A solid choice for your vehicle.';
  }
  
  return parts.join(', ') + '.';
}

export const server = {
  // ============ PROFILE ============
  getProfile: defineAction({
    handler: async () => {
      const client = getClient();
      return await getProfile(client);
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
      }).optional(),
      social: z.object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        youtube: z.string().optional(),
      }).optional(),
      financingUrl: z.string().optional(),
    }),
    handler: async (input) => {
      const client = getClient();
      await updateProfile(client, input as any);
      return { success: true };
    },
  }),

  // ============ HOURS ============
  getHours: defineAction({
    handler: async () => {
      const client = getClient();
      return await getHours(client);
    },
  }),

  updateHours: defineAction({
    input: z.object({
      day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    handler: async (input) => {
      const client = getClient();
      await updateHours(client, input.day, {
        open: input.open,
        close: input.close,
        closed: input.closed,
      });
      return { success: true };
    },
  }),

  // ============ SERVICES ============
  getServices: defineAction({
    handler: async () => {
      const client = getClient();
      return await getServices(client);
    },
  }),

  addService: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional().default(""),
      price: z.number().min(0).optional().default(0),
      duration: z.string().optional().default(""),
      icon: z.enum(['wrench', 'tire', 'car', 'gauge', 'shield', 'settings']).optional().default('wrench'),
      featured: z.boolean().optional().default(false),
      sortOrder: z.number().optional().default(0),
    }),
    handler: async (input) => {
      const client = getClient();
      const service = await addService(client, input as any);
      return { id: service.id };
    },
  }),

  updateService: defineAction({
    input: z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      duration: z.string().optional(),
      icon: z.enum(['wrench', 'tire', 'car', 'gauge', 'shield', 'settings']).optional(),
      featured: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }),
    handler: async ({ id, ...data }) => {
      const client = getClient();
      await updateService(client, id, data as any);
      return { success: true };
    },
  }),

  deleteService: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      const client = getClient();
      await deleteService(client, id);
      return { success: true };
    },
  }),

  // ============ TESTIMONIALS ============
  getTestimonials: defineAction({
    handler: async () => {
      const client = getClient();
      return await getTestimonials(client);
    },
  }),

  addTestimonial: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      text: z.string().min(1, "Review text is required"),
      rating: z.number().min(1).max(5).optional().default(5),
      source: z.enum(['google', 'yelp', 'facebook', 'website', 'other']).optional().default('google'),
      date: z.string().optional(),
    }),
    handler: async (input) => {
      const client = getClient();
      const testimonial = await addTestimonial(client, {
        ...input,
        date: input.date || new Date().toISOString().split("T")[0],
      } as any);
      return { id: testimonial.id };
    },
  }),

  deleteTestimonial: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      const client = getClient();
      await deleteTestimonial(client, id);
      return { success: true };
    },
  }),

  // ============ LEADS ============
  getLeads: defineAction({
    handler: async () => {
      const client = getClient();
      return await getLeads(client);
    },
  }),

  addLead: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      vehicle: z.object({
        year: z.number().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        trim: z.string().optional(),
      }).optional(),
      service: z.string().optional().default(""),
      message: z.string().optional().default(""),
      source: z.enum(['website', 'ai_assistant', 'phone', 'walkin', 'referral', 'social']).optional().default('website'),
    }),
    handler: async (input) => {
      const client = getClient();
      const lead = await createLead(client, input);
      return { id: lead.id };
    },
  }),

  updateLeadStatus: defineAction({
    input: z.object({
      id: z.number(),
      status: z.enum(['new', 'contacted', 'qualified', 'quoted', 'converted', 'lost']),
    }),
    handler: async ({ id, status }) => {
      const client = getClient();
      await updateLeadStatus(client, id, status);
      return { success: true };
    },
  }),

  deleteLead: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      const client = getClient();
      await deleteLead(client, id);
      return { success: true };
    },
  }),

  // ============ VEHICLE DATA ============
  getVehicleMakes: defineAction({
    input: z.object({
      year: z.number(),
    }),
    handler: async ({ year }) => {
      const makes = [
        'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
        'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
        'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
        'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
      ];
      return makes;
    },
  }),

  getVehicleModels: defineAction({
    input: z.object({
      year: z.number(),
      make: z.string(),
    }),
    handler: async ({ year, make }) => {
      const modelsByMake: Record<string, string[]> = {
        'Toyota': ['4Runner', 'Camry', 'Corolla', 'Highlander', 'RAV4', 'Tacoma', 'Tundra'],
        'Ford': ['Bronco', 'Edge', 'Escape', 'Explorer', 'F-150', 'F-250', 'Maverick', 'Mustang', 'Ranger'],
        'Chevrolet': ['Blazer', 'Colorado', 'Corvette', 'Equinox', 'Silverado 1500', 'Silverado 2500', 'Tahoe', 'Traverse'],
        'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Wrangler'],
        'Honda': ['Accord', 'Civic', 'CR-V', 'HR-V', 'Passport', 'Pilot', 'Ridgeline'],
        'Ram': ['1500', '2500', '3500'],
        'GMC': ['Acadia', 'Canyon', 'Sierra 1500', 'Sierra 2500', 'Terrain', 'Yukon'],
        'Nissan': ['Altima', 'Armada', 'Frontier', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Titan'],
        'Subaru': ['Ascent', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX'],
        'Dodge': ['Challenger', 'Charger', 'Durango'],
      };
      return modelsByMake[make] || [];
    },
  }),

  // ============ AI RECOMMENDATIONS ============
  generateAIRecommendations: defineAction({
    input: z.object({
      year: z.number(),
      make: z.string(),
      model: z.string(),
      intent: z.enum(['tires_only', 'wheels_only', 'wheels_and_tires', 'package', 'package_and_lift']).optional().default('wheels_and_tires'),
    }),
    handler: async ({ year, make, model, intent }) => {
      const { WheelFitmentMCP } = await import('@/lib/mcp-client');
      const mcp = new WheelFitmentMCP();
      
      try {
        const [buildsResult, fitments, oemData] = await Promise.all([
          mcp.searchVehicleBuilds({ year, make, model, page: 1 }).catch(() => ({ builds: [], totalBuilds: 0, pagination: { page: 1, totalPages: 0 } })),
          mcp.recommendFitments({ year, make, model, intent, minEvidenceBuilds: 3, includeSamples: true, limit: 10 }).catch(() => ({ recommendations: [] })),
          mcp.getWheelSizeOEMData({ year, make, model }).catch(() => null),
        ]);

        const guaranteed = await mcp.getGuaranteedFitments({ 
          year, make, model, 
          minBuilds: 3,
          allowSlightRub: false,
          allowMinorTrimming: false,
        }).catch(() => []);

        const recommendations = fitments.recommendations.slice(0, 5).map((rec, index) => ({
          id: `rec-${index + 1}`,
          name: getRecommendationName(rec, index),
          wheelSize: rec.wheelSize,
          tireSize: rec.tireSize,
          suspension: rec.suspensionType,
          priceRange: estimatePriceRange(rec),
          confidence: rec.evidence_builds,
          rubbingStatus: rec.rubbing_status,
          trimmingStatus: rec.trimming_status,
          commonWheels: rec.common_wheels?.slice(0, 3) || [],
          commonTires: rec.common_tires?.slice(0, 3) || [],
          sampleBuildUrls: rec.sample_urls?.slice(0, 5) || [],
          explanation: generateExplanation(rec, intent),
        }));

        if (recommendations.length === 0 && oemData) {
          recommendations.push({
            id: 'rec-oem',
            name: 'Factory Spec',
            wheelSize: oemData.trims?.[0]?.wheelSize || 'OEM',
            tireSize: oemData.trims?.[0]?.tireSize || 'OEM',
            suspension: 'Stock',
            priceRange: '$800 - $1,500',
            confidence: 0,
            rubbingStatus: 'OEM - No issues',
            trimmingStatus: 'None required',
            commonWheels: [],
            commonTires: [],
            sampleBuildUrls: [],
            explanation: 'Factory specification - guaranteed fit with no modifications needed.',
          });
        }

        return {
          recommendations,
          vehicle: { year, make, model },
          intent,
          totalBuilds: buildsResult.totalBuilds,
          oemData,
        };
      } catch (error) {
        console.error('Error generating recommendations:', error);
        throw new Error('Failed to generate recommendations. Please try again.');
      }
    },
  }),

  // ============ QUOTE GENERATION ============
  createQuote: defineAction({
    input: z.object({
      vehicleYear: z.number(),
      vehicleMake: z.string(),
      vehicleModel: z.string(),
      vehicleTrim: z.string().optional(),
      
      wheelSize: z.string(),
      tireSize: z.string(),
      suspension: z.string(),
      priceRange: z.string(),
      
      commonWheels: z.array(z.string()).optional(),
      commonTires: z.array(z.string()).optional(),
      sampleBuildUrls: z.array(z.string()).optional(),
      evidenceBuilds: z.number().optional(),
      
      rubbingStatus: z.string().optional(),
      trimmingStatus: z.string().optional(),
      
      customerName: z.string().min(1, "Name is required"),
      customerPhone: z.string().optional(),
      customerEmail: z.string().email().optional().or(z.literal('')),
      
      agentSessionId: z.string().optional(),
    }),
    handler: async (input) => {
      const client = getClient();
      const { WheelFitmentMCP } = await import('@/lib/mcp-client');
      const mcp = new WheelFitmentMCP();
      
      try {
        // Generate quote via MCP
        const mcpQuote = await mcp.generateQuote({
          vehicle_year: input.vehicleYear,
          vehicle_make: input.vehicleMake,
          vehicle_model: input.vehicleModel,
          vehicle_trim: input.vehicleTrim,
          wheel_size: input.wheelSize,
          tire_size: input.tireSize,
          suspension_lift: input.suspension,
          customer_name: input.customerName,
          customer_phone: input.customerPhone || undefined,
          customer_email: input.customerEmail || undefined,
          evidence_build_count: input.evidenceBuilds,
          sample_build_urls: input.sampleBuildUrls,
          rubbing_status: input.rubbingStatus,
          trimming_status: input.trimmingStatus,
        });

        // Create lead in Payload
        const lead = await createLead(client, {
          name: input.customerName,
          email: input.customerEmail || undefined,
          phone: input.customerPhone || undefined,
          vehicle: {
            year: input.vehicleYear,
            make: input.vehicleMake,
            model: input.vehicleModel,
            trim: input.vehicleTrim,
          },
          service: 'AI Fitment Quote',
          message: `Quote ID: ${mcpQuote.quote_id}`,
          source: 'ai_assistant',
        });

        // Create quote in Payload
        await createQuote(client, {
          quoteId: mcpQuote.quote_id,
          leadId: lead.id,
          vehicle: {
            year: input.vehicleYear,
            make: input.vehicleMake,
            model: input.vehicleModel,
          },
          intent: 'wheels_and_tires',
          items: [
            {
              type: 'wheel',
              name: 'Wheel Package',
              specs: input.wheelSize,
              quantity: 4,
            },
            {
              type: 'tire',
              name: 'Tire Package',
              specs: input.tireSize,
              quantity: 4,
            },
            ...(input.suspension !== 'Stock' ? [{
              type: 'suspension' as const,
              name: input.suspension,
              quantity: 1,
            }] : []),
          ],
          evidenceBuilds: input.sampleBuildUrls,
          status: 'draft',
          expiresAt: mcpQuote.expires_at,
        });

        return {
          quoteId: mcpQuote.quote_id,
          qrCodeUrl: mcpQuote.qr_code_url,
          leadId: lead.id,
        };
      } catch (error) {
        console.error('Error creating quote:', error);
        throw new Error('Failed to generate quote. Please try again.');
      }
    },
  }),

  getQuote: defineAction({
    input: z.object({
      quoteId: z.string(),
    }),
    handler: async ({ quoteId }) => {
      const { WheelFitmentMCP } = await import('@/lib/mcp-client');
      const mcp = new WheelFitmentMCP();
      
      try {
        const quote = await mcp.getQuote(quoteId);
        return quote;
      } catch (error) {
        console.error('Error fetching quote:', error);
        throw new Error('Quote not found');
      }
    },
  }),

  // ============ SEED DATA ============
  seedData: defineAction({
    input: z.object({
      profile: z.object({
        name: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
        }).optional(),
        social: z.object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
        }).optional(),
        financingUrl: z.string().optional(),
      }).optional(),
      services: z.array(z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        price: z.number().optional().default(0),
        duration: z.string().optional().default(""),
        icon: z.enum(['wrench', 'tire', 'car', 'gauge', 'shield', 'settings']).optional().default('wrench'),
        featured: z.boolean().optional().default(false),
        sortOrder: z.number().optional().default(0),
      })).optional(),
      testimonials: z.array(z.object({
        name: z.string(),
        text: z.string(),
        rating: z.number().optional().default(5),
        source: z.enum(['google', 'yelp', 'facebook', 'website', 'other']).optional().default('google'),
        date: z.string().optional(),
      })).optional(),
      hours: z.array(z.object({
        day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        open: z.string().optional().default("08:00"),
        close: z.string().optional().default("18:00"),
        closed: z.boolean().optional().default(false),
      })).optional(),
    }),
    handler: async (input) => {
      const client = getClient();

      if (input.profile) {
        await updateProfile(client, input.profile as any);
      }

      if (input.hours) {
        for (const hour of input.hours) {
          await updateHours(client, hour.day, {
            open: hour.open,
            close: hour.close,
            closed: hour.closed,
          });
        }
      }

      if (input.services) {
        for (const service of input.services) {
          await addService(client, service as any);
        }
      }

      if (input.testimonials) {
        for (const testimonial of input.testimonials) {
          await addTestimonial(client, {
            ...testimonial,
            date: testimonial.date || new Date().toISOString().split("T")[0],
          } as any);
        }
      }

      return { success: true };
    },
  }),
};
