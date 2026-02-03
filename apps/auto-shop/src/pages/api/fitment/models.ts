import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const make = url.searchParams.get("make");

  if (!make) {
    return new Response(JSON.stringify({ error: "make is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const fitmentDb = (locals as any).runtime?.env?.FITMENT_DB;
    
    if (fitmentDb) {
      // Query the database for models with build counts
      const result = await fitmentDb.prepare(`
        SELECT DISTINCT v.model, COUNT(b.id) as build_count
        FROM vehicles v
        LEFT JOIN builds b ON b.vehicle_id = v.id
        WHERE v.make = ?
        GROUP BY v.model
        ORDER BY build_count DESC
      `).bind(make).all();

      const models = result.results?.map((r: any) => r.model) || [];
      
      if (models.length > 0) {
        return new Response(JSON.stringify({ models }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fallback to common models
    const commonModels: Record<string, string[]> = {
      "Chevrolet": ["Silverado 1500", "Silverado 2500", "Silverado 3500", "Colorado", "Tahoe", "Suburban"],
      "Ford": ["F-150", "F-250", "F-350", "Ranger", "Bronco", "Expedition"],
      "GMC": ["Sierra 1500", "Sierra 2500", "Sierra 3500", "Canyon", "Yukon"],
      "Ram": ["1500", "2500", "3500"],
      "Toyota": ["Tacoma", "Tundra", "4Runner", "Sequoia"],
      "Dodge": ["Ram 1500", "Ram 2500", "Ram 3500", "Durango"],
      "Nissan": ["Titan", "Titan XD", "Frontier"],
      "Jeep": ["Wrangler", "Gladiator", "Grand Cherokee", "Cherokee"],
    };

    return new Response(JSON.stringify({ models: commonModels[make] || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fitment models error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch models" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
