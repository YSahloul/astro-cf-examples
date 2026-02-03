import type { APIRoute } from "astro";

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

    // Save to database using raw D1
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await db.prepare(`
      INSERT INTO leads (name, phone, email, vehicle, service, message, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      name,
      phone,
      email || null,
      vehicle || null,
      "Wheel & Tire Fitment",
      `Looking for: ${goal || "Not specified"}`,
      "fitment_quiz",
      new Date().toISOString()
    ).first();

    // Return lead data for BlueBubbles webhook or other integrations
    return new Response(JSON.stringify({ 
      success: true,
      lead: {
        id: result?.id,
        name,
        phone,
        email,
        vehicle,
        goal,
        created_at: new Date().toISOString(),
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
