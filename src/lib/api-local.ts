import initSqlJs, { type Database } from "sql.js";
// @ts-ignore — Vite handles ?url imports, ships the wasm as a local asset
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

import type {
  MeResponse,
  Product,
  Store,
  StorefrontResponse,
} from "../types";
import { getLimit } from "./plans";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const db = new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT,
        bio TEXT,
        tagline TEXT,
        address TEXT,
        whatsapp TEXT,
        instagram TEXT,
        tiktok TEXT,
        cover_url TEXT,
        created_at INTEGER,
        plan TEXT DEFAULT 'free',
        paid_until INTEGER,
        subscription_status TEXT DEFAULT 'active'
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        store_id TEXT,
        name TEXT,
        price INTEGER,
        compare_at_price INTEGER,
        description TEXT,
        category TEXT,
        subcategory TEXT,
        badge TEXT,
        in_stock INTEGER DEFAULT 1,
        images TEXT DEFAULT '[]',
        variants TEXT,
        created_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        plan TEXT DEFAULT 'free',
        is_admin INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        plan TEXT NOT NULL,
        note TEXT,
        paid_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS store_visits (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        visited_at INTEGER NOT NULL
      );
    `);

    // 🟢 REMOVED THE FAKE SEEDED DATA. STARTS CLEAN.
    
    _db = db;
    return db;
  })();

  return _initPromise;
}

function rows<T = any>(db: Database, sql: string, args: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(args);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

function hydrateProduct(p: any): Product {
  let imgs: string[] = [];
  try { imgs = JSON.parse(p.images || "[]"); } catch { imgs = []; }
  let variants: Product["variants"] | undefined;
  try { if (p.variants) variants = JSON.parse(p.variants); } catch {}
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    compare_at_price: p.compare_at_price ?? null,
    description: p.description ?? "",
    category: p.category ?? "",
    category_id: p.category ?? "",
    subcategory: p.subcategory ?? null,
    badge: p.badge ?? null,
    in_stock: !!p.in_stock,
    inStock: !!p.in_stock,
    images: imgs,
    image_url: imgs[0] ?? null,
    image_urls: imgs.slice(1),
    variants: variants ?? null,
    created_at: p.created_at,
    views: 0,
  };
}

const CURRENT_USER_ID = "user-1";

function autoDowngradeExpired(db: Database): void {
  const graceCutoff = Date.now() - 7 * 86400000;
  db.run(
    `UPDATE stores
        SET plan = 'free', paid_until = NULL, subscription_status = 'active'
      WHERE plan IN ('starter','pro')
        AND paid_until IS NOT NULL
        AND paid_until < ?`,
    [graceCutoff]
  );
}

export const auth = {
  async me(): Promise<MeResponse> {
    const db = await getDb();
    autoDowngradeExpired(db);

    const users = rows<{ id: string; email: string; plan: string; is_admin?: number }>(
      db, "SELECT * FROM users WHERE id = ?", [CURRENT_USER_ID]
    );
    const user = users[0] ?? null;

    const stores = rows<Store>(db, "SELECT * FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    const store = stores[0] ?? null;

    let productList: Product[] = [];
    if (store) {
      productList = rows(db, "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC", [store.id])
        .map(hydrateProduct);
    }

    const planName = (store as any)?.plan || user?.plan || "free";
    const limit = getLimit(planName);

    return {
      user: user ? { id: user.id, email: user.email, plan: user.plan } : null,
      store,
      products: productList,
      limits: { planName, products: limit.visible, images: limit.photos },
      plans: {
        free: { name: "Free", price: 0, products: 5, images: 1 },
        starter: { name: "Starter", price: 2500, products: 20, images: 3 },
        pro: { name: "Pro", price: 6000, products: 100000, images: 5 },
      },
    };
  },
  async login(): Promise<void> {},
  async signup(): Promise<void> {},
  async logout(): Promise<void> {},
};

export const store = {
  async update(payload: Partial<Store>): Promise<void> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT id FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    if (!stores[0]) throw new ApiError("No store", 404);

    const allowed = ["name", "bio", "tagline", "address", "whatsapp", "instagram", "tiktok", "cover_url"];
    const cols: string[] = [];
    const vals: any[] = [];
    for (const k of allowed) {
      if (k in (payload as any)) {
        cols.push(`${k} = ?`);
        vals.push((payload as any)[k] ?? null);
      }
    }
    if (!cols.length) return;
    vals.push(stores[0].id);
    db.run(`UPDATE stores SET ${cols.join(", ")} WHERE id = ?`, vals);
  },

  async public(slug: string): Promise<StorefrontResponse> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT * FROM stores WHERE slug = ?", [slug]);
    const s = stores[0];
    if (!s) throw new ApiError("Store not found", 404);

    const plan = (s as any).plan ?? "free";
    const limit = getLimit(plan).visible;

    const all = rows(
      db,
      "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC",
      [s.id]
    ).map(hydrateProduct);

    return { store: s, products: all.slice(0, limit) };
  },
};

export const products = {
  async list(): Promise<Product[]> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT id FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    if (!stores[0]) return [];
    return rows(db, "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC", [stores[0].id])
      .map(hydrateProduct);
  },

  async create(payload: Partial<Product>): Promise<Product> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT id FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    if (!stores[0]) throw new ApiError("No store", 404);
    const storeRow = stores[0];

    const plan = (storeRow as any).plan ?? "free";
    const photoLimit = getLimit(plan).photos;
    const imgs = payload.images ?? (payload.image_url ? [payload.image_url, ...(payload.image_urls ?? [])] : []);
    if (imgs.length > photoLimit) {
      throw new ApiError(
        `Your plan allows ${photoLimit} photo${photoLimit === 1 ? "" : "s"} per product. Upgrade for more.`,
        403
      );
    }

    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const images = JSON.stringify(imgs);
    const now = Date.now();

    db.run(
      `INSERT INTO products (id, store_id, name, price, compare_at_price, description, category, subcategory, badge, in_stock, images, variants, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        storeRow.id,
        payload.name ?? "",
        payload.price ?? 0,
        payload.compare_at_price ?? null,
        payload.description ?? "",
        payload.category_id ?? payload.category ?? "",
        payload.subcategory ?? null,
        payload.badge ?? null,
        payload.in_stock === false || payload.inStock === false ? 0 : 1,
        images,
        payload.variants ? JSON.stringify(payload.variants) : null,
        now,
      ]
    );

    return hydrateProduct({
      id,
      store_id: storeRow.id,
      name: payload.name ?? "",
      price: payload.price ?? 0,
      compare_at_price: payload.compare_at_price ?? null,
      description: payload.description ?? "",
      category: payload.category_id ?? payload.category ?? "",
      subcategory: payload.subcategory ?? null,
      badge: payload.badge ?? null,
      in_stock: 1,
      images,
      variants: payload.variants ? JSON.stringify(payload.variants) : null,
      created_at: now,
    });
  },

  async update(id: string, payload: Partial<Product>): Promise<void> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT id FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    if (!stores[0]) throw new ApiError("No store", 404);
    const storeRow = stores[0];

    const existing = rows<any>(db, "SELECT * FROM products WHERE id = ? AND store_id = ?", [id, storeRow.id])[0];
    if (!existing) throw new ApiError("Product not found", 404);

    const plan = (storeRow as any).plan ?? "free";
    const photoLimit = getLimit(plan).photos;

    const imgs = payload.images ?? (payload.image_url ? [payload.image_url, ...(payload.image_urls ?? [])] : JSON.parse(existing.images || "[]"));
    if (imgs.length > photoLimit) {
      throw new ApiError(
        `Your plan allows ${photoLimit} photo${photoLimit === 1 ? "" : "s"} per product. Upgrade for more.`,
        403
      );
    }
    const images = JSON.stringify(imgs);

    db.run(
      `UPDATE products SET
        name = ?, price = ?, compare_at_price = ?, description = ?, category = ?,
        subcategory = ?, badge = ?, in_stock = ?, images = ?, variants = ?
       WHERE id = ? AND store_id = ?`,
      [
        payload.name ?? existing.name,
        payload.price ?? existing.price,
        payload.compare_at_price ?? existing.compare_at_price,
        payload.description ?? existing.description,
        payload.category_id ?? payload.category ?? existing.category,
        payload.subcategory ?? existing.subcategory,
        payload.badge ?? existing.badge,
        (payload.in_stock === false || payload.inStock === false) ? 0 : 1,
        images,
        payload.variants ? JSON.stringify(payload.variants) : existing.variants,
        id,
        storeRow.id,
      ]
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    const stores = rows<Store>(db, "SELECT id FROM stores WHERE user_id = ?", [CURRENT_USER_ID]);
    if (!stores[0]) throw new ApiError("No store", 404);
    db.run("DELETE FROM products WHERE id = ? AND store_id = ?", [id, stores[0].id]);
  },
};

