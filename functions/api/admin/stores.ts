export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const stores = await env.DB.prepare(
      `SELECT stores.id, stores.name, stores.slug, stores.whatsapp,
              stores.created_at, users.email, users.id as user_id
         FROM stores LEFT JOIN users ON users.id = stores.user_id
        ORDER BY stores.created_at DESC`
    ).all();
    
    return Response.json({ stores: stores.results || [] });
  } catch (e: any) {
    return Response.json({ stores: [], error: e.message }, { status: 200 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as any;
    
    if (body.action === "record-payment") {
      const { storeId, plan, amount, note } = body;
      const id = crypto.randomUUID();
      const paidAt = Date.now();
      const paidUntil = plan === "lifetime" ? null : Date.now() + 30 * 24 * 60 * 60 * 1000;

      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO payments (id, store_id, amount, plan, note, paid_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(id, storeId, amount, plan, note || "", paidAt),
        env.DB.prepare(
          "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?"
        ).bind(plan, paidUntil, storeId)
      ]);
      
      return Response.json({ ok: true });
    }

    if (body.action === "reset-password") {
      const { storeId, newPassword } = body;
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newPassword));
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const store = await env.DB.prepare("SELECT user_id FROM stores WHERE id = ?").bind(storeId).first();
      if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

      await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(hash, store.user_id).run();
      return Response.json({ ok: true });
    }

    if (body.action === "delete-store") {
      const { storeId } = body;
      await env.DB.batch([
        env.DB.prepare("DELETE FROM products WHERE store_id = ?").bind(storeId),
        env.DB.prepare("DELETE FROM payments WHERE store_id = ?").bind(storeId),
        env.DB.prepare("DELETE FROM store_visits WHERE store_id = ?").bind(storeId),
        env.DB.prepare("DELETE FROM stores WHERE id = ?").bind(storeId)
      ]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
