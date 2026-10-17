export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const nextWeek = Date.now() + 7 * 86400000;
    const data = await env.DB.prepare(
      `SELECT id, name, slug, plan, paid_until
         FROM stores
        WHERE plan IN ('starter', 'pro')
          AND (paid_until <= ? OR paid_until < ?)
        ORDER BY paid_until ASC`
    ).bind(nextWeek, Date.now()).all();
    
    return Response.json({ stores: data.results || [] });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
