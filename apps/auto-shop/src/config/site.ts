/**
 * Static site configuration for Sal's Wheels & Tires
 * 
 * This is the single source of truth for all business info.
 * Each tenant's Astro app has its own config - no CMS needed for this.
 */

export const siteConfig = {
  // Business Info
  name: "Sal's Wheels & Tires",
  tagline: "Your Trusted Source for Wheels, Tires & Suspension",
  description: "Family-owned since 2010, we specialize in custom wheel and tire packages for trucks, Jeeps, and SUVs. Expert fitment advice and professional installation.",
  
  // Contact
  phone: "(713) 555-TIRE",
  email: "info@salswheels.com",
  
  // Location
  address: "4521 Telephone Rd",
  city: "Houston",
  state: "TX",
  zip: "77087",
  
  // Social
  instagram: "https://instagram.com/salswheels",
  facebook: "https://facebook.com/salswheelsandtires",
  
  // External Links
  financingUrl: "https://apply.credova.com/salswheels",
  
  // Hours
  hours: [
    { day: "Monday", open: "08:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
    { day: "Thursday", open: "08:00", close: "18:00", closed: false },
    { day: "Friday", open: "08:00", close: "18:00", closed: false },
    { day: "Saturday", open: "09:00", close: "15:00", closed: false },
    { day: "Sunday", open: "", close: "", closed: true },
  ],
  
  // Services offered
  services: [
    { id: 1, name: "Wheel & Tire Package", description: "Complete wheel and tire packages with mounting, balancing, and installation", price: 0, featured: true },
    { id: 2, name: "Suspension Lift Kit", description: "Leveling kits and full suspension lifts for trucks and Jeeps", price: 0, featured: true },
    { id: 3, name: "Tire Mounting & Balancing", description: "Professional mounting and balancing service", price: 25, featured: false },
    { id: 4, name: "Wheel Alignment", description: "4-wheel alignment to factory specs", price: 89, featured: false },
    { id: 5, name: "TPMS Service", description: "Tire pressure monitoring system programming and service", price: 15, featured: false },
  ],
  
  // Testimonials
  testimonials: [
    { id: 1, name: "Carlos R.", text: "Got my F-150 leveled and put on 35s. Looks amazing and drives great. Sal really knows his stuff!", rating: 5, source: "Google" },
    { id: 2, name: "Mike T.", text: "Best wheel shop in Houston. They helped me find the perfect setup for my Tacoma. Fair prices and great work.", rating: 5, source: "Google" },
    { id: 3, name: "Sarah K.", text: "Very knowledgeable staff. They took the time to explain all my options for my Jeep build.", rating: 5, source: "Yelp" },
    { id: 4, name: "David M.", text: "These guys are the real deal. No BS, just honest advice and quality work. My truck looks incredible.", rating: 5, source: "Facebook" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
