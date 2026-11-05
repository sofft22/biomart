// functions/utils/purge.ts
export async function purgeStoreCache(slug: string, env: any) {
  const zoneId = env.CF_ZONE_ID;
  const apiToken = env.CF_API_TOKEN;
  if (!zoneId || !apiToken) return; // Skip if not configured

  // We purge the specific public URL so the next customer gets fresh data
  const url = `https://biomart.pages.dev/store/${slug}`;
  
  try {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ files: [url] })
    });
  } catch (e) {
    console.error("Purge failed", e);
  }
}
