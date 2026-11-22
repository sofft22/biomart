// functions/api/me.ts

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];

    const noCacheHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    if (!sid) return Response.json({ user: null, store: null, products: [] }, { headers: noCacheHeaders });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ user: null, store: null, products: [] }, { headers: noCacheHeaders });

    const user = await env.DB.prepare(
      "SELECT id, email, role FROM users WHERE id = ?"
    ).bind(session.user_id).first<any>();

    let store = user ? await env.DB.prepare(
      "SELECT * FROM stores WHERE user_id = ?"
    ).bind(user.id).first<any>() : null;

    // 🟢 AUTOMATIC EXPIRATION CHECK
    if (store && store.plan !== "free" && store.paid_until && store.paid_until < Date.now()) {
      try {
        await env.DB.prepare(
          "UPDATE stores SET plan = 'free', paid_until = null WHERE id = ?"
        ).bind(store.id).run();
        
        store.plan = "free";
        store.paid_until = null;
      } catch (e) {
        console.error("Failed to auto-downgrade store", e);
      }
    }

    let products: any[] = [];
    if (store) {
      const { results } = await env.DB.prepare(
        "SELECT id, name, price, compare_at_price, description, category, in_stock, images, variants, created_at FROM products WHERE store_id = ? ORDER BY created_at DESC"
      ).bind(store.id).all();
      
      products = (results || []).map((p: any) => {
        let imgs = [];
        try { imgs = JSON.parse(p.images || "[]"); } catch {}
        return {
          id: p.id, name: p.name, price: p.price,
          compare_at_price: p.compare_at_price, description: p.description,
          category: p.category, category_id: p.category,
          in_stock: !!p.in_stock, inStock: !!p.in_stock,
          images: imgs, image_url: imgs[0] || null, image_urls: imgs.slice(1),
          variants: p.variants ? JSON.parse(p.variants) : null, created_at: p.created_at,
        };
      });
    }

    const planName = store?.plan || "free";
    const limits = {
      free: { products: 5, images: 1, photos: 1, variants: false },
      starter: { products: 15, images: 3, photos: 3, variants: false },
      pro: { products: 100, images: 10, photos: 10, variants: true },
    }[planName] || { products: 5, images: 1, photos: 1, variants: false };

    return Response.json({
      user, store, products,
      limits: { planName, products: limits.products, images: limits.images, photos: limits.photos, variants: limits.variants },
      plans: {
        free: { name: "Free", price: 0, products: 5, images: 1 },
        starter: { name: "Starter", price: 3000, products: 15, images: 3 },
        pro: { name: "Pro", price: 6500, products: 100, images: 10 },
      },
    }, { headers: noCacheHeaders });
  } catch (e: any) {
    return Response.json({ error: "Me error: " + e.message }, { status: 500 });
  }
};

// 🟢 ADDED: This handles the PUT request to save settings and banners
export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];

    if (!sid) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as any;

    // Update the store details
    await env.DB.prepare(
      `UPDATE stores 
       SET name = ?, slug = ?, tagline = ?, hero_title = ?, categories = ?, address = ?, 
           whatsapp = ?, instagram = ?, tiktok = ?, cover_url = ?, extra_banners = ?
       WHERE user_id = ?`
    ).bind(
      body.name || null,
      body.slug || null,
      body.tagline || null,
      body.hero_title || null,
      body.categories || null,
      body.address || null,
      body.whatsapp || null,
      body.instagram || null,
      body.tiktok || null,
      body.cover_url || null,
      body.extra_banners || null, // <--- THIS IS WHAT WAS MISSING
      session.user_id
    ).run();

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
