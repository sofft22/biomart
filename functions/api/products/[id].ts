export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
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

    const id = params.id as string;
    const body = await request.json() as any;

    // Normalize stock
    const inStock = body.inStock ?? body.in_stock ?? true;

    // Normalize images
    let images: string[] = [];
    if (Array.isArray(body.images)) images = body.images;
    else if (body.image_url) images = [body.image_url, ...(body.image_urls ?? [])];
    
    // Normalize variants
    const variants = body.variants ?? null;

    // Build the update dynamically so we don't crash on missing fields
    const updates: string[] = [];
    const values: any[] = [];

    if ("name" in body) { updates.push("name = ?"); values.push(body.name || ""); }
    if ("price" in body) { updates.push("price = ?"); values.push(body.price || 0); }
    if ("compare_at_price" in body) { updates.push("compare_at_price = ?"); values.push(body.compare_at_price ?? null); }
    if ("description" in body) { updates.push("description = ?"); values.push(body.description || ""); }
    if ("category_id" in body || "category" in body) { 
      updates.push("category = ?"); 
      values.push(body.category_id || body.category || ""); 
    }
    if ("in_stock" in body || "inStock" in body) { updates.push("in_stock = ?"); values.push(inStock === false ? 0 : 1); }
    if (images.length > 0 || "image_url" in body) { updates.push("images = ?"); values.push(JSON.stringify(images)); }
    if ("variants" in body) { updates.push("variants = ?"); values.push(variants ? JSON.stringify(variants) : null); }

    if (updates.length === 0) return Response.json({ ok: true });

    values.push(id);
    values.push(store.id);

    await env.DB.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ? AND store_id = ?`)
      .bind(...values)
      .run();

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

    const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    await env.DB.prepare("DELETE FROM products WHERE id = ? AND store_id = ?")
      .bind(params.id as string, store.id)
      .run();

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
