import type { APIRoute } from "astro";
import { createContentClient, createLead } from "@/lib/content";

interface AppointmentBody {
  service: string;
  preferredDate: string;
  preferredTime: string;
  name: string;
  phone: string;
  vehicle?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as AppointmentBody;
    const { service, preferredDate, preferredTime, name, phone, vehicle } = body;

    if (!name || !phone || !service) {
      return new Response(JSON.stringify({ error: "Name, phone, and service are required" }), {
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

    // Create lead with appointment details
    const message = `Appointment Request:\nService: ${service}\nPreferred: ${preferredDate} at ${preferredTime}`;
    
    const lead = await createLead(client, {
      name,
      phone,
      vehicle: vehicleObj,
      service,
      message,
      source: 'website',
    });

    // TODO: Add calendar integration here (Google Calendar, Cal.com, etc.)
    // await createCalendarEvent({ service, date: preferredDate, time: preferredTime, name, phone, vehicle });

    return new Response(JSON.stringify({ 
      success: true,
      appointment: {
        id: lead.id,
        service,
        preferredDate,
        preferredTime,
        name,
        phone,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Appointment error:", err);
    return new Response(JSON.stringify({ error: "Failed to book appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
