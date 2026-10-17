import { connect } from "@tursodatabase/serverless";

interface Env {
  TURSO_URL: string;
  TURSO_READ_TOKEN: string;
  TURSO_WRITE_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    const conn = connect({
      url: env.TURSO_URL,
      authToken: env.TURSO_WRITE_TOKEN,
    });

    // ── Store + products ──
    if (url.pathname === "/api/store" && request.method === "GET") {
      const slug = url.searchParams.get("slug");
      if (!slug) return Response.json({ error: "No slug" }, { status: 400 });

      const storeRes = await conn.execute({
        sql: "SELECT id, slug, name, bio, tagline, address, whatsapp, instagram, tiktok, cover_url FROM stores WHERE slug = ?",
        args: [slug],
      });

      if (!storeRes.rows.length) {
        return Response.json({ error: "Store not found" }, { status: 404 });
      }

      const store = storeRes.rows[0] as any;

      const prodRes = await conn.execute({
        sql: "SELECT id, name, price, compare_at_price, description, category, subcategory, badge, in_stock, images, variants, created_at FROM products WHERE store_id = ? ORDER BY created_at DESC",
        args: [store.id],
      });

      return Response.json({
        store,
        products: prodRes.rows.map((p: any) => {
          let parsedImages: string[] = [];
          try { parsedImages = JSON.parse(p.images || "[]"); } catch {}
          let parsedVariants: any = undefined;
          try { if (p.variants) parsedVariants = JSON.parse(p.variants); } catch {}

          return {
            ...p,
            category_id: p.category,
            inStock: !!p.in_stock,
            in_stock: !!p.in_stock,
            image_url: parsedImages[0] ?? null,
            image_urls: parsedImages.slice(1),
            images: parsedImages,
            variants: parsedVariants,
          };
        }),
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};