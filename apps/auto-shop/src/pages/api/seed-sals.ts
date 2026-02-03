import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb, profile, services, testimonials, gallery, brands, hours } from "@/db";

// Sal's Wheels & Tires data
const salsData = {
  profile: {
    name: "Sal's Wheels & Tires",
    tagline: "Wheels, Tires & Lifts",
    description: "Quality tires, expert alignments, and custom wheels for trucks, Jeeps, and everyday drivers.",
    phone: "(817) 862-7031",
    email: "Salscustoms89@gmail.com",
    address: "1004 W Main St",
    city: "Crowley",
    state: "TX",
    zip: "76036",
    heroImage: "https://agenticflows.co/api/uploads/912b79f6-604d-4bbb-a20e-ed39bd16de46/hero-readylift-nitto.jpg",
    instagram: "@salswheels",
    facebook: "SalsWheels",
    financingUrl: "https://application.kafene.com/applications/new?merchant=MER-E29GV&store=STR-EVFGW",
  },
  hours: [
    { day: "Monday", open: "08:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
    { day: "Thursday", open: "08:00", close: "18:00", closed: false },
    { day: "Friday", open: "08:00", close: "18:00", closed: false },
    { day: "Saturday", open: "08:00", close: "18:00", closed: false },
    { day: "Sunday", open: "08:00", close: "18:00", closed: true },
  ],
  services: [
    {
      name: "Tire Sales & Installation",
      description: "Expert installation of Nitto, Toyo, Vogue, and BFGoodrich tires.",
      price: 0,
      duration: "",
      icon: "disc",
      featured: true,
      sortOrder: 1,
    },
    {
      name: "Wheel Alignment",
      description: "Precision alignments to prevent uneven tire wear.",
      price: 0,
      duration: "",
      icon: "repeat",
      featured: true,
      sortOrder: 2,
    },
    {
      name: "Automotive Repair",
      description: "General mechanical repairs and maintenance.",
      price: 0,
      duration: "",
      icon: "layers",
      featured: true,
      sortOrder: 3,
    },
    {
      name: "Suspension Repair",
      description: "Shocks, struts, and steering repairs.",
      price: 0,
      duration: "",
      icon: "settings",
      featured: false,
      sortOrder: 4,
    },
    {
      name: "Tire Repair",
      description: "Fast flat tire repairs.",
      price: 0,
      duration: "",
      icon: "wrench",
      featured: false,
      sortOrder: 5,
    },
    {
      name: "Lift Kits & Leveling",
      description: "Lift kits and leveling systems for trucks and Jeeps.",
      price: 0,
      duration: "",
      icon: "activity",
      featured: false,
      sortOrder: 6,
    },
  ],
  testimonials: [
    {
      name: "Victor Garcia",
      text: "Great service and awesome price!",
      rating: 5,
      source: "Google",
      date: "2024-01-15",
    },
    {
      name: "Chris Lynch",
      text: "Great work, prices hard to beat.",
      rating: 5,
      source: "Google",
      date: "2024-02-20",
    },
    {
      name: "Miguel Maldonado",
      text: "Great service from Jay!",
      rating: 5,
      source: "Facebook",
      date: "2024-03-10",
    },
    {
      name: "Javier Vera",
      text: "Fast service, best in Crowley.",
      rating: 5,
      source: "Facebook",
      date: "2024-04-05",
    },
  ],
  gallery: [
    {
      url: "https://agenticflows.co/api/uploads/4dd316c9-4a4b-4cd8-9eba-04a4345f5d84/gallery-usmags.jpg",
      alt: "US Mags wheels on custom build",
      caption: "US Mags Wheels",
      sortOrder: 1,
    },
    {
      url: "https://agenticflows.co/api/uploads/627421db-6de2-4153-b9e1-f4eba44c183a/gallery-f250-vision.jpg",
      alt: "2025 Ford F-250 with Vision wheels and 33\" off-road tires",
      caption: "Ford F-250 - Vision Wheels",
      sortOrder: 2,
    },
    {
      url: "https://agenticflows.co/api/uploads/906a6582-e0eb-4c2c-8ce1-6151b18f8d78/gallery-tahoe-24.jpg",
      alt: "Tahoe on 24\" wheels",
      caption: "Tahoe - 24\" Wheels",
      sortOrder: 3,
    },
    {
      url: "https://agenticflows.co/api/uploads/2892573a-c7ca-4d49-99cf-eb581f8483c2/gallery-lexus-ferrada.jpg",
      alt: "Red Lexus with 20\" staggered Ferrada wheels",
      caption: "Lexus - Ferrada Wheels",
      sortOrder: 4,
    },
    {
      url: "https://agenticflows.co/api/uploads/dc7d94b8-4496-44de-83d3-fee3d05f00d3/gallery-tundra-lift.jpg",
      alt: "Toyota Tundra with 6\" lift kit",
      caption: "Tundra - 6\" Lift Kit",
      sortOrder: 5,
    },
    {
      url: "https://agenticflows.co/api/uploads/1684ca3c-607d-4544-8521-399416f1fb87/gallery-jeep-aev.jpg",
      alt: "2024 Jeep Wrangler Mojave with AEV 2\" lift",
      caption: "Jeep Wrangler - AEV Lift",
      sortOrder: 6,
    },
  ],
  brands: [
    { name: "US Mags", logoUrl: "/brands/usmags.svg", sortOrder: 1 },
    { name: "Nitto", logoUrl: "/brands/nitto.png", sortOrder: 2 },
    { name: "Toyo Tires", logoUrl: "/brands/toyo.svg", sortOrder: 3 },
    { name: "Vogue", logoUrl: "/brands/vogue.png", sortOrder: 4 },
    { name: "BFGoodrich", logoUrl: "/brands/bfgoodrich.svg", sortOrder: 5 },
    { name: "Vision Wheel", logoUrl: "/brands/vision.png", sortOrder: 6 },
    { name: "Ferrada", logoUrl: "/brands/ferrada.png", sortOrder: 7 },
    { name: "Lethal Offroad", logoUrl: "/brands/lethal.png", sortOrder: 8 },
    { name: "Fuel Off-Road", logoUrl: "/brands/fuel-wordmark.png", sortOrder: 9 },
    { name: "Moto Metal", logoUrl: "/brands/motometal.svg", sortOrder: 10 },
  ],
};

export const GET: APIRoute = async () => {
  try {
    const db = getDb(env.DB);
    const now = new Date().toISOString();

    // Clear and seed profile
    await db.delete(profile);
    await db.insert(profile).values({
      ...salsData.profile,
      updatedAt: now,
    });

    // Clear and seed hours
    await db.delete(hours);
    await db.insert(hours).values(salsData.hours);

    // Clear and seed services
    await db.delete(services);
    await db.insert(services).values(
      salsData.services.map(s => ({ ...s, createdAt: now }))
    );

    // Clear and seed testimonials
    await db.delete(testimonials);
    await db.insert(testimonials).values(salsData.testimonials);

    // Clear and seed gallery
    await db.delete(gallery);
    await db.insert(gallery).values(
      salsData.gallery.map(g => ({ ...g, createdAt: now }))
    );

    // Clear and seed brands
    await db.delete(brands);
    await db.insert(brands).values(salsData.brands);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sal's Wheels & Tires data seeded successfully!" 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
};
