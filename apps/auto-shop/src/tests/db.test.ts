import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { eq, asc, desc } from "drizzle-orm";
import * as schema from "../db/schema";

function getDb() {
  return drizzle(env.DB, { schema });
}

// Create tables on first run
async function setupTables() {
  // Create tables one by one with proper error handling
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

describe("Database Operations", () => {
  beforeAll(async () => {
    await setupTables();
  });

  beforeEach(async () => {
    await clearTables();
  });

  describe("Leads (Contact Form Submissions)", () => {
    it("should create a new lead", async () => {
      const db = getDb();
      const now = new Date().toISOString();

      const result = await db
        .insert(schema.leads)
        .values({
          name: "John Doe",
          email: "john@example.com",
          phone: "(555) 123-4567",
          vehicle: "2022 Ford F-150",
          service: "Wheel Installation",
          message: "Looking for 20 inch wheels",
          status: "new",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.leads.id });

      expect(result[0].id).toBeDefined();
      expect(result[0].id).toBeGreaterThan(0);
    });

    it("should retrieve leads", async () => {
      const db = getDb();
      const now = new Date().toISOString();

      // Insert test lead
      await db.insert(schema.leads).values({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "(555) 987-6543",
        vehicle: "2023 Toyota Tacoma",
        service: "Tire Installation",
        message: "Need all-terrain tires",
        status: "new",
        createdAt: now,
        updatedAt: now,
      });

      const leads = await db.select().from(schema.leads);

      expect(leads).toHaveLength(1);
      expect(leads[0].name).toBe("Jane Smith");
      expect(leads[0].email).toBe("jane@example.com");
      expect(leads[0].vehicle).toBe("2023 Toyota Tacoma");
    });

    it("should update lead status", async () => {
      const db = getDb();
      const now = new Date().toISOString();

      // Insert test lead
      const [inserted] = await db
        .insert(schema.leads)
        .values({
          name: "Bob Wilson",
          email: "bob@example.com",
          status: "new",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.leads.id });

      // Update status
      await db
        .update(schema.leads)
        .set({ status: "contacted", updatedAt: new Date().toISOString() })
        .where(eq(schema.leads.id, inserted.id));

      // Verify update
      const [updated] = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, inserted.id));

      expect(updated.status).toBe("contacted");
    });

    it("should delete a lead", async () => {
      const db = getDb();
      const now = new Date().toISOString();

      // Insert test lead
      const [inserted] = await db
        .insert(schema.leads)
        .values({
          name: "Delete Me",
          status: "new",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.leads.id });

      // Delete
      await db.delete(schema.leads).where(eq(schema.leads.id, inserted.id));

      // Verify deletion
      const leads = await db.select().from(schema.leads);
      expect(leads).toHaveLength(0);
    });
  });

  describe("Services", () => {
    it("should create a new service", async () => {
      const db = getDb();

      const result = await db
        .insert(schema.services)
        .values({
          name: "Wheel Installation",
          description: "Professional wheel mounting and balancing",
          price: 25,
          duration: "30 min",
          icon: "wrench",
          featured: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: schema.services.id });

      expect(result[0].id).toBeDefined();
    });

    it("should retrieve services ordered by featured and sortOrder", async () => {
      const db = getDb();

      // Insert multiple services
      await db.insert(schema.services).values([
        { name: "Service A", featured: false, sortOrder: 1, createdAt: new Date().toISOString() },
        { name: "Service B", featured: true, sortOrder: 2, createdAt: new Date().toISOString() },
        { name: "Service C", featured: true, sortOrder: 1, createdAt: new Date().toISOString() },
      ]);

      const services = await db
        .select()
        .from(schema.services)
        .orderBy(desc(schema.services.featured), asc(schema.services.sortOrder));

      expect(services).toHaveLength(3);
      // Featured services should come first
      expect(services[0].featured).toBe(true);
      expect(services[1].featured).toBe(true);
      expect(services[2].featured).toBe(false);
    });

    it("should update a service", async () => {
      const db = getDb();

      const [inserted] = await db
        .insert(schema.services)
        .values({
          name: "Old Name",
          price: 50,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: schema.services.id });

      await db
        .update(schema.services)
        .set({ name: "New Name", price: 75 })
        .where(eq(schema.services.id, inserted.id));

      const [updated] = await db
        .select()
        .from(schema.services)
        .where(eq(schema.services.id, inserted.id));

      expect(updated.name).toBe("New Name");
      expect(updated.price).toBe(75);
    });
  });

  describe("Profile", () => {
    it("should create and retrieve profile", async () => {
      const db = getDb();

      await db.insert(schema.profile).values({
        name: "Sal's Wheels & Tires",
        tagline: "Your Local Wheel Experts",
        phone: "(713) 555-1234",
        email: "info@salswheels.com",
        address: "123 Main St",
        city: "Houston",
        state: "TX",
        zip: "77001",
        updatedAt: new Date().toISOString(),
      });

      const [profile] = await db.select().from(schema.profile).limit(1);

      expect(profile.name).toBe("Sal's Wheels & Tires");
      expect(profile.city).toBe("Houston");
      expect(profile.state).toBe("TX");
    });

    it("should update existing profile", async () => {
      const db = getDb();

      // Create initial profile
      await db.insert(schema.profile).values({
        name: "Initial Name",
        updatedAt: new Date().toISOString(),
      });

      const [existing] = await db.select().from(schema.profile).limit(1);

      // Update
      await db
        .update(schema.profile)
        .set({ name: "Updated Name", tagline: "New Tagline" })
        .where(eq(schema.profile.id, existing.id));

      const [updated] = await db.select().from(schema.profile).limit(1);

      expect(updated.name).toBe("Updated Name");
      expect(updated.tagline).toBe("New Tagline");
    });
  });

  describe("Hours", () => {
    it("should create and retrieve business hours", async () => {
      const db = getDb();

      const daysData = [
        { day: "Monday", open: "08:00", close: "18:00", closed: false },
        { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
        { day: "Sunday", open: "00:00", close: "00:00", closed: true },
      ];

      await db.insert(schema.hours).values(daysData);

      const hours = await db.select().from(schema.hours);

      expect(hours).toHaveLength(3);

      const sunday = hours.find((h) => h.day === "Sunday");
      expect(sunday?.closed).toBe(true);
    });

    it("should update hours for a specific day", async () => {
      const db = getDb();

      await db.insert(schema.hours).values({
        day: "Saturday",
        open: "09:00",
        close: "17:00",
        closed: false,
      });

      // Update Saturday hours
      await db
        .update(schema.hours)
        .set({ open: "10:00", close: "14:00" })
        .where(eq(schema.hours.day, "Saturday"));

      const [saturday] = await db
        .select()
        .from(schema.hours)
        .where(eq(schema.hours.day, "Saturday"));

      expect(saturday.open).toBe("10:00");
      expect(saturday.close).toBe("14:00");
    });
  });

  describe("Brands", () => {
    it("should create and retrieve brands", async () => {
      const db = getDb();

      await db.insert(schema.brands).values([
        { name: "Nitto", logoUrl: "https://example.com/nitto.png", sortOrder: 1 },
        { name: "BFGoodrich", logoUrl: "https://example.com/bfg.png", sortOrder: 2 },
        { name: "Fuel Off-Road", logoUrl: "https://example.com/fuel.png", sortOrder: 3 },
      ]);

      const brands = await db
        .select()
        .from(schema.brands)
        .orderBy(asc(schema.brands.sortOrder));

      expect(brands).toHaveLength(3);
      expect(brands[0].name).toBe("Nitto");
      expect(brands[2].name).toBe("Fuel Off-Road");
    });
  });

  describe("Testimonials", () => {
    it("should create and retrieve testimonials", async () => {
      const db = getDb();

      await db.insert(schema.testimonials).values({
        name: "Happy Customer",
        text: "Great service! Highly recommend.",
        rating: 5,
        source: "Google",
        date: "2025-01-15",
      });

      const [testimonial] = await db.select().from(schema.testimonials);

      expect(testimonial.name).toBe("Happy Customer");
      expect(testimonial.rating).toBe(5);
      expect(testimonial.source).toBe("Google");
    });
  });

  describe("Gallery", () => {
    it("should create and retrieve gallery images", async () => {
      const db = getDb();

      await db.insert(schema.gallery).values([
        {
          url: "https://example.com/image1.jpg",
          alt: "Custom wheels on truck",
          caption: "2022 Ford F-150 with 20in Fuel wheels",
          sortOrder: 1,
          createdAt: new Date().toISOString(),
        },
        {
          url: "https://example.com/image2.jpg",
          alt: "Tire installation",
          caption: "Professional mounting service",
          sortOrder: 2,
          createdAt: new Date().toISOString(),
        },
      ]);

      const images = await db
        .select()
        .from(schema.gallery)
        .orderBy(asc(schema.gallery.sortOrder));

      expect(images).toHaveLength(2);
      expect(images[0].caption).toBe("2022 Ford F-150 with 20in Fuel wheels");
    });
  });
});
