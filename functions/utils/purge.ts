// functions/utils/purge.ts
export async function purgeStoreCache(slug: string, env: any, requestUrl: string) {
  try {
    // 1. Reconstruct the exact public URL of the store
    const url = new URL(requestUrl);
    const storeUrl = `${url.protocol}//${url.host}/api/store/${slug}`;

    // 2. Delete the cached response directly from the edge
    const cache = caches.default;
    await cache.delete(storeUrl);
    
  } catch (e) {
    console.error("Cache purge failed", e);
  }
}
