export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const stores = await env.DB.prepare(
      "SELECT id, plan FROM stores"
    ).all<{ id: string; plan: string }>();

    const users = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).first<{ count: number }>();

    const planCounts: Record<string, number> = {
      free: 0, starter: 0, pro: 0, lifetime: 0,
    };
    for (const s of stores.results || []) {
      const p = s.plan || "free";
      planCounts[p] = (planCounts[p] || 0) + 1;
    }

    const prices: Record<string, number> = {
      free: 0, starter: 2000, pro: 4000, lifetime: 40000,
    };
    const mrr = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + (prices[plan] || 0) * count,
      0
    );

    const recent = await env.DB.prepare(
      `SELECT stores.id as storeId, stores.name as storeName,
              stores.plan as plan, stores.created_at as createdAt,
              users.email as email
         FROM stores JOIN users ON users.id = stores.user_id
        ORDER BY stores.created_at DESC LIMIT 8`
    ).all();

    return Response.json({
      totals: {
        stores: stores.results?.length || 0,
        users: users?.count || 0,
        activeStores: stores.results?.length || 0,
        mrr,
      },
      planCounts,
      recentSignups: recent.results || [],
      recentPayments: [],
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
};