import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { eq, asc, desc } from "drizzle-orm";
import { getDb, profile, hours, services, testimonials, gallery, brands, leads, leadsAI, quotes } from "@/db";
import { wheelFitmentMCP } from "@/lib/mcp-client";

// Common vehicle makes (can be expanded or fetched from API)
const VEHICLE_MAKES = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet",
  "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda",
  "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mini",
  "Mitsubishi", "Nissan", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

// Common models by make (subset - can be expanded or fetched from API)
const VEHICLE_MODELS: Record<string, string[]> = {
  "Toyota": ["4Runner", "Camry", "Corolla", "Highlander", "Land Cruiser", "RAV4", "Sequoia", "Tacoma", "Tundra"],
  "Ford": ["Bronco", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Mustang", "Ranger"],
  "Chevrolet": ["Blazer", "Camaro", "Colorado", "Corvette", "Equinox", "Silverado 1500", "Silverado 2500HD", "Suburban", "Tahoe", "Traverse"],
  "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wagoneer", "Wrangler"],
  "Ram": ["1500", "2500", "3500", "ProMaster"],
  "GMC": ["Acadia", "Canyon", "Sierra 1500", "Sierra 2500HD", "Terrain", "Yukon", "Yukon XL"],
  "Nissan": ["Altima", "Armada", "Frontier", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan"],
  "Dodge": ["Challenger", "Charger", "Durango", "Hornet"],
  "Subaru": ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
  "BMW": ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "G-Class", "GLA", "GLC", "GLE", "GLS", "S-Class"],
  "Audi": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "RS5", "S4"],
  "Lexus": ["ES", "GX", "IS", "LS", "LX", "NX", "RX", "TX", "UX"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Volkswagen": ["Atlas", "Golf", "ID.4", "Jetta", "Passat", "Taos", "Tiguan"],
  "Hyundai": ["Elantra", "Ioniq", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Venue"],
  "Kia": ["Carnival", "EV6", "Forte", "K5", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Mazda": ["CX-30", "CX-5", "CX-50", "CX-9", "CX-90", "Mazda3", "MX-5 Miata"],
  "Porsche": ["911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
};

// Helper to get database instance
function db() {
  return getDb(env.DB);
}

// Helper functions for AI recommendations
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
  // Rough estimates based on suspension type
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
      const result = await db().select().from(profile).limit(1);
      return result[0] || null;
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      heroImage: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      financingUrl: z.string().optional(),
    }),
    handler: async (input) => {
      const existing = await db().select().from(profile).limit(1);
      
      if (existing.length === 0) {
        await db().insert(profile).values({
          ...input,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db().update(profile)
          .set({ ...input, updatedAt: new Date().toISOString() })
          .where(eq(profile.id, existing[0].id));
      }
      return { success: true };
    },
  }),

  // ============ HOURS ============
  getHours: defineAction({
    handler: async () => {
      const result = await db().select().from(hours);
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return result.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    },
  }),

  updateHours: defineAction({
    input: z.object({
      day: z.string(),
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    handler: async (input) => {
      const existing = await db().select().from(hours).where(eq(hours.day, input.day));
      
      if (existing.length === 0) {
        await db().insert(hours).values(input);
      } else {
        await db().update(hours)
          .set({ open: input.open, close: input.close, closed: input.closed })
          .where(eq(hours.day, input.day));
      }
      return { success: true };
    },
  }),

  // ============ SERVICES ============
  getServices: defineAction({
    handler: async () => {
      return await db().select().from(services).orderBy(desc(services.featured), asc(services.sortOrder));
    },
  }),

  addService: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional().default(""),
      price: z.number().min(0).optional().default(0),
      duration: z.string().optional().default(""),
      icon: z.string().optional().default("wrench"),
      featured: z.boolean().optional().default(false),
      sortOrder: z.number().optional().default(0),
    }),
    handler: async (input) => {
      const result = await db().insert(services).values({
        ...input,
        createdAt: new Date().toISOString(),
      }).returning({ id: services.id });
      return { id: result[0].id };
    },
  }),

  updateService: defineAction({
    input: z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      duration: z.string().optional(),
      icon: z.string().optional(),
      featured: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }),
    handler: async ({ id, ...data }) => {
      await db().update(services).set(data).where(eq(services.id, id));
      return { success: true };
    },
  }),

  deleteService: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      await db().delete(services).where(eq(services.id, id));
      return { success: true };
    },
  }),

  // ============ TESTIMONIALS ============
  getTestimonials: defineAction({
    handler: async () => {
      return await db().select().from(testimonials).orderBy(desc(testimonials.date));
    },
  }),

  addTestimonial: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      text: z.string().min(1, "Review text is required"),
      rating: z.number().min(1).max(5).optional().default(5),
      source: z.string().optional().default("Google"),
      date: z.string().optional(),
    }),
    handler: async (input) => {
      const result = await db().insert(testimonials).values({
        ...input,
        date: input.date || new Date().toISOString().split("T")[0],
      }).returning({ id: testimonials.id });
      return { id: result[0].id };
    },
  }),

  deleteTestimonial: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      await db().delete(testimonials).where(eq(testimonials.id, id));
      return { success: true };
    },
  }),

  // ============ GALLERY ============
  getGallery: defineAction({
    handler: async () => {
      return await db().select().from(gallery).orderBy(asc(gallery.sortOrder), desc(gallery.id));
    },
  }),

  addGalleryImage: defineAction({
    input: z.object({
      url: z.string().min(1, "URL is required"),
      alt: z.string().optional().default(""),
      caption: z.string().optional().default(""),
      sortOrder: z.number().optional().default(0),
    }),
    handler: async (input) => {
      const result = await db().insert(gallery).values({
        ...input,
        createdAt: new Date().toISOString(),
      }).returning({ id: gallery.id });
      return { id: result[0].id };
    },
  }),

  deleteGalleryImage: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      await db().delete(gallery).where(eq(gallery.id, id));
      return { success: true };
    },
  }),

  // ============ BRANDS ============
  getBrands: defineAction({
    handler: async () => {
      return await db().select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.id));
    },
  }),

  addBrand: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      logoUrl: z.string().optional().default(""),
      sortOrder: z.number().optional().default(0),
    }),
    handler: async (input) => {
      const result = await db().insert(brands).values(input).returning({ id: brands.id });
      return { id: result[0].id };
    },
  }),

  deleteBrand: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      await db().delete(brands).where(eq(brands.id, id));
      return { success: true };
    },
  }),

  // ============ LEADS ============
  getLeads: defineAction({
    handler: async () => {
      return await db().select().from(leads).orderBy(desc(leads.createdAt));
    },
  }),

  // Get leads with AI data joined
  getLeadsWithAI: defineAction({
    handler: async () => {
      const database = db();
      
      // Join leads with leadsAI
      const result = await database
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          vehicle: leads.vehicle,
          service: leads.service,
          message: leads.message,
          status: leads.status,
          createdAt: leads.createdAt,
          // AI fields
          vehicleYear: leadsAI.vehicleYear,
          vehicleMake: leadsAI.vehicleMake,
          vehicleModel: leadsAI.vehicleModel,
          intent: leadsAI.intent,
          quoteId: leadsAI.quoteId,
          source: leadsAI.source,
        })
        .from(leads)
        .leftJoin(leadsAI, eq(leads.id, leadsAI.leadId))
        .orderBy(desc(leads.createdAt));
      
      return result;
    },
  }),

  addLead: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      vehicle: z.string().optional().default(""),
      service: z.string().optional().default(""),
      message: z.string().optional().default(""),
    }),
    handler: async (input) => {
      const result = await db().insert(leads).values({
        ...input,
        status: "new",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning({ id: leads.id });
      return { id: result[0].id };
    },
  }),

  updateLeadStatus: defineAction({
    input: z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "converted", "closed"]),
    }),
    handler: async ({ id, status }) => {
      await db().update(leads)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(leads.id, id));
      return { success: true };
    },
  }),

  deleteLead: defineAction({
    input: z.object({ id: z.number() }),
    handler: async ({ id }) => {
      await db().delete(leads).where(eq(leads.id, id));
      return { success: true };
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
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        heroImage: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        financingUrl: z.string().optional(),
      }).optional(),
      services: z.array(z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        price: z.number().optional().default(0),
        duration: z.string().optional().default(""),
        icon: z.string().optional().default("wrench"),
        featured: z.boolean().optional().default(false),
        sortOrder: z.number().optional().default(0),
      })).optional(),
      testimonials: z.array(z.object({
        name: z.string(),
        text: z.string(),
        rating: z.number().optional().default(5),
        source: z.string().optional().default("Google"),
        date: z.string().optional(),
      })).optional(),
      gallery: z.array(z.object({
        url: z.string(),
        alt: z.string().optional().default(""),
        caption: z.string().optional().default(""),
        sortOrder: z.number().optional().default(0),
      })).optional(),
      brands: z.array(z.object({
        name: z.string(),
        logoUrl: z.string().optional().default(""),
        sortOrder: z.number().optional().default(0),
      })).optional(),
      hours: z.array(z.object({
        day: z.string(),
        open: z.string().optional().default("08:00"),
        close: z.string().optional().default("18:00"),
        closed: z.boolean().optional().default(false),
      })).optional(),
    }),
    handler: async (input) => {
      const database = db();

      if (input.profile) {
        await database.delete(profile);
        await database.insert(profile).values({
          ...input.profile,
          updatedAt: new Date().toISOString(),
        });
      }

      if (input.hours) {
        await database.delete(hours);
        await database.insert(hours).values(input.hours);
      }

      if (input.services) {
        await database.delete(services);
        await database.insert(services).values(
          input.services.map((s, i) => ({
            ...s,
            sortOrder: s.sortOrder ?? i,
            createdAt: new Date().toISOString(),
          }))
        );
      }

      if (input.testimonials) {
        await database.delete(testimonials);
        await database.insert(testimonials).values(
          input.testimonials.map(t => ({
            ...t,
            date: t.date || new Date().toISOString().split("T")[0],
          }))
        );
      }

      if (input.gallery) {
        await database.delete(gallery);
        await database.insert(gallery).values(
          input.gallery.map((g, i) => ({
            ...g,
            sortOrder: g.sortOrder ?? i,
            createdAt: new Date().toISOString(),
          }))
        );
      }

      if (input.brands) {
        await database.delete(brands);
        await database.insert(brands).values(
          input.brands.map((b, i) => ({
            ...b,
            sortOrder: b.sortOrder ?? i,
          }))
        );
      }

      return { success: true };
    },
  }),

  // ============ AI FITMENT ============

  // Get available vehicle makes for a year
  getVehicleMakes: defineAction({
    input: z.object({
      year: z.number(),
    }),
    handler: async ({ year }) => {
      // Common makes - in production, could come from MCP or cache
      const makes = [
        'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
        'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
        'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
        'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
      ];
      return makes;
    },
  }),

  // Get available vehicle models for a make/year
  getVehicleModels: defineAction({
    input: z.object({
      year: z.number(),
      make: z.string(),
    }),
    handler: async ({ year, make }) => {
      // Common models by make - in production, could come from MCP
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
  // Generate AI recommendations using MCP tools and LLM
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
        // Fetch data from MCP tools in parallel
        const [buildsResult, fitments, oemData] = await Promise.all([
          mcp.searchVehicleBuilds({ year, make, model, page: 1 }).catch(() => ({ builds: [], totalBuilds: 0, pagination: { page: 1, totalPages: 0 } })),
          mcp.recommendFitments({ year, make, model, intent, minEvidenceBuilds: 3, includeSamples: true, limit: 10 }).catch(() => ({ recommendations: [] })),
          mcp.getWheelSizeOEMData({ year, make, model }).catch(() => null),
        ]);

        // Also try to get guaranteed fitments for high-confidence options
        const guaranteed = await mcp.getGuaranteedFitments({ 
          year, make, model, 
          minBuilds: 3,
          allowSlightRub: false,
          allowMinorTrimming: false,
        }).catch(() => []);

        // Synthesize recommendations
        // In production, this would call an LLM to generate curated recommendations
        // For now, we'll structure the MCP data into a usable format
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

        // If no recommendations from MCP, use OEM data as fallback
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

  // Create quote from selected recommendation
  createQuote: defineAction({
    input: z.object({
      // Vehicle info
      vehicleYear: z.number(),
      vehicleMake: z.string(),
      vehicleModel: z.string(),
      vehicleTrim: z.string().optional(),
      
      // Selected recommendation
      wheelSize: z.string(),
      tireSize: z.string(),
      suspension: z.string(),
      priceRange: z.string(),
      
      // Common products (from recommendation)
      commonWheels: z.array(z.string()).optional(),
      commonTires: z.array(z.string()).optional(),
      sampleBuildUrls: z.array(z.string()).optional(),
      evidenceBuilds: z.number().optional(),
      
      // Fitment status
      rubbingStatus: z.string().optional(),
      trimmingStatus: z.string().optional(),
      
      // Customer info
      customerName: z.string().min(1, "Name is required"),
      customerPhone: z.string().optional(),
      customerEmail: z.string().email().optional().or(z.literal('')),
      
      // Optional: conversation context
      agentSessionId: z.string().optional(),
    }),
    handler: async (input) => {
      const database = db();
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

        // Create lead record
        const leadResult = await database.insert(leads).values({
          name: input.customerName,
          email: input.customerEmail || '',
          phone: input.customerPhone || '',
          vehicle: `${input.vehicleYear} ${input.vehicleMake} ${input.vehicleModel}`,
          service: 'AI Fitment Quote',
          message: `Quote ID: ${mcpQuote.quote_id}`,
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning({ id: leads.id });

        // Create lead AI record
        await database.insert(leadsAI).values({
          leadId: leadResult[0].id,
          vehicleYear: input.vehicleYear,
          vehicleMake: input.vehicleMake,
          vehicleModel: input.vehicleModel,
          vehicleTrim: input.vehicleTrim || '',
          intent: 'wheels_and_tires', // Default
          recommendedBuilds: JSON.stringify([{
            wheelSize: input.wheelSize,
            tireSize: input.tireSize,
            suspension: input.suspension,
          }]),
          selectedBuild: JSON.stringify({
            wheelSize: input.wheelSize,
            tireSize: input.tireSize,
            suspension: input.suspension,
            priceRange: input.priceRange,
          }),
          quoteId: mcpQuote.quote_id,
          agentSessionId: input.agentSessionId || '',
          source: 'ai_assistant',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create quote record
        await database.insert(quotes).values({
          quoteId: mcpQuote.quote_id,
          leadId: leadResult[0].id,
          vehicleYear: input.vehicleYear,
          vehicleMake: input.vehicleMake,
          vehicleModel: input.vehicleModel,
          intent: 'wheels_and_tires',
          wheelSpecs: JSON.stringify({
            size: input.wheelSize,
            commonOptions: input.commonWheels,
          }),
          tireSpecs: JSON.stringify({
            size: input.tireSize,
            commonOptions: input.commonTires,
          }),
          suspensionSpecs: JSON.stringify({
            type: input.suspension,
          }),
          totalPrice: 0, // Price TBD
          evidenceBuilds: JSON.stringify(input.sampleBuildUrls || []),
          qrCodeUrl: mcpQuote.qr_code_url,
          status: 'draft',
          expiresAt: mcpQuote.expires_at,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return {
          quoteId: mcpQuote.quote_id,
          qrCodeUrl: mcpQuote.qr_code_url,
          leadId: leadResult[0].id,
        };
      } catch (error) {
        console.error('Error creating quote:', error);
        throw new Error('Failed to generate quote. Please try again.');
      }
    },
  }),

  // Get quote by ID
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
};
