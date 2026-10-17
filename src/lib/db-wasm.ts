// @ts-expect-error — sql.js ships types but the module isn't installed; types handled via any fallback
import initSqlJs, { type Database } from "sql.js";

let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        `https://sql.js.org/dist/${file}`,
    });

    const db = new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT,
        bio TEXT,
        tagline TEXT,
        address TEXT,
        whatsapp TEXT,
        instagram TEXT,
        tiktok TEXT,
        cover_url TEXT,
        created_at INTEGER
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

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        expires_at INTEGER
      );
    `);

    const res = db.exec("SELECT COUNT(*) as c FROM stores");
    const count = res[0]?.values[0]?.[0] ?? 0;

    if (count === 0) {
      const now = Date.now();
      db.run(`
        INSERT INTO stores (id, slug, name, bio, tagline, address, whatsapp, instagram, tiktok, cover_url, created_at)
        VALUES (
          'store-1', 'soft', 'Soft Closet',
          'Bags, shoes and skincare · Lagos',
          'Where Lagos style meets everyday luxury',
          '12 Admiralty Way, Lekki, Lagos',
          '09162443887', 'soft', 'soft', NULL, ${now}
        );

        INSERT INTO products (id, store_id, name, price, compare_at_price, description, category, in_stock, images, created_at)
        VALUES
          ('p1', 'store-1', 'Ankara tote bag', 20500, 27000, 'Handcrafted Ankara tote', 'bags', 1, '["https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&q=75"]', ${now}),
          ('p2', 'store-1', 'White sneakers', 32000, NULL, 'Clean white sneakers', 'shoes', 1, '["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=75"]', ${now}),
          ('p3', 'store-1', 'Shea body butter', 6500, NULL, 'Raw shea butter', 'skincare', 1, '["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=75"]', ${now});
      `);
    }

    _db = db;
    return db;
  })();

  return _initPromise;
}

export async function query(sql: string, args: any[] = []): Promise<any[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(args);

  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function run(sql: string, args: any[] = []): Promise<void> {
  const db = await getDb();
  db.run(sql, args);
}