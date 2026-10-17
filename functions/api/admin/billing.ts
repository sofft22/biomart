export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const rows = await env.DB.prepare(
      `SELECT stores.id as storeId, stores.name as storeName,
              stores.plan, stores.paid_until, stores.subscription_status,
              users.email
         FROM stores JOIN users ON users.id = stores.user_id
        WHERE stores.plan != 'free'
        ORDER BY stores.paid_until DESC`
    ).all();
    return Response.json({ rows: rows.results || [] });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};