import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Profile - single row for business info
export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("Auto Shop"),
  tagline: text("tagline").default(""),
  description: text("description").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  city: text("city").default(""),
  state: text("state").default(""),
  zip: text("zip").default(""),
  heroImage: text("hero_image").default(""),
  instagram: text("instagram").default(""),
  facebook: text("facebook").default(""),
  financingUrl: text("financing_url").default(""),
  updatedAt: text("updated_at").default(""),
});

// Business hours
export const hours = sqliteTable("hours", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: text("day").notNull().unique(),
  open: text("open").default("08:00"),
  close: text("close").default("18:00"),
  closed: integer("closed", { mode: "boolean" }).default(false),
});

// Services offered
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").default(""),
  price: real("price").default(0),
  duration: text("duration").default(""),
  icon: text("icon").default("wrench"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(""),
});

// Customer testimonials
export const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  text: text("text").notNull(),
  rating: integer("rating").default(5),
  source: text("source").default("Google"),
  date: text("date").default(""),
});

// Gallery images
export const gallery = sqliteTable("gallery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  alt: text("alt").default(""),
  caption: text("caption").default(""),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(""),
});

// Brands carried
export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  logoUrl: text("logo_url").default(""),
  sortOrder: integer("sort_order").default(0),
});

// Lead capture / contact form submissions
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").default(""),
  phone: text("phone").default(""),
  vehicle: text("vehicle").default(""),
  service: text("service").default(""),
  message: text("message").default(""),
  status: text("status").default("new"), // new, contacted, converted, closed
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

// AI-enhanced lead data (references leads table)
export const leadsAI = sqliteTable("leads_ai", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  vehicleYear: integer("vehicle_year"),
  vehicleMake: text("vehicle_make").default(""),
  vehicleModel: text("vehicle_model").default(""),
  vehicleTrim: text("vehicle_trim").default(""),
  intent: text("intent").default(""), // tires_only, wheels_only, wheels_and_tires, package
  recommendedBuilds: text("recommended_builds").default(""), // JSON array
  selectedBuild: text("selected_build").default(""), // JSON of selected recommendation
  quoteId: text("quote_id").default(""),
  agentSessionId: text("agent_session_id").default(""),
  source: text("source").default("ai_assistant"),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

// AI assistant conversation sessions
export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull().unique(),
  visitorId: text("visitor_id").notNull(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  vehicleYear: integer("vehicle_year"),
  vehicleMake: text("vehicle_make").default(""),
  vehicleModel: text("vehicle_model").default(""),
  intent: text("intent").default(""),
  messageCount: integer("message_count").default(0),
  firstMessageAt: text("first_message_at").default(""),
  lastMessageAt: text("last_message_at").default(""),
  status: text("status").default("active"), // active, converted, abandoned
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

// Individual messages within conversations
export const conversationMessages = sqliteTable("conversation_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, tool
  content: text("content").notNull(),
  toolName: text("tool_name").default(""),
  toolInput: text("tool_input").default(""),
  toolOutput: text("tool_output").default(""),
  createdAt: text("created_at").default(""),
});

// Fitment quotes generated by AI assistant
export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: text("quote_id").notNull().unique(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
  conversationId: integer("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  vehicleYear: integer("vehicle_year"),
  vehicleMake: text("vehicle_make").default(""),
  vehicleModel: text("vehicle_model").default(""),
  intent: text("intent").default(""),
  wheelSpecs: text("wheel_specs").default(""), // JSON
  tireSpecs: text("tire_specs").default(""), // JSON
  suspensionSpecs: text("suspension_specs").default(""), // JSON
  totalPrice: real("total_price").default(0),
  evidenceBuilds: text("evidence_builds").default(""), // JSON array of build URLs
  qrCodeUrl: text("qr_code_url").default(""),
  status: text("status").default("draft"), // draft, sent, viewed, converted, expired
  expiresAt: text("expires_at").default(""),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

// Type exports for use in application
export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;

export type Hours = typeof hours.$inferSelect;
export type NewHours = typeof hours.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type GalleryImage = typeof gallery.$inferSelect;
export type NewGalleryImage = typeof gallery.$inferInsert;

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadAI = typeof leadsAI.$inferSelect;
export type NewLeadAI = typeof leadsAI.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
