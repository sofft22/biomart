export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params, request }) => {
  try {
    const slug = params.slug as string;
    
    // 1. Create a clean cache key (Strip cookies/auth so it actually caches)
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      // Add a header to prove it's hitting the cache when you check DevTools
      const cachedResponse = new Response(response.body, response);
      cachedResponse.headers.set("X-Cache-Status", "HIT");
      return cachedResponse;
    }

    // 2. Query the DB
    const store = await env.DB.prepare(
      "SELECT * FROM stores WHERE slug = ?"
    ).bind(slug).first<any>();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    if (!store.categories) store.categories = "";

    const { results } = await env.DB.prepare(
      "SELECT id, name, price, compare_at_price, description, category, in_stock, images, variants, created_at FROM products WHERE store_id = ? ORDER BY created_at DESC"
    ).bind(store.id).all();

    const data = {
      store,
      products: (results || []).map((p: any) => {
        let parsedImages = [];
        try { parsedImages = JSON.parse(p.images || "[]"); } catch { parsedImages = []; }
        return {
          id: p.id, name: p.name, price: p.price,
          compare_at_price: p.compare_at_price ?? null,
          description: p.description || "", category: p.category || "",
          category_id: p.category || "", inStock: !!p.in_stock,
          in_stock: !!p.in_stock, images: parsedImages,
          image_url: parsedImages[0] ?? null,
          image_urls: parsedImages.slice(1),
          variants: p.variants ? JSON.parse(p.variants) : null,
          created_at: p.created_at, views: 0
        };
      })
    };

    // 3. Save to Cache
    response = Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400", 
        "X-Cache-Status": "MISS"
      }
    });
    
    // Fire and forget cache put
    const ctx = { waitUntil: (p: Promise<any>) => p }; // Fallback if ctx isn't passed
    cache.put(cacheKey, response.clone()).catch(() => {});

    return response;
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
