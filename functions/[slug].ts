export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  const reserved = [
    "/api/", "/assets/", "/src/", "/favicon.ico", "/index.html", 
    "/login", "/signup", "/dashboard", "/settings", "/plan", "/legal", "/admin"
  ];

  if (reserved.some((path) => pathname.startsWith(path))) {
    return context.next();
  }

  const slug = pathname.split("/")[1];
  if (!slug) {
    return context.next(); 
  }

  const store = await context.env.DB.prepare(
    "SELECT name, cover_url, hero_title, tagline, extra_banners FROM stores WHERE slug = ?"
  ).bind(slug).first<any>();

  if (!store) {
    return context.next();
  }

  let imageUrl = store.cover_url || "https://biomart.pages.dev/og-fallback.jpg";
  if (!imageUrl && store.extra_banners) {
    try {
      const extras = JSON.parse(store.extra_banners);
      if (Array.isArray(extras) && extras.length > 0) imageUrl = extras[0];
    } catch (e) {}
  }

  const title = `${store.name} | Biomart`;
  const description = `${store.hero_title || store.name} — ${store.tagline || "Shop now."}`;

  const response = await context.next();
  
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        // 🟢 REMOVE the generic Biomart tags so they don't conflict
        element.onEndTag(() => {}); 
      },
    })
    .on("title", {
      element(element) {
        element.setInnerContent(title); // 🟢 REPLACE the title
      }
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute("content", title); // 🟢 REPLACE og:title
      }
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute("content", description); // 🟢 REPLACE og:description
      }
    })
    .on('meta[property="og:image"]', {
      element(element) {
        element.setAttribute("content", imageUrl); // 🟢 REPLACE og:image
      }
    })
    .on("head", {
      element(element) {
        // Append the Twitter tags (since they aren't in the default HTML)
        element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        element.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
        element.append(`<meta name="twitter:description" content="${description}" />`, { html: true });
        element.append(`<meta name="twitter:image" content="${imageUrl}" />`, { html: true });
      }
    })
    .transform(response);
};
