import { getLimit } from "../../lib/plans";
import { purgeStoreCache } from "../../utils/purge";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    // ... (session checks)
    const store = await env.DB.prepare("SELECT id, plan, slug FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string; plan: string; slug: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const body = await request.json() as any;
    // ... (plan limits check)

    // 🟢 FIX: Wrap the flat array in the { suggested: [] } object
    let variantsJson = null;
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      variantsJson = JSON.stringify({ suggested: body.variants });
    }

    await env.DB.prepare(
      `INSERT INTO products (id, store_id, name, price, compare_at_price, description, category, in_stock, images, variants, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      store.id,
      body.name || "",
      body.price || 0,
      body.compare_at_price ?? null,
      body.description || "",
      body.category || "",
      body.inStock === false ? 0 : 1,
      JSON.stringify(body.images || [body.image_url].filter(Boolean)),
      variantsJson, // 🟢 Save the wrapped JSON
      Date.now()
    ).run();

    if (store.slug) await purgeStoreCache(store.slug, env, request.url);
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
