export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. If it's an API route, assets, or known app page, let it pass through
  const reserved = [
    "/api/", "/assets/", "/src/", "/favicon.ico", "/index.html", 
    "/login", "/signup", "/dashboard", "/settings", "/plan", "/legal", "/admin"
  ];

  if (reserved.some((path) => pathname.startsWith(path))) {
    return context.next();
  }

  // 2. Get the slug (e.g., "/soft" -> "soft")
  const slug = pathname.split("/")[1];
  if (!slug) {
    return context.next(); // Serve default homepage
  }

  // 3. Fetch store data from D1
  const store = await context.env.DB.prepare(
    "SELECT name, cover_url, hero_title, tagline, extra_banners FROM stores WHERE slug = ?"
  ).bind(slug).first<any>();

  // If store doesn't exist, just serve the normal app
  if (!store) {
    return context.next();
  }

  // 4. Extract Meta Data
  let imageUrl = store.cover_url || "https://biomart.pages.dev/og-fallback.jpg";
  if (!imageUrl && store.extra_banners) {
    try {
      const extras = JSON.parse(store.extra_banners);
      if (Array.isArray(extras) && extras.length > 0) imageUrl = extras[0];
    } catch (e) {}
  }

  const title = `${store.name} | Biomart`;
  const description = `${store.hero_title || store.name} — ${store.tagline || "Shop now."}`;

  // 5. Get the default React app HTML
  const response = await context.next();
  
  // 6. Inject the Meta Tags into the HTML
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(`<meta property="og:title" content="${title}" />`, { html: true });
        element.append(`<meta property="og:description" content="${description}" />`, { html: true });
        element.append(`<meta property="og:image" content="${imageUrl}" />`, { html: true });
        element.append(`<meta property="og:url" content="${context.request.url}" />`, { html: true });
        
        element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        element.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
        element.append(`<meta name="twitter:description" content="${description}" />`, { html: true });
        element.append(`<meta name="twitter:image" content="${imageUrl}" />`, { html: true });

        element.append(`<title>${title}</title>`, { html: true });
      },
    })
    .transform(response);
};
