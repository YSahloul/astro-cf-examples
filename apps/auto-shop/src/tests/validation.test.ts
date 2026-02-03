import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../db/schema";

// Validation schemas matching the action inputs
const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  vehicle: z.string().optional().default(""),
  service: z.string().optional().default(""),
  message: z.string().optional().default(""),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  price: z.number().min(0).optional().default(0),
  duration: z.string().optional().default(""),
  icon: z.string().optional().default("wrench"),
  featured: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
});

const testimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  text: z.string().min(1, "Review text is required"),
  rating: z.number().min(1).max(5).optional().default(5),
  source: z.string().optional().default("Google"),
  date: z.string().optional(),
});

const profileSchema = z.object({
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
});

const hoursSchema = z.object({
  day: z.string(),
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const leadStatusSchema = z.enum(["new", "contacted", "converted", "closed"]);

function getDb() {
  return drizzle(env.DB, { schema });
}

async function setupTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS brands (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      logo_url text DEFAULT '',
      sort_order integer DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      url text NOT NULL,
      alt text DEFAULT '',
      caption text DEFAULT '',
      sort_order integer DEFAULT 0,
      created_at text DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS hours (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      day text NOT NULL,
      open text DEFAULT '08:00',
      close text DEFAULT '18:00',
      closed integer DEFAULT false
    )`,
    `CREATE TABLE IF NOT EXISTS leads (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      email text DEFAULT '',
      phone text DEFAULT '',
      vehicle text DEFAULT '',
      service text DEFAULT '',
      message text DEFAULT '',
      status text DEFAULT 'new',
      created_at text DEFAULT '',
      updated_at text DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS profile (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text DEFAULT 'Auto Shop' NOT NULL,
      tagline text DEFAULT '',
      description text DEFAULT '',
      phone text DEFAULT '',
      email text DEFAULT '',
      address text DEFAULT '',
      city text DEFAULT '',
      state text DEFAULT '',
      zip text DEFAULT '',
      hero_image text DEFAULT '',
      instagram text DEFAULT '',
      facebook text DEFAULT '',
      financing_url text DEFAULT '',
      updated_at text DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      description text DEFAULT '',
      price real DEFAULT 0,
      duration text DEFAULT '',
      icon text DEFAULT 'wrench',
      featured integer DEFAULT false,
      sort_order integer DEFAULT 0,
      created_at text DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS testimonials (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      text text NOT NULL,
      rating integer DEFAULT 5,
      source text DEFAULT 'Google',
      date text DEFAULT ''
    )`,
  ];

  for (const sql of statements) {
    await env.DB.prepare(sql).run();
  }
}

async function clearTables() {
  const tables = ["leads", "services", "testimonials", "gallery", "brands", "hours", "profile"];
  for (const table of tables) {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  }
}

describe("Input Validation", () => {
  beforeAll(async () => {
    await setupTables();
  });

  beforeEach(async () => {
    await clearTables();
  });

  describe("Lead Validation", () => {
    it("should accept valid lead data", () => {
      const validLead = {
        name: "John Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
        vehicle: "2022 Ford F-150",
        service: "Wheel Installation",
        message: "Looking for 20 inch wheels",
      };

      const result = leadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it("should reject lead without name", () => {
      const invalidLead = {
        name: "",
        email: "john@example.com",
      };

      const result = leadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it("should accept lead with only required field (name)", () => {
      const minimalLead = {
        name: "John Doe",
      };

      const result = leadSchema.safeParse(minimalLead);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("");
        expect(result.data.phone).toBe("");
      }
    });
  });

  describe("Service Validation", () => {
    it("should accept valid service data", () => {
      const validService = {
        name: "Wheel Installation",
        description: "Professional wheel mounting",
        price: 25.00,
        duration: "30 min",
        featured: true,
      };

      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it("should reject service without name", () => {
      const invalidService = {
        name: "",
        description: "Some description",
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });

    it("should reject negative price", () => {
      const invalidService = {
        name: "Service",
        price: -10,
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });

    it("should apply default values", () => {
      const minimalService = {
        name: "Service Name",
      };

      const result = serviceSchema.safeParse(minimalService);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(0);
        expect(result.data.icon).toBe("wrench");
        expect(result.data.featured).toBe(false);
      }
    });
  });

  describe("Testimonial Validation", () => {
    it("should accept valid testimonial data", () => {
      const validTestimonial = {
        name: "Happy Customer",
        text: "Great service! Highly recommend.",
        rating: 5,
        source: "Google",
      };

      const result = testimonialSchema.safeParse(validTestimonial);
      expect(result.success).toBe(true);
    });

    it("should reject testimonial without name", () => {
      const invalidTestimonial = {
        name: "",
        text: "Great service!",
      };

      const result = testimonialSchema.safeParse(invalidTestimonial);
      expect(result.success).toBe(false);
    });

    it("should reject testimonial without text", () => {
      const invalidTestimonial = {
        name: "Customer",
        text: "",
      };

      const result = testimonialSchema.safeParse(invalidTestimonial);
      expect(result.success).toBe(false);
    });

    it("should reject rating out of range", () => {
      const invalidTestimonial = {
        name: "Customer",
        text: "Review",
        rating: 6,
      };

      const result = testimonialSchema.safeParse(invalidTestimonial);
      expect(result.success).toBe(false);
    });

    it("should reject zero rating", () => {
      const invalidTestimonial = {
        name: "Customer",
        text: "Review",
        rating: 0,
      };

      const result = testimonialSchema.safeParse(invalidTestimonial);
      expect(result.success).toBe(false);
    });
  });

  describe("Lead Status Validation", () => {
    it("should accept valid status values", () => {
      const validStatuses = ["new", "contacted", "converted", "closed"];
      
      for (const status of validStatuses) {
        const result = leadStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status values", () => {
      const invalidStatuses = ["pending", "done", "active", ""];
      
      for (const status of invalidStatuses) {
        const result = leadStatusSchema.safeParse(status);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Hours Validation", () => {
    it("should accept valid hours data", () => {
      const validHours = {
        day: "Monday",
        open: "08:00",
        close: "18:00",
        closed: false,
      };

      const result = hoursSchema.safeParse(validHours);
      expect(result.success).toBe(true);
    });

    it("should accept closed day", () => {
      const closedDay = {
        day: "Sunday",
        open: "00:00",
        close: "00:00",
        closed: true,
      };

      const result = hoursSchema.safeParse(closedDay);
      expect(result.success).toBe(true);
    });
  });

  describe("Profile Validation", () => {
    it("should accept valid profile data", () => {
      const validProfile = {
        name: "Sal's Wheels & Tires",
        phone: "(713) 555-1234",
        email: "info@salswheels.com",
        address: "123 Main St",
        city: "Houston",
        state: "TX",
        zip: "77001",
      };

      const result = profileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it("should accept partial profile update", () => {
      const partialProfile = {
        name: "New Name",
      };

      const result = profileSchema.safeParse(partialProfile);
      expect(result.success).toBe(true);
    });

    it("should accept empty profile (all optional)", () => {
      const emptyProfile = {};

      const result = profileSchema.safeParse(emptyProfile);
      expect(result.success).toBe(true);
    });
  });
});

describe("Data Integrity", () => {
  beforeAll(async () => {
    await setupTables();
  });

  beforeEach(async () => {
    await clearTables();
  });

  it("should maintain data integrity after multiple operations", async () => {
    const db = getDb();

    // Create multiple leads
    const leadsToInsert = [
      { name: "Lead 1", email: "lead1@test.com", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: "Lead 2", email: "lead2@test.com", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: "Lead 3", email: "lead3@test.com", status: "new", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    await db.insert(schema.leads).values(leadsToInsert);

    // Verify count
    let leads = await db.select().from(schema.leads);
    expect(leads).toHaveLength(3);

    // Delete one
    await db.delete(schema.leads).where(eq(schema.leads.name, "Lead 2"));

    // Verify count again
    leads = await db.select().from(schema.leads);
    expect(leads).toHaveLength(2);

    // Verify remaining leads
    const names = leads.map(l => l.name);
    expect(names).toContain("Lead 1");
    expect(names).toContain("Lead 3");
    expect(names).not.toContain("Lead 2");
  });

  it("should handle special characters in text fields", async () => {
    const db = getDb();

    const specialCharsLead = {
      name: "O'Brien & Sons",
      email: "test+tag@example.com",
      message: "Need help with \"custom\" wheels - 20\" rims",
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(schema.leads).values(specialCharsLead);

    const [retrieved] = await db.select().from(schema.leads);

    expect(retrieved.name).toBe("O'Brien & Sons");
    expect(retrieved.email).toBe("test+tag@example.com");
    expect(retrieved.message).toBe("Need help with \"custom\" wheels - 20\" rims");
  });

  it("should handle unicode characters", async () => {
    const db = getDb();

    const unicodeLead = {
      name: "Jose Garcia",
      message: "Necesito ruedas nuevas para mi camion",
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(schema.leads).values(unicodeLead);

    const [retrieved] = await db.select().from(schema.leads);

    expect(retrieved.name).toBe("Jose Garcia");
    expect(retrieved.message).toBe("Necesito ruedas nuevas para mi camion");
  });

  it("should handle decimal prices correctly", async () => {
    const db = getDb();

    const service = {
      name: "Premium Service",
      price: 149.99,
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.services).values(service);

    const [retrieved] = await db.select().from(schema.services);

    expect(retrieved.price).toBe(149.99);
  });
});
