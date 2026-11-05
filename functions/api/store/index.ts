export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "You need to log in." }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Session expired." }, { status: 401 });

    // 🟢 FETCH EVERYTHING. No hardcoded columns.
    const store = await env.DB.prepare(
      "SELECT * FROM stores WHERE user_id = ?"
    ).bind(session.user_id).first<any>();

    return Response.json({ store });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "You need to log in." }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Session expired." }, { status: 401 });

    const store = await env.DB.prepare("SELECT id FROM stores WHERE user_id = ?")
      .bind(session.user_id).first<{ id: string }>();
      
    if (!store) return Response.json({ error: "Store not found." }, { status: 404 });

    const body = await request.json() as any;
    const updates: string[] = [];
    const values: any[] = [];

    // 🟢 SAVE EVERYTHING. If it's in the payload, it goes to the database.
    for (const key of Object.keys(body)) {
      if (key === "id" || key === "user_id" || key === "slug" || key === "created_at") continue;
      
      let value = body[key];
      if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value); // Handle arrays like categories
      }
      
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (updates.length === 0) return Response.json({ ok: true });

    values.push(store.id);

    await env.DB.prepare(`UPDATE stores SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: "Database error: " + e.message }, { status: 500 });
  }
};