export async function uploadImage(file: File | Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError("Upload failed", 500));
    reader.readAsDataURL(file);
  });
}

export const track = {
  async storeVisit(slug: string): Promise<{ ok: true }> {
    try {
      const db = await getDb();
      const stores = rows<{ id: string }>(db, "SELECT id FROM stores WHERE slug = ?", [slug]);
      const s = stores[0];
      if (!s) return { ok: true };
      const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      db.run(
        "INSERT INTO store_visits (id, store_id, slug, visited_at) VALUES (?, ?, ?, ?)",
        [id, s.id, slug, Date.now()]
      );
    } catch {}
    return { ok: true };
  },
  async productView(_id: string): Promise<{ ok: true }> { return { ok: true }; },
};

export type StatsResponse = {
  visits: { today: number; week: number; month: number };
  totalProductViews: number;
  chart: {
    today: { date: string; count: number }[];
    week: { date: string; count: number }[];
    month: { date: string; count: number }[];
  };
  topProducts: { id: string; name: string; price: number; image_url: string | null; views: number }[];
};

export const stats = {
  async get(): Promise<StatsResponse> {
    const today = Array.from({ length: 24 }, (_, h) => ({ date: String(h).padStart(2, "0"), count: 0 }));
    const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({ date: d, count: 0 }));
    const month = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      return { date: d.toLocaleDateString("en-NG", { weekday: "short" }), count: 0 };
    });
    return {
      visits: { today: 0, week: 0, month: 0 },
      totalProductViews: 0,
      chart: { today, week, month },
      topProducts: [],
    };
  },
};

