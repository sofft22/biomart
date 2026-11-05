export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params, request }) => {
  try {
    const slug = params.slug as string;

    // Bouncer: Ignore app routes
    const reserved = ["api", "assets", "src", "favicon.ico", "index.html", "login", "signup", "dashboard", "settings", "plan", "legal", "admin"];
    if (!slug || reserved.includes(slug) || slug.includes(".")) {
      return env.ASSETS.fetch(request);
    }

    // Fetch the store data
    const store = await env.DB.prepare(
      "SELECT name, cover_url, hero_title, tagline, extra_banners FROM stores WHERE slug = ?"
    ).bind(slug).first<any>();

    // If store doesn't exist, serve the app
    if (!store) {
      return env.ASSETS.fetch(request);
    }

    // Prepare meta data
    let imageUrl = store.cover_url || "https://biomart.pages.dev/og-fallback.jpg"; 
    if (!imageUrl && store.extra_banners) {
      try {
        const extras = JSON.parse(store.extra_banners);
        if (Array.isArray(extras) && extras.length > 0) imageUrl = extras[0];
      } catch (e) {}
    }

    const title = `${store.name} | Biomart`;
    const description = `${store.hero_title || store.name} — ${store.tagline || "Shop now."}`;

    // Fetch base HTML
    const assetUrl = new URL(request.url);
    assetUrl.pathname = "/index.html";
    const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    
    // 🟢 INJECT TAGS
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(`<meta property="og:title" content="${title}" />`, { html: true });
          element.append(`<meta property="og:description" content="${description}" />`, { html: true });
          element.append(`<meta property="og:image" content="${imageUrl}" />`, { html: true });
          element.append(`<meta property="og:url" content="${request.url}" />`, { html: true });
          element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
          element.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
          element.append(`<meta name="twitter:image" content="${imageUrl}" />`, { html: true });
          element.append(`<title>${title}</title>`, { html: true });
        },
      })
      .transform(response);
  } catch (e) {
    return env.ASSETS.fetch(request);
  }
};
