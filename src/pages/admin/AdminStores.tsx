import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { adminApi, type AdminStoreRow } from "../../lib/adminApi";
import StoreDetailsModal from "../../components/StoreDetailsModal";

export default function AdminStores() {
  const [rows, setRows] = useState<AdminStoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stores()
      .then((r: any) => setRows(r.stores ?? []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (loading) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Stores</p>
      <h1 className="admin-page-title">
        Every <em>store</em>.
      </h1>

      <div className="admin-search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search stores…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {rows.length === 0 ? "No stores yet." : "No matches."}
        </p>
      ) : (
        <ul className="admin-store-list">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setOpenId(s.id)}
                className="admin-store-row"
              >
                <div className="admin-store-avatar">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-store-main">
                  <p className="admin-store-name">{s.name}</p>
                  <p className="admin-store-meta">
                    {s.email} · /{s.slug}
                  </p>
                </div>
                <svg
                  className="admin-store-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openId &&
        createPortal(
          <StoreDetailsModal
            storeId={openId}
            onClose={() => setOpenId(null)}
          />,
          document.body
        )}
    </div>
  );
}