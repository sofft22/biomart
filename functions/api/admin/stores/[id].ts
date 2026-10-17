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

    const visitCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM store_visits WHERE store_id = ?"
    ).bind(id).first<{ count: number }>();

    return Response.json({
      id: store.id,
      name: store.name || "Untitled store",
      slug: store.slug || "",
      email: store.email || "demo@biomart.local",
      whatsapp: store.whatsapp || "",
      instagram: store.instagram || "",
      tiktok: store.tiktok || "",
      address: store.address || "",
      tagline: store.tagline || "",
      bio: store.bio || "",
      cover_url: store.cover_url || "",
      plan: store.plan || "free",
      created_at: store.created_at || Date.now(),
      productCount: productCount?.count || 0,
      visitCount: visitCount?.count || 0,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
