export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare("SELECT key, value FROM platform_settings").all();
    const settings: Record<string, string> = {};
    for (const row of results || []) {
      settings[row.key] = row.value;
    }
    return Response.json({ settings });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async ({ env, request }) => {
  try {
    const body = await request.json() as Record<string, string>;
    
    // Batch update all settings
    const stmts = Object.entries(body).map(([key, value]) => 
      env.DB.prepare("INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)")
        .bind(key, String(value))
    );
    
    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }
    
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
