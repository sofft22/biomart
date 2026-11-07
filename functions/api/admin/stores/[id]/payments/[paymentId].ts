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

    // 1. Delete the payment
    await env.DB.prepare("DELETE FROM payments WHERE id = ? AND store_id = ?")
      .bind(paymentId, storeId)
      .run();

    // 2. Recalculate the store's plan
    const remainingPayments = await env.DB.prepare(
      "SELECT plan, paid_at FROM payments WHERE store_id = ? ORDER BY paid_at DESC"
    ).bind(storeId).all<{ plan: string, paid_at: number }>();

    if (remainingPayments.results.length === 0) {
      // No payments left -> Downgrade to Free
      await env.DB.prepare("UPDATE stores SET plan = 'free', paid_until = null WHERE id = ?")
        .bind(storeId).run();
    } else {
      // Re-calculate paid_until based on the latest remaining payment
      const latest = remainingPayments.results[0];
      const isQuarterly = latest.plan.includes("quarterly");
      const days = isQuarterly ? 90 : 30;
      const newPaidUntil = latest.paid_at + (days * 24 * 60 * 60 * 1000);
      
      // We also strip the "_quarterly" suffix for the plan name if it exists
      const cleanPlan = latest.plan.replace("_quarterly", "");

      await env.DB.prepare("UPDATE stores SET plan = ?, paid_until = ? WHERE id = ?")
        .bind(cleanPlan, newPaidUntil, storeId).run();
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
