export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const rows = await env.DB.prepare(
      `SELECT stores.id as storeId, stores.name as storeName,
              stores.plan, stores.paid_until, stores.subscription_status,
              users.email
         FROM stores LEFT JOIN users ON users.id = stores.user_id
        WHERE stores.plan != 'free'
        ORDER BY stores.paid_until DESC`
    ).all();
    
    return Response.json({ rows: rows.results || [] });
  } catch (e) {
    // If the DB errors out, return an empty array so the React app doesn't crash
    return Response.json({ rows: [], error: String(e) }, { status: 200 }); 
  }
};
