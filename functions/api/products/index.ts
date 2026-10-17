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
      .bind(session.user_id)
      .first<{ id: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const { results } = await env.DB.prepare(
      "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC"
    ).bind(store.id).all();

    return Response.json(
      results.map((p: any) => {
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
      })
    );
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
