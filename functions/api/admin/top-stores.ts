export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const data = await env.DB.prepare(
      `SELECT stores.id, stores.name, stores.slug, stores.plan,
              COUNT(store_visits.id) as visits
         FROM stores
         LEFT JOIN store_visits ON store_visits.store_id = stores.id
        GROUP BY stores.id
        HAVING visits > 0
        ORDER BY visits DESC
        LIMIT 5`
    ).all();

    const stores = (data.results || []).map((r: any) => ({
      id: r.id,
      name: r.name || "Untitled store",
      slug: r.slug || "",
      plan: r.plan || "free",
      visits: r.visits || 0,
    }));

    return Response.json({ stores });
  } catch (e: any) {
    // Return empty data instead of crashing the whole frontend
    return Response.json({ stores: [] });
  }
};
