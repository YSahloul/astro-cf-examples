/**
 * Static site configuration for Sal's Wheels & Tires
 * 
 * This is the single source of truth for all business info.
 * Each tenant's Astro app has its own config - no CMS needed for this.
 */

export const siteConfig = {
  // Business Info
  name: "Sal's Wheels & Tires",
  tagline: "Wheels, Tires & Lifts",
  description: "Quality tires, expert alignments, and custom wheels for trucks, Jeeps, and everyday drivers.",
  
  // Contact
  phone: "(817) 862-7031",
  email: "Salscustoms89@gmail.com",
  
  // Location
  address: "1004 W Main St",
  city: "Crowley",
  state: "TX",
  zip: "76036",
  
  // Social
  instagram: "https://instagram.com/salswheels",
  facebook: "https://facebook.com/SalsWheels",
  
  // External Links
  financingUrl: "https://application.kafene.com/applications/new?merchant=MER-E29GV&store=STR-EVFGW",
  heroImage: "https://agenticflows.co/api/uploads/912b79f6-604d-4bbb-a20e-ed39bd16de46/hero-readylift-nitto.jpg",
  
  // Hours
  hours: [
    { day: "Monday", open: "08:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
    { day: "Thursday", open: "08:00", close: "18:00", closed: false },
    { day: "Friday", open: "08:00", close: "18:00", closed: false },
    { day: "Saturday", open: "08:00", close: "18:00", closed: false },
    { day: "Sunday", open: "", close: "", closed: true },
  ],
  
  // Services offered
  services: [
    { id: 1, name: "Tire Sales & Installation", description: "Expert installation of Nitto, Toyo, Vogue, and BFGoodrich tires.", price: 0, featured: true },
    { id: 2, name: "Wheel Alignment", description: "Precision alignments to prevent uneven tire wear.", price: 0, featured: true },
    { id: 3, name: "Automotive Repair", description: "General mechanical repairs and maintenance.", price: 0, featured: true },
    { id: 4, name: "Suspension Repair", description: "Shocks, struts, and steering repairs.", price: 0, featured: false },
    { id: 5, name: "Tire Repair", description: "Fast flat tire repairs.", price: 0, featured: false },
    { id: 6, name: "Lift Kits & Leveling", description: "Lift kits and leveling systems for trucks and Jeeps.", price: 0, featured: false },
  ],
  
  // Testimonials
  testimonials: [
    { id: 1, name: "Victor Garcia", text: "Great service and awesome price!", rating: 5, source: "Google" },
    { id: 2, name: "Chris Lynch", text: "Great work, prices hard to beat.", rating: 5, source: "Google" },
    { id: 3, name: "Miguel Maldonado", text: "Great service from Jay!", rating: 5, source: "Facebook" },
    { id: 4, name: "Javier Vera", text: "Fast service, best in Crowley.", rating: 5, source: "Facebook" },
  ],

  // Gallery
  gallery: [
    { url: "https://agenticflows.co/api/uploads/4dd316c9-4a4b-4cd8-9eba-04a4345f5d84/gallery-usmags.jpg", alt: "US Mags wheels on custom build", caption: "US Mags Wheels" },
    { url: "https://agenticflows.co/api/uploads/627421db-6de2-4153-b9e1-f4eba44c183a/gallery-f250-vision.jpg", alt: "2025 Ford F-250 with Vision wheels and 33\" off-road tires", caption: "Ford F-250 - Vision Wheels" },
    { url: "https://agenticflows.co/api/uploads/906a6582-e0eb-4c2c-8ce1-6151b18f8d78/gallery-tahoe-24.jpg", alt: "Tahoe on 24\" wheels", caption: "Tahoe - 24\" Wheels" },
    { url: "https://agenticflows.co/api/uploads/2892573a-c7ca-4d49-99cf-eb581f8483c2/gallery-lexus-ferrada.jpg", alt: "Red Lexus with 20\" staggered Ferrada wheels", caption: "Lexus - Ferrada Wheels" },
    { url: "https://agenticflows.co/api/uploads/dc7d94b8-4496-44de-83d3-fee3d05f00d3/gallery-tundra-lift.jpg", alt: "Toyota Tundra with 6\" lift kit", caption: "Tundra - 6\" Lift Kit" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
