export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const out: { date: string; label: string; count: number }[] = [];
    const now = Date.now();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now - i * 86400000);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + 86400000;
      
      const r = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM store_visits WHERE visited_at >= ? AND visited_at < ?"
      ).bind(start.getTime(), end).first<{ count: number }>();
      
      out.push({
        date: start.toISOString().slice(0, 10),
        label: start.toLocaleDateString("en-NG", { weekday: "short" }).charAt(0),
        count: r?.count || 0,
      });
    }
    return Response.json({ days: out });
  } catch (e: any) {
    // Return empty data instead of crashing the whole frontend
    return Response.json({ days: [] });
  }
};
