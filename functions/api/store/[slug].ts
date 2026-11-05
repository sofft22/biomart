import { purgeStoreCache } from "../../utils/purge"; // Optional, if you want to purge here too

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params, request }) => {
  try {
    const slug = params.slug as string;
    
    // 🟢 1. Check Cloudflare Cache First
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let response = await cache.match(cacheKey);

    if (response) {
      return response; // 🟢 0 ROWS READ! Served instantly from cache.
    }

    // 2. If not in cache, query the database
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

    // 🟢 3. Save to Cache for 24 hours (86400 seconds)
    response = Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400", // Cache for 1 day
      }
    });
    
    // Fire and forget cache put
    cache.put(cacheKey, response.clone()).catch(() => {});

    return response;
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
