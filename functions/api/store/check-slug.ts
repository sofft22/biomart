export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.toLowerCase().trim() || "";

    if (!slug) return Response.json({ available: false });

    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    // 1. Get the current user's store ID so we can ignore their own slug
    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const currentStore = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string }>();

    // 2. Check if the slug exists on ANOTHER store
    const existing = await env.DB.prepare(
      "SELECT id FROM stores WHERE slug = ? AND id != ?"
    ).bind(slug, currentStore?.id || "").first();

    return Response.json({ available: !existing });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
