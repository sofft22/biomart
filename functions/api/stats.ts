export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const user = await getUser(request, env);
    if (!user) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    const store = await env.DB.prepare(
      "SELECT id FROM stores WHERE user_id = ?"
    ).bind(user.id).first<{ id: string }>();

    if (!store) {
      return Response.json({ error: "No store" }, { status: 404 });
    }

    const now = Date.now();
    const day = 86400000;

    // Store visits
    const visitsToday = await countSince(env.DB, "store_visits", store.id, now - day);
    const visits7d    = await countSince(env.DB, "store_visits", store.id, now - 7 * day);
    const visits30d   = await countSince(env.DB, "store_visits", store.id, now - 30 * day);

    // Total product views
    const totalProductViews = await countSince(env.DB, "product_views", store.id, 0);

    // Chart data — daily for last 7 and 30 days
    const daily7  = await dailyBuckets(env.DB, store.id, 7);
    const daily30 = await dailyBuckets(env.DB, store.id, 30);

    // Today's hourly buckets
    const hourly24 = await hourlyBuckets(env.DB, store.id, now);

    // Top products by total views
    const topRes = await env.DB.prepare(
      `SELECT p.id, p.name, p.price, p.images, p.category,
              COUNT(v.id) AS views
       FROM products p
       LEFT JOIN product_views v ON v.product_id = p.id
       WHERE p.store_id = ?
       GROUP BY p.id
       ORDER BY views DESC, p.created_at DESC
       LIMIT 5`
    ).bind(store.id).all();

    const topProducts = (topRes.results || []).map((p: any) => {
      let img: string | null = null;
      try {
        const imgs = JSON.parse(p.images || "[]");
        img = imgs[0] ?? null;
      } catch { img = null; }
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: img,
        views: Number(p.views) || 0,
      };
    });

    return Response.json({
      visits: { today: visitsToday, week: visits7d, month: visits30d },
      totalProductViews,
      chart: {
        today: hourly24,
        week: daily7,
        month: daily30,
      },
      topProducts,
    });
  } catch (e) {
    return Response.json(
      { error: "Stats error: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
};

async function countSince(
  db: D1Database,
  table: "store_visits" | "product_views",
  storeId: string,
  since: number
): Promise<number> {
  const row = await db.prepare(
    `SELECT COUNT(*) AS c FROM ${table} WHERE store_id = ? AND ts >= ?`
  ).bind(storeId, since).first<{ c: number }>();
  return row?.c ?? 0;
}

async function dailyBuckets(db: D1Database, storeId: string, days: number) {
  const now = Date.now();
  const out: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = now - i * 86400000;
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const startMs = startOfDay.getTime();
    const endMs = startMs + 86400000;

    const row = await db.prepare(
      "SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND ts >= ? AND ts < ?"
    ).bind(storeId, startMs, endMs).first<{ c: number }>();

    const label = startOfDay.toLocaleDateString("en-NG", { weekday: "short" });
    out.push({ date: label, count: row?.c ?? 0 });
  }
  return out;
}

async function hourlyBuckets(db: D1Database, storeId: string, nowMs: number) {
  const out: { date: string; count: number }[] = [];
  const start = new Date(nowMs);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  for (let h = 0; h < 24; h++) {
    const a = startMs + h * 3600000;
    const b = a + 3600000;
    const row = await db.prepare(
      "SELECT COUNT(*) AS c FROM store_visits WHERE store_id = ? AND ts >= ? AND ts < ?"
    ).bind(storeId, a, b).first<{ c: number }>();

    out.push({ date: String(h).padStart(2, "0"), count: row?.c ?? 0 });
  }
  return out;
}

async function getUser(request: Request, env: { DB: D1Database }) {
  const cookie = request.headers.get("Cookie") || "";
  const sid = cookie.match(/sid=([^;]+)/)?.[1];
  if (!sid) return null;
  const session = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?"
  ).bind(sid, Date.now()).first<{ user_id: string }>();
  if (!session) return null;
  return await env.DB.prepare(
    "SELECT id, email, plan FROM users WHERE id = ?"
  ).bind(session.user_id).first<{ id: string; email: string; plan: string }>();
}