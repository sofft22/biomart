export const onRequestPost: PagesFunction<{ DB: D1Database }> = async ({ env, request, params }) => {
  try {
    const id = params.id as string;
    const body = await request.json() as any;
    
    const { planId, amount, note } = body;
    if (!planId) return Response.json({ error: "Missing plan ID" }, { status: 400 });

    const isQuarterly = planId.endsWith("_quarterly");
    const basePlan = isQuarterly ? planId.replace("_quarterly", "") : planId;
    
    const paymentId = crypto.randomUUID();
    const paidAt = Date.now();
    const daysToAdd = isQuarterly ? 90 : 30;
    
    // 🟢 Sets new expiry based on today + 30/90 days
    const paidUntil = basePlan === "free" ? null : Date.now() + daysToAdd * 24 * 60 * 60 * 1000;

    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO payments (id, store_id, amount, plan, note, paid_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(paymentId, id, Number(amount), basePlan, note || "Manual upgrade", paidAt),
      
      env.DB.prepare(
        "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?"
      ).bind(basePlan, paidUntil, id)
    ]);

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
