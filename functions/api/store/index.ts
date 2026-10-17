export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const store = await env.DB.prepare("SELECT * FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<any>();

    return Response.json({ store });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
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

    const body = await request.json() as any;

    const updates: string[] = [];
    const values: any[] = [];

    // Safely handle each field
    if ("name" in body) { updates.push("name = ?"); values.push(String(body.name || "").trim()); }
    if ("bio" in body) { updates.push("bio = ?"); values.push(body.bio || null); }
    if ("tagline" in body) { updates.push("tagline = ?"); values.push(body.tagline || null); }
    if ("address" in body) { updates.push("address = ?"); values.push(body.address || null); }
    if ("whatsapp" in body) { updates.push("whatsapp = ?"); values.push(String(body.whatsapp || "").trim()); }
    if ("instagram" in body) { updates.push("instagram = ?"); values.push(body.instagram || null); }
    if ("tiktok" in body) { updates.push("tiktok = ?"); values.push(body.tiktok || null); }
    if ("cover_url" in body) { updates.push("cover_url = ?"); values.push(body.cover_url || null); }

    if (updates.length === 0) return Response.json({ ok: true });

    values.push(store.id);

    await env.DB.prepare(`UPDATE stores SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return Response.json({ ok: true });
  } catch (e: any) {
    // If it still fails, this will tell us exactly what column caused it
    return Response.json({ error: "DB Error: " + e.message }, { status: 500 });
  }
};
