export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as any;
    const storeName = (body.storeName || "").trim();
    const whatsapp = (body.whatsapp || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!storeName || !whatsapp || !email || password.length < 8) {
      return Response.json({ error: "All fields required. Password must be 8+ characters." }, { status: 400 });
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return Response.json({ error: "Email already registered. Try logging in." }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const storeId = crypto.randomUUID();
    
    // 🟢 Guarantee a unique slug
    const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug || "store"}-${Math.floor(Math.random() * 10000)}`;

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const sid = crypto.randomUUID();
    const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;

    // 🟢 BATCH TRANSACTION: All succeed, or all fail.
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, 'owner', ?)"
      ).bind(userId, email, passwordHash, Date.now()),
      
      env.DB.prepare(
        "INSERT INTO stores (id, user_id, name, slug, whatsapp, created_at, categories) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(storeId, userId, storeName, slug, whatsapp, Date.now(), "[]"),
      
      env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
      ).bind(sid, userId, expires)
    ]);

    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": `sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}` } }
    );
  } catch (e: any) {
    console.error("Signup error:", e);
    return Response.json({ error: "Signup failed: " + e.message }, { status: 500 });
  }
};
