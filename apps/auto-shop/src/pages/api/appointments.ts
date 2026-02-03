import type { APIRoute } from "astro";

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

    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save as lead with appointment details
    const message = `Appointment Request:\nService: ${service}\nPreferred: ${preferredDate} at ${preferredTime}`;
    
    const result = await db.prepare(`
      INSERT INTO leads (name, phone, email, vehicle, service, message, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      name,
      phone,
      null,
      vehicle || null,
      service,
      message,
      "appointment_scheduler",
      new Date().toISOString()
    ).first();

    // TODO: Add calendar integration here (Google Calendar, Cal.com, etc.)
    // await createCalendarEvent({ service, date: preferredDate, time: preferredTime, name, phone, vehicle });

    return new Response(JSON.stringify({ 
      success: true,
      appointment: {
        id: result?.id,
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
