export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params }) => {
  try {
    const slug = params.slug as string;
    
    // 1. Get the store
    const store = await env.DB.prepare(
      "SELECT * FROM stores WHERE slug = ?"
    ).bind(slug).first<any>();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Get the products
    const { results } = await env.DB.prepare(
      "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC"
    ).bind(store.id).all();

    // 3. Return everything cleanly mapped
    return Response.json({
      store,
      products: results.map((p: any) => {
        let parsedImages = [];
        try { parsedImages = JSON.parse(p.images || "[]"); } catch { parsedImages = []; }
        
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
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
