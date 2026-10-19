export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params }) => {
  try {
    const id = params.id as string;

    const store = await env.DB.prepare(
      `SELECT stores.*, users.email
         FROM stores LEFT JOIN users ON users.id = stores.user_id
        WHERE stores.id = ?`
    ).bind(id).first<any>();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    const productCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM products WHERE store_id = ?"
    ).bind(id).first<{ count: number }>();

    // 🟢 FETCH PAYMENTS FOR THIS STORE
    const paymentsRes = await env.DB.prepare(
      "SELECT id, amount, plan, note, paid_at FROM payments WHERE store_id = ? ORDER BY paid_at DESC"
    ).bind(id).all();

    return Response.json({
      id: store.id,
      name: store.name || "Untitled store",
      slug: store.slug || "",
      email: store.email || "",
      whatsapp: store.whatsapp || "",
      instagram: store.instagram || "",
      tiktok: store.tiktok || "",
      address: store.address || "",
      tagline: store.tagline || "",
      bio: store.bio || "",
      cover_url: store.cover_url || "",
      plan: store.plan || "free",
      paid_until: store.paid_until || null,
      created_at: store.created_at || Date.now(),
      productCount: productCount?.count || 0,
      // 🟢 Return payments and total paid
      payments: paymentsRes.results || [],
      totalPaid: (paymentsRes.results || []).reduce((sum: number, p: any) => sum + p.amount, 0),
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

// 🟢 ADDED: POST endpoint to log manual payments
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const id = params.id as string;
    const body = await request.json() as any;
    
    const { amount, plan, note } = body;
    if (!amount || !plan) return Response.json({ error: "Missing amount or plan" }, { status: 400 });

    const paymentId = crypto.randomUUID();
    const paidAt = Date.now();
    const paidUntil = plan === "lifetime" ? null : Date.now() + 30 * 24 * 60 * 60 * 1000;

    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO payments (id, store_id, amount, plan, note, paid_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(paymentId, id, amount, plan, note || "Manual upgrade", paidAt),
      
      env.DB.prepare(
        "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?"
      ).bind(plan, paidUntil, id)
    ]);

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

