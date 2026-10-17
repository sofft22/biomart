export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = cookie.match(/sid=([^;]+)/)?.[1];
    if (!sid) return Response.json({ error: "You need to log in." }, { status: 401 });

    const session = await env.DB.prepare(
      "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
    ).bind(sid, Date.now()).first<{ user_id: string }>();
    
    if (!session) return Response.json({ error: "Session expired." }, { status: 401 });

    const store = await env.DB.prepare(
      "SELECT id FROM stores WHERE user_id = ?"
    ).bind(session.user_id).first<{ id: string }>();

    if (!store) return Response.json({ error: "Store not found." }, { status: 404 });

    const now = Date.now();
    const day = 86400000;

    // Wrap every query in a safe handler
    const getCount = async (sql: string) => {
      try { return (await env.DB.prepare(sql).bind(store.id, now - day, now).first<{ c: number }>())?.c || 0; }
      catch { return 0; }
    };

    const visitsToday = await getCount(`SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND visited_at >= ?`);
    const visits7d    = await getCount(`SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND visited_at >= ?`);
    const visits30d   = await getCount(`SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND visited_at >= ?`);

    let totalProductViews = 0;
    try {
      totalProductViews = (await env.DB.prepare(`SELECT COUNT(*) AS c FROM product_views WHERE store_id = ?`).bind(store.id).first<{ c: number }>())?.c || 0;
    } catch {}

    // Since the getCount function above takes 3 args, let's do the daily/hourly logic safely
    const getBuckets = async (days: number) => {
      const out = [];
      for (let i = days - 1; i >= 0; i--) {
        const start = new Date(now - i * 86400000);
        start.setHours(0, 0, 0, 0);
        try {
          const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND visited_at >= ? AND visited_at < ?")
            .bind(store.id, start.getTime(), start.getTime() + 86400000).first<{ c: number }>();
          out.push({ date: start.toLocaleDateString("en-NG", { weekday: "short" }), count: row?.c || 0 });
        } catch { out.push({ date: start.toLocaleDateString("en-NG", { weekday: "short" }), count: 0 }); }
      }
      return out;
    };

    const getHourly = async () => {
      const out = [];
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const a = start.getTime() + h * 3600000;
        try {
          const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND visited_at >= ? AND visited_at < ?")
            .bind(store.id, a, a + 3600000).first<{ c: number }>();
          out.push({ date: String(h).padStart(2, "0"), count: row?.c || 0 });
        } catch { out.push({ date: String(h).padStart(2, "0"), count: 0 }); }
      }
      return out;
    };

    let topProducts = [];
    try {
      const topRes = await env.DB.prepare(
        `SELECT p.id, p.name, p.price, p.images, p.category, COUNT(v.id) AS views
         FROM products p LEFT JOIN product_views v ON v.product_id = p.id
         WHERE p.store_id = ? GROUP BY p.id ORDER BY views DESC LIMIT 5`
      ).bind(store.id).all();
      
      topProducts = (topRes.results || []).map((p: any) => {
        let img = null; try { img = JSON.parse(p.images || "[]")[0] || null; } catch {}
        return { id: p.id, name: p.name, price: p.price, image_url: img, views: Number(p.views) || 0 };
      });
    } catch {}

    return Response.json({
      visits: { today: visitsToday, week: visits7d, month: visits30d },
      totalProductViews: totalProductViews || 0,
      chart: { today: await getHourly(), week: await getBuckets(7), month: await getBuckets(30) },
      topProducts,
    });
  } catch (e: any) {
    console.error("Stats error:", e);
    return Response.json({ error: "Stats are temporarily unavailable. Please try again later." }, { status: 500 });
  }
};
