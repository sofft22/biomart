export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    // 1. Get all stores (we only need the plan to calculate MRR and counts)
    const storesRes = await env.DB.prepare("SELECT plan FROM stores").all<{ plan: string }>();
    const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, lifetime: 0 };
    let totalStores = 0;
    
    for (const s of storesRes.results || []) {
      const p = s.plan || "free";
      planCounts[p] = (planCounts[p] || 0) + 1;
      totalStores++;
    }
    const payingStores = planCounts.starter + planCounts.pro + planCounts.lifetime;

    // 2. Calculate MRR
    const prices: Record<string, number> = { free: 0, starter: 2500, pro: 6000, lifetime: 0 };
    const mrr = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + (prices[plan] || 0) * count,
      0
    );

    // 3. Get Total Revenue
    const revenueRes = await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments").first<{ total: number }>();
    const totalRevenue = revenueRes?.total || 0;

    // 4. Get total product count
    const productsRes = await env.DB.prepare("SELECT COUNT(*) as count FROM products").first<{ count: number }>();
    const totalProducts = productsRes?.count || 0;

    // 5. Build the 7-Day Revenue Chart Data
    const chart = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now - i * 86400000);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + 86400000;
      
      // Sum payments for this specific day
      const dayRev = await env.DB.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE paid_at >= ? AND paid_at < ?"
      ).bind(start.getTime(), end).first<{ total: number }>();

      chart.push({
        label: start.toLocaleDateString("en-NG", { weekday: "short" }),
        amount: dayRev?.total || 0,
        date: start.toISOString().slice(0, 10)
      });
    }

    // 6. Get Top 3 Paying Stores
    const topStoresRes = await env.DB.prepare(
      `SELECT stores.name, stores.slug, SUM(payments.amount) as totalPaid
       FROM payments 
       JOIN stores ON stores.id = payments.store_id
       GROUP BY stores.id
       ORDER BY totalPaid DESC
       LIMIT 3`
    ).all();

    const topStores = (topStoresRes.results || []).map((s: any) => ({
      name: s.name,
      slug: s.slug,
      totalPaid: s.totalPaid
    }));

    return Response.json({
      mrr,
      totalRevenue,
      totalStores,
      payingStores,
      totalProducts,
      chart,
      topStores
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
