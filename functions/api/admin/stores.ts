export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const rows = await env.DB.prepare(
      `SELECT stores.id, stores.name, stores.slug, stores.whatsapp,
              stores.plan, stores.created_at,
              users.email, users.id as user_id
         FROM stores JOIN users ON users.id = stores.user_id
        ORDER BY stores.created_at DESC`
    ).all();
    return Response.json({ stores: rows.results || [] });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};