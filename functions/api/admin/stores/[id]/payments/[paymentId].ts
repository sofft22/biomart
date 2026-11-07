export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "Not logged in" }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });

    const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(session.user_id).first<{ role: string }>();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const storeId = params.id as string;
    const paymentId = params.paymentId as string;

    // 🟢 Just delete the payment. Do NOT touch the store plan.
    await env.DB.prepare("DELETE FROM payments WHERE id = ? AND store_id = ?")
      .bind(paymentId, storeId)
      .run();

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
