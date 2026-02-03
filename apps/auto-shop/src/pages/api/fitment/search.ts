import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const make = url.searchParams.get("make");
  const model = url.searchParams.get("model");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const rubbing = url.searchParams.get("rubbing");
  const trimming = url.searchParams.get("trimming");

  if (!year || !make || !model) {
    return new Response(JSON.stringify({ error: "year, make, and model are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const fitmentDb = (locals as any).runtime?.env?.FITMENT_DB;
    if (!fitmentDb) {
      return new Response(JSON.stringify({ error: "Fitment database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get vehicle info
    const vehicleResult = await fitmentDb.prepare(`
      SELECT id, make, model, generation, bolt_pattern
      FROM vehicles 
      WHERE make = ? AND model = ?
      LIMIT 1
    `).bind(make, model).first();

    // Build query for fitments
    let query = `
      SELECT 
        b.wheel_name,
        b.wheel_diameter,
        b.wheel_width,
        b.wheel_offset,
        b.wheel_bolt_pattern,
        b.tire_name,
        b.tire_size,
        b.tire_overall_diameter,
        b.suspension_type,
        b.rubbing,
        b.trimming,
        b.stance,
        b.url,
        b.fitment_description,
        b.from_owner_notes,
        b.year,
        b.trim,
        b.drive_type
      FROM builds b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE v.make = ? AND v.model = ?
        AND b.year >= ? - 3 AND b.year <= ? + 1
    `;

    const bindings: any[] = [make, model, parseInt(year), parseInt(year)];

    // Add filters
    if (rubbing === "none") {
      query += ` AND (b.rubbing LIKE '%No rubbing%' OR b.rubbing_level = 0)`;
    }
    if (trimming === "none") {
      query += ` AND (b.trimming LIKE '%No trimming%' OR b.trimming_level = 0)`;
    }

    query += ` ORDER BY 
      CASE WHEN b.rubbing LIKE '%No rubbing%' THEN 0 ELSE 1 END,
      CASE WHEN b.trimming LIKE '%No trimming%' THEN 0 ELSE 1 END,
      b.tire_overall_diameter DESC
      LIMIT ?
    `;
    bindings.push(limit);

    const fitments = await fitmentDb.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify({
      vehicle: vehicleResult ? {
        year: parseInt(year),
        make,
        model,
        generation: vehicleResult.generation,
        boltPattern: vehicleResult.bolt_pattern,
      } : null,
      count: fitments.results?.length || 0,
      fitments: fitments.results || [],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fitment search error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch fitment data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
