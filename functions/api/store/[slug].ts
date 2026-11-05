export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params, request }) => {
  try {
    const slug = params.slug as string;
    
    // 🟢 1. Ignore standard app routes, API routes, and static assets
    // If the slug is empty (root), or matches a known route, serve the default app.
    const reserved = ["assets", "src", "api", "favicon.ico", "index.html", "login", "signup", "dashboard", "settings", "plan", "legal"];
    
    if (!slug || reserved.includes(slug) || slug.includes(".")) {
      return env.ASSETS.fetch(request);
    }

    // 🟢 2. Fetch the store from D1
    const store = await env.DB.prepare(
      "SELECT name, slug, cover_url, hero_title, tagline, extra_banners FROM stores WHERE slug = ?"
    ).bind(slug).first<any>();

    // If the store doesn't exist, serve the default app (React will show a 404, but the meta tags will be Biomart's)
    if (!store) {
      return env.ASSETS.fetch(request);
    }

    // 🟢 3. Extract the Meta Data
    let imageUrl = store.cover_url || "https://biomart.pages.dev/og-fallback.jpg"; 
    
    // If no cover_url, check extra_banners
    if (!imageUrl && store.extra_banners) {
      try {
        const extras = JSON.parse(store.extra_banners);
        if (Array.isArray(extras) && extras.length > 0) {
          imageUrl = extras[0];
        }
      } catch (e) {}
    }

    const heroTitle = store.hero_title || store.name;
    const tagline = store.tagline || "Shop our collection";
    
    const title = `${store.name} | Biomart`;
    const description = `${heroTitle} — ${tagline}. Shop now.`;

    // 🟢 4. Fetch the default index.html
    const assetUrl = new URL(request.url);
    assetUrl.pathname = "/index.html";
    const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    
    // 🟢 5. Inject the Store's Meta Tags
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          // Remove the default Biomart title and description so they don't conflict
          element.append(`<meta property="og:title" content="${title}" />`, { html: true });
          element.append(`<meta property="og:description" content="${description}" />`, { html: true });
          element.append(`<meta property="og:image" content="${imageUrl}" />`, { html: true });
          element.append(`<meta property="og:url" content="${request.url}" />`, { html: true });
          
          element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
          element.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
          element.append(`<meta name="twitter:description" content="${description}" />`, { html: true });
          element.append(`<meta name="twitter:image" content="${imageUrl}" />`, { html: true });

          element.append(`<title>${title}</title>`, { html: true });
        },
      })
      .transform(response);
  } catch (e) {
    return env.ASSETS.fetch(request);
  }
};
