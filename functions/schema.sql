CREATE TABLE IF NOT EXISTS store_visits (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_store_visits_store_ts
  ON store_visits (store_id, ts);

CREATE TABLE IF NOT EXISTS product_views (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_views_store_ts
  ON product_views (store_id, ts);
CREATE INDEX IF NOT EXISTS idx_product_views_product
  ON product_views (product_id);