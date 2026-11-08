import { purgeStoreCache } from "../../../utils/purge";

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
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

    const id = params.id as string;
    const body = await request.json() as any;
    
    // 🟢 Save the variants exactly as they come in
    let variantsJson = null;
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      variantsJson = JSON.stringify(body.variants);
    }

    await env.DB.prepare("UPDATE products SET variants = ? WHERE id = ? AND store_id = ?")
      .bind(variantsJson, id, store.id)
      .run();

    if (store.slug) {
      await purgeStoreCache(store.slug, env, request.url);
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
