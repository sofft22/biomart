import { purgeStoreCache } from "../../utils/purge";

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    // ... (session checks)
    const store = await env.DB.prepare("SELECT id, slug FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string; slug: string }>();
    if (!store) return Response.json({ error: "No store" }, { status: 404 });

    const id = params.id as string;
    const body = await request.json() as any;
    // ... (other updates logic)

    const updates: string[] = [];
    const values: any[] = [];

    // ... (all other if statements)

    // 🟢 FIX: Wrap the flat array in the { suggested: [] } object
    if ("variants" in body) {
      updates.push("variants = ?");
      if (Array.isArray(body.variants) && body.variants.length > 0) {
        values.push(JSON.stringify({ suggested: body.variants }));
      } else {
        values.push(null);
      }
    }

    if (updates.length === 0) return Response.json({ ok: true });
    values.push(id, store.id);

    await env.DB.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ? AND store_id = ?`)
      .bind(...values).run();

    if (store.slug) await purgeStoreCache(store.slug, env, request.url);
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
