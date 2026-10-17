export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    // 🟢 Optimization: Only fetch 100 products max to save rows read
    const { results } = await env.DB.prepare(
      "SELECT id, name, price, compare_at_price, description, category, in_stock, images, variants, created_at FROM products WHERE store_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(store.id).all();

    const products = (results || []).map((p: any) => {
      let parsedImages = [];
      try { parsedImages = JSON.parse(p.images || "[]"); } catch {}
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        compare_at_price: p.compare_at_price ?? null,
        description: p.description || "",
        category: p.category || "",
        category_id: p.category || "",
        inStock: !!p.in_stock,
        in_stock: !!p.in_stock,
        images: parsedImages,
        image_url: parsedImages[0] ?? null,
        image_urls: parsedImages.slice(1),
        variants: p.variants ? JSON.parse(p.variants) : null,
        created_at: p.created_at,
        views: 0
      };
    });

    return Response.json(products);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const body = await request.json() as any;
    const id = crypto.randomUUID();
    const images = JSON.stringify(body.images || [body.image_url].filter(Boolean));

    await env.DB.prepare(
      `INSERT INTO products (id, store_id, name, price, compare_at_price, description, category, in_stock, images, variants, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      store.id,
      body.name || "",
      body.price || 0,
      body.compare_at_price ?? null,
      body.description || "",
      body.category || "",
      body.inStock === false ? 0 : 1,
      images,
      body.variants ? JSON.stringify(body.variants) : null,
      Date.now()
    ).run();

    return Response.json({ id, ...body, views: 0 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
