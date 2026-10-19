import { getLimit } from "../../lib/plans";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT id, plan FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string; plan: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const body = await request.json() as any;
    
    // 🟢 CHECK PLAN LIMITS
    const plan = store.plan ?? "free";
    const limit = getLimit(plan);
    
    const images = JSON.stringify(body.images || [body.image_url].filter(Boolean));
    const imageCount = (body.images || [body.image_url].filter(Boolean)).length;
    
    if (imageCount > limit.photos) {
      return Response.json({ error: `Your plan allows ${limit.photos} photos per product. Upgrade for more.` }, { status: 403 });
    }

    const id = crypto.randomUUID();

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
