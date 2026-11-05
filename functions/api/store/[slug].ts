export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params, request }) => {
  try {
    const slug = params.slug as string;
    
    // 1. Ignore known app routes so we don't break the dashboard or login
    const reserved = ["assets", "src", "api", "favicon.ico", "index.html"];
    if (reserved.includes(slug) || slug.includes(".")) {
      return env.ASSETS.fetch(request);
    }

    // 2. Fetch the store from D1
    const store = await env.DB.prepare(
      "SELECT name, slug, cover_url, hero_title, tagline, extra_banners FROM stores WHERE slug = ?"
    ).bind(slug).first<any>();

    // If store doesn't exist, just serve the normal app (React will show 404)
    if (!store) {
      return env.ASSETS.fetch(request);
    }

    // 3. Extract the Meta Data
    let imageUrl = store.cover_url || "https://biomart.pages.dev/og-fallback.jpg"; // Use fallback if no image
    
    // Check if there is an extra banner to use as a fallback image
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
    
    // Format title: e.g. "Soft Collection | Biomart"
    const title = `${store.name} | Biomart`;
    const description = `${heroTitle} — ${tagline}. Shop now.`;

    // 4. Fetch the default index.html from the Cloudflare build
    const assetUrl = new URL(request.url);
    assetUrl.pathname = "/index.html";
    const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    
    // 5. Inject the meta tags
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          // Standard Meta
          element.append(`<meta property="og:title" content="${title}" />`, { html: true });
          element.append(`<meta property="og:description" content="${description}" />`, { html: true });
          element.append(`<meta property="og:image" content="${imageUrl}" />`, { html: true });
          element.append(`<meta property="og:url" content="${request.url}" />`, { html: true });
          element.append(`<meta property="og:type" content="website" />`, { html: true });
          
          // Twitter Meta
          element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
          element.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
          element.append(`<meta name="twitter:description" content="${description}" />`, { html: true });
          element.append(`<meta name="twitter:image" content="${imageUrl}" />`, { html: true });

          // Standard HTML Title
          element.append(`<title>${title}</title>`, { html: true });
        },
      })
      .transform(response);
  } catch (e) {
    // If anything fails, just serve the normal app
    return env.ASSETS.fetch(request);
  }
};