function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (h << 5) - h + pw.charCodeAt(i);
    h |= 0;
  }
  return `preview:${h.toString(16)}:${pw.length}`;
}

export const admin = {
  async overview() {
    const db = await getDb();
    autoDowngradeExpired(db);

    const storePlanRows = rows<{ plan: string; count: number }>(
      db,
      "SELECT plan, COUNT(*) as count FROM stores GROUP BY plan"
    );
    const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, lifetime: 0 };
    let totalStores = 0;
    for (const r of storePlanRows) {
      planCounts[r.plan] = r.count;
      totalStores += r.count;
    }

    const prices: Record<string, number> = { free: 0, starter: 2000, pro: 4000, lifetime: 0 };
    const mrr = planCounts.starter * prices.starter + planCounts.pro * prices.pro;

    const revenueRow = rows<{ total: number }>(db, "SELECT COALESCE(SUM(amount), 0) as total FROM payments");
    const totalRevenue = revenueRow[0]?.total ?? 0;

    const visitsRow = rows<{ count: number }>(db, "SELECT COUNT(*) as count FROM store_visits");
    const totalVisits = visitsRow[0]?.count ?? 0;

    const productsRow = rows<{ count: number }>(db, "SELECT COUNT(*) as count FROM products");
    const totalProducts = productsRow[0]?.count ?? 0;

    const payingStores = planCounts.starter + planCounts.pro + planCounts.lifetime;

    return {
      mrr,
      totalRevenue,
      totalStores,
      payingStores,
      freeStores: planCounts.free,
      totalVisits,
      totalProducts,
      planCounts,
    };
  },

  async visitsByDay() {
    const db = await getDb();
    const out: { date: string; label: string; count: number }[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const start = new Date(now - i * 86400000);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + 86400000;
      const r = rows<{ count: number }>(
        db,
        "SELECT COUNT(*) as count FROM store_visits WHERE visited_at >= ? AND visited_at < ?",
        [start.getTime(), end]
      );
      out.push({
        date: start.toISOString().slice(0, 10),
        label: start.toLocaleDateString("en-NG", { weekday: "short" }).charAt(0),
        count: r[0]?.count ?? 0,
      });
    }
    return { days: out };
  },

  async topStores() {
    const db = await getDb();
    const data = rows<any>(
      db,
      `SELECT stores.id, stores.name, stores.slug, stores.plan,
              COUNT(store_visits.id) as visits
         FROM stores
         LEFT JOIN store_visits ON store_visits.store_id = stores.id
        GROUP BY stores.id
        HAVING visits > 0
        ORDER BY visits DESC
        LIMIT 5`
    );
    return {
      stores: data.map((r) => ({
        id: r.id,
        name: r.name ?? "Untitled store",
        slug: r.slug ?? "",
        plan: r.plan ?? "free",
        visits: r.visits ?? 0,
      })),
    };
  },

  async stores() {
    const db = await getDb();
    autoDowngradeExpired(db);

    const data = rows<any>(
      db,
      `SELECT stores.id, stores.name, stores.slug,
              stores.plan, stores.created_at,
              users.email
         FROM stores LEFT JOIN users ON users.id = stores.user_id
        ORDER BY stores.created_at DESC`
    );
    return {
      stores: data.map((r) => ({
        id: r.id,
        name: r.name ?? "Untitled store",
        slug: r.slug ?? "",
        email: r.email ?? "demo@biomart.local",
        plan: r.plan ?? "free",
        created_at: r.created_at ?? Date.now(),
      })),
    };
  },

  async storeDetail(id: string) {
    const db = await getDb();
    autoDowngradeExpired(db);

    const storeRows = rows<any>(
      db,
      `SELECT stores.*, users.email
         FROM stores LEFT JOIN users ON users.id = stores.user_id
        WHERE stores.id = ?`,
      [id]
    );
    const s = storeRows[0];
    if (!s) throw new ApiError("Store not found", 404);

    const productCount = rows<{ count: number }>(
      db, "SELECT COUNT(*) as count FROM products WHERE store_id = ?", [id]
    )[0]?.count ?? 0;

    const visitCount = rows<{ count: number }>(
      db, "SELECT COUNT(*) as count FROM store_visits WHERE store_id = ?", [id]
    )[0]?.count ?? 0;

    return {
      id: s.id,
      name: s.name ?? "Untitled store",
      slug: s.slug ?? "",
      email: s.email ?? "demo@biomart.local",
      whatsapp: s.whatsapp ?? "",
      instagram: s.instagram ?? "",
      tiktok: s.tiktok ?? "",
      address: s.address ?? "",
      tagline: s.tagline ?? "",
      bio: s.bio ?? "",
      cover_url: s.cover_url ?? "",
      plan: s.plan ?? "free",
      paid_until: s.paid_until ?? null,
      subscription_status: s.subscription_status ?? "active",
      created_at: s.created_at ?? Date.now(),
      productCount,
      visitCount,
    };
  },

  async billing() {
    const db = await getDb();
    const data = rows<any>(
      db,
      `SELECT payments.id, payments.store_id, payments.amount,
              payments.plan, payments.note, payments.paid_at,
              stores.name as store_name
         FROM payments
         LEFT JOIN stores ON stores.id = payments.store_id
        ORDER BY payments.paid_at DESC`
    );
    return { payments: data };
  },

  async expiringStores() {
    const db = await getDb();
    const nextWeek = Date.now() + 7 * 86400000;
    
    const data = rows<any>(
      db,
      `SELECT stores.id, stores.name, stores.slug, stores.plan, stores.paid_until
         FROM stores
        WHERE plan IN ('starter', 'pro')
          AND (paid_until <= ? OR paid_until < ?)
        ORDER BY paid_until ASC`,
      [nextWeek, Date.now()]
    );
    return {
      stores: data.map((r) => ({
        id: r.id,
        name: r.name ?? "Untitled store",
        slug: r.slug ?? "",
        plan: r.plan ?? "free",
        paid_until: r.paid_until,
      })),
    };
  },

  async settings() {
    return {
      flags: {
        signups_paused: "false",
        maintenance_mode: "false",
        support_number: "+2348012345678",
      },
    };
  },

  async recordPayment(storeId: string, plan: string, amount: number, note: string) {
    const db = await getDb();
    const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const paidAt = Date.now();

    db.run(
      "INSERT INTO payments (id, store_id, amount, plan, note, paid_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, storeId, amount, plan, note, paidAt]
    );

    const paidUntil = plan === "lifetime" ? null : Date.now() + 30 * 24 * 60 * 60 * 1000;
    db.run(
      "UPDATE stores SET plan = ?, paid_until = ?, subscription_status = 'active' WHERE id = ?",
      [plan, paidUntil, storeId]
    );

    return { ok: true };
  },

  async resetPassword(storeId: string, newPassword: string) {
    const db = await getDb();
    const s = rows<{ user_id: string }>(db, "SELECT user_id FROM stores WHERE id = ?", [storeId])[0];
    if (!s) throw new ApiError("Store not found", 404);
    const hash = hashPassword(newPassword);
    db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, s.user_id]);
    return { ok: true };
  },

  async deleteStore(storeId: string) {
    const db = await getDb();
    const s = rows<{ user_id: string }>(db, "SELECT user_id FROM stores WHERE id = ?", [storeId])[0];
    if (!s) throw new ApiError("Store not found", 404);

    db.run("DELETE FROM products WHERE store_id = ?", [storeId]);
    db.run("DELETE FROM payments WHERE store_id = ?", [storeId]);
    db.run("DELETE FROM store_visits WHERE store_id = ?", [storeId]);
    db.run("DELETE FROM stores WHERE id = ?", [storeId]);
    db.run("DELETE FROM users WHERE id = ?", [s.user_id]);

    return { ok: true };
  },
};
