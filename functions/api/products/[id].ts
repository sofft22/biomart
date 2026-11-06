import { purgeStoreCache } from "../../utils/purge";

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    // 🟢 FIX: Ensure session is fetched
    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT id, slug FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string; slug: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const id = params.id as string;
    const body = await request.json() as any;

    const inStock = body.inStock ?? body.in_stock ?? true;
    let images: string[] = [];
    if (Array.isArray(body.images)) images = body.images;
    else if (body.image_url) images = [body.image_url, ...(body.image_urls ?? [])];
    
    const updates: string[] = [];
    const values: any[] = [];

    if ("name" in body) { updates.push("name = ?"); values.push(body.name || ""); }
    if ("price" in body) { updates.push("price = ?"); values.push(body.price || 0); }
    if ("compare_at_price" in body) { updates.push("compare_at_price = ?"); values.push(body.compare_at_price ?? null); }
    if ("description" in body) { updates.push("description = ?"); values.push(body.description || ""); }
    
    if ("category_id" in body || "category" in body) { 
      const cat = body.category_id || body.category || ""; 
      updates.push("category = ?"); values.push(cat); 
      try { updates.push("category_id = ?"); values.push(cat); } catch {} 
    }
    
    if ("in_stock" in body || "inStock" in body) { updates.push("in_stock = ?"); values.push(inStock === false ? 0 : 1); }
    if (images.length > 0 || "image_url" in body) { updates.push("images = ?"); values.push(JSON.stringify(images)); }
    
    // 🟢 FIX: Handle variants correctly
    if ("variants" in body) {
      updates.push("variants = ?");
      if (Array.isArray(body.variants) && body.variants.length > 0) {
        values.push(JSON.stringify({ suggested: body.variants }));
      } else {
        values.push(null);
      }
    }

    if (updates.length === 0) return Response.json({ ok: true });

    values.push(id);
    values.push(store.id);

    await env.DB.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ? AND store_id = ?`)
      .bind(...values)
      .run();

    // 🟢 PURGE CACHE AFTER UPDATING
    if (store.slug) {
      await purgeStoreCache(store.slug, env, request.url);
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("Update product error:", e);
    return Response.json({ error: "Database error: " + e.message }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT id, slug FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string; slug: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    await env.DB.prepare("DELETE FROM products WHERE id = ? AND store_id = ?")
      .bind(params.id as string, store.id)
      .run();

    // 🟢 PURGE CACHE AFTER DELETING
    if (store.slug) {
      await purgeStoreCache(store.slug, env, request.url);
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
