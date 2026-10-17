export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname; // /api/track/store/:slug OR /api/track/product/:id

    const id = crypto.randomUUID();
    const ts = Date.now();

    // /api/track/store/:slug
    if (path.startsWith("/api/track/store/")) {
      const slug = params.slug as string;
      if (!slug) {
        return Response.json({ error: "Missing slug" }, { status: 400 });
      }

      const store = await env.DB.prepare(
        "SELECT id FROM stores WHERE slug = ?"
      ).bind(slug).first<{ id: string }>();

      if (!store) {
        return Response.json({ error: "Store not found" }, { status: 404 });
      }

      await env.DB.prepare(
        "INSERT INTO store_visits (id, store_id, ts) VALUES (?, ?, ?)"
      ).bind(id, store.id, ts).run();

      return Response.json({ ok: true });
    }

    // /api/track/product/:id
    if (path.startsWith("/api/track/product/")) {
      const productId = params.id as string;
      if (!productId) {
        return Response.json({ error: "Missing product id" }, { status: 400 });
      }

      const product = await env.DB.prepare(
        "SELECT id, store_id FROM products WHERE id = ?"
      ).bind(productId).first<{ id: string; store_id: string }>();

      if (!product) {
        return Response.json({ error: "Product not found" }, { status: 404 });
      }

      await env.DB.prepare(
        "INSERT INTO product_views (id, product_id, store_id, ts) VALUES (?, ?, ?, ?)"
      ).bind(id, product.id, product.store_id, ts).run();

      return Response.json({ ok: true });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    return Response.json(
      { error: "Track error: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
};