export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const flags = await env.DB.prepare(
      "SELECT key, value FROM settings"
    ).all<{ key: string; value: string }>();
    const map: Record<string, string> = {};
    for (const r of flags.results || []) map[r.key] = r.value;
    return Response.json({ flags: map });
  } catch {
    return Response.json({ flags: {} });
  }
};