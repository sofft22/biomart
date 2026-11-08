// functions/utils/purge.ts

export async function purgeStoreCache(slug: string, env: any, requestUrl: string) {
  try {
    // 1. Reconstruct the exact public URL of the store
    const url = new URL(requestUrl);
    const storeUrl = `${url.protocol}//${url.host}/api/store/${slug}`;

    // 2. Create the exact same Request object as the cache key
    // (This matches the sanitized key we built in the [slug].ts file)
    const cacheKey = new Request(storeUrl, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const cache = caches.default;
    
    // 3. Pass the Request object, NOT a string, to successfully delete it
    const deleted = await cache.delete(cacheKey);
    
    if (deleted) {
      console.log(`✅ Cache successfully purged for: ${storeUrl}`);
    } else {
      console.log(`ℹ️ Nothing to purge in cache for: ${storeUrl}`);
    }
    
  } catch (e) {
    console.error("❌ Cache purge failed", e);
  }
}
