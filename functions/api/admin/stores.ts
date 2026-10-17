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

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as any;
    const { action } = body;

    // 1. RECORD PAYMENT
    if (action === "record-payment") {
      const { storeId, plan, amount, note } = body;
      const id = crypto.randomUUID();
      const paidAt = Date.now();
      
      await env.DB.prepare(
        "INSERT INTO payments (id, store_id, amount, plan, note, paid_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, storeId, amount, plan, note, paidAt).run();

      const paidUntil = plan === "lifetime" ? null : Date.now() + 30 * 24 * 60 * 60 * 1000;
      
      await env.DB.prepare(
        "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?"
      ).bind(plan, paidUntil, storeId).run();

      return Response.json({ ok: true });
    }

    // 2. DELETE STORE
    if (action === "delete-store") {
      const { storeId } = body;
      const store = await env.DB.prepare("SELECT user_id FROM stores WHERE id = ?").bind(storeId).first<any>();
      
      if (store) {
        await env.DB.prepare("DELETE FROM products WHERE store_id = ?").bind(storeId).run();
        await env.DB.prepare("DELETE FROM payments WHERE store_id = ?").bind(storeId).run();
        await env.DB.prepare("DELETE FROM store_visits WHERE store_id = ?").bind(storeId).run();
        await env.DB.prepare("DELETE FROM stores WHERE id = ?").bind(storeId).run();
        if (store.user_id) {
          await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(store.user_id).run();
        }
      }
      return Response.json({ ok: true });
    }

    // 3. CHANGE PLAN (Direct upgrade without payment record)
    if (action === "change-plan") {
      const { storeId, plan } = body;
      const paidUntil = plan === "lifetime" ? null : Date.now() + 30 * 24 * 60 * 60 * 1000;
      await env.DB.prepare(
        "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?"
      ).bind(plan, paidUntil, storeId).run();
      return Response.json({ ok: true });
    }

    // 4. RESET PASSWORD
    if (action === "reset-password") {
      const { storeId, newPassword } = body;
      const store = await env.DB.prepare("SELECT user_id FROM stores WHERE id = ?").bind(storeId).first<any>();
      
      if (store && store.user_id) {
        // Hash the new password
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newPassword));
        const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        await env.DB.prepare(
          "UPDATE users SET password_hash = ? WHERE id = ?"
        ).bind(hash, store.user_id).run();
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
