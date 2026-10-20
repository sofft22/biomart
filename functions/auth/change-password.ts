export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    
    // 1. Get cookie
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    // 2. Check session
    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first();
    
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    // 3. Get body
    const body: any = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    // 4. Verify current password
    const user: any = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?")
      .bind(session.user_id).first();
      
    const currentHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(currentPassword));
    const currentHash = Array.from(new Uint8Array(currentHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (currentHash !== user?.password_hash) {
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    // 5. Save new password
    const newHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(newPassword));
    const newHash = Array.from(new Uint8Array(newHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(newHash, session.user_id)
      .run();

    return Response.json({ ok: true });
    
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
