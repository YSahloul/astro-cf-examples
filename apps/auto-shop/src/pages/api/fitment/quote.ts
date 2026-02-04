import type { APIRoute } from "astro";
import { createContentClient, createLead } from "@/lib/content";

interface QuoteBody {
  name: string;
  phone: string;
  email?: string;
  vehicle?: string;
  goal?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as QuoteBody;
    const { name, phone, email, vehicle, goal } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Name and phone are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Payload client with service binding
    const payloadBinding = (locals as any).runtime?.env?.PAYLOAD_CMS;
    const client = createContentClient(payloadBinding);

    // Parse vehicle string if provided
    const vehicleParts = vehicle?.trim().split(' ') || [];
    const vehicleObj = vehicleParts.length >= 2 ? {
      year: parseInt(vehicleParts[0]) || undefined,
      make: vehicleParts[1] || undefined,
      model: vehicleParts.slice(2).join(' ') || undefined,
    } : undefined;

    // Create lead in Payload
    const lead = await createLead(client, {
      name,
      phone,
      email: email || undefined,
      vehicle: vehicleObj,
      service: "Wheel & Tire Fitment",
      message: `Looking for: ${goal || "Not specified"}`,
      source: 'website',
    });

    // Return lead data for BlueBubbles webhook or other integrations
    return new Response(JSON.stringify({ 
      success: true,
      lead: {
        id: lead.id,
        name,
        phone,
        email,
        vehicle,
        goal,
        created_at: lead.createdAt,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Quote submission error:", err);
    return new Response(JSON.stringify({ error: "Failed to submit quote" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
