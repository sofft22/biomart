export const onRequestGet: PagesFunction<{ DB: D1Database }> = async ({ env, params }) => {
  const slug = params.slug as string;

  const store = await env.DB.prepare(
    "SELECT id, slug, name, bio, tagline, address, whatsapp, instagram, tiktok, cover_url FROM stores WHERE slug = ?"
  ).bind(slug).first();

  if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.price, p.compare_at_price, p.description,
            p.category, p.subcategory, p.badge, p.in_stock, p.images,
            p.variants, p.created_at,
            (SELECT COUNT(*) FROM product_views WHERE product_id = p.id) AS views
     FROM products p
     WHERE p.store_id = ?
     ORDER BY p.created_at DESC`
  ).bind((store as { id: string }).id).all();

  return Response.json({
    store,
    products: results.map((p: any) => {
      let parsedImages: string[] = [];
      try { parsedImages = JSON.parse(p.images || "[]"); } catch { parsedImages = []; }

      let parsedVariants: any = undefined;
      try { if (p.variants) parsedVariants = JSON.parse(p.variants); } catch {}

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        compare_at_price: p.compare_at_price ?? null,
        description: p.description,
        category: p.category,
        category_id: p.category,
        subcategory: p.subcategory ?? null,
        badge: p.badge ?? null,
        in_stock: !!p.in_stock,
        inStock: !!p.in_stock,
        image_url: parsedImages[0] ?? null,
        image_urls: parsedImages.slice(1),
        images: parsedImages,
        variants: parsedVariants,
        created_at: p.created_at,
        views: Number(p.views) || 0,
      };
    }),
  });
};