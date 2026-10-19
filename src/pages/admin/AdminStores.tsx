import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { adminApi, type AdminStoreRow } from "../../lib/adminApi";
import StoreDetailsModal from "../../components/StoreDetailsModal";

export default function AdminStores() {
  const [rows, setRows] = useState<AdminStoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter States
  const [query, setQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  
  // Modal State
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stores()
      .then((r: any) => setRows(r.stores ?? []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 🟢 SIMPLE & WORKING FILTER LOGIC
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // 1. Filter by Dropdown Plan
      if (filterPlan !== "all" && r.plan !== filterPlan) return false;

      // 2. Filter by Search Query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matches = 
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [rows, filterPlan, query]);

  if (loading) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="admin-page-eyebrow">Stores</p>
          <h1 className="admin-page-title">Every <em>store</em>.</h1>
        </div>
      </div>

      {/* 🟢 SEARCH & FILTER BAR */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        
        {/* Search Bar */}
        <div className="admin-search" style={{ flex: 1, minWidth: 250, margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or link…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Plan Filter Dropdown */}
        <select 
          value={filterPlan} 
          onChange={(e) => setFilterPlan(e.target.value)}
          className="pe-input"
          style={{ width: 160, padding: "0 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* 🟢 STORE LIST */}
      {filtered.length === 0 ? (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>No stores found</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Try adjusting your search or plan filter.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((s) => {
            const isPaying = s.plan === "starter" || s.plan === "pro";
            return (
              <li key={s.id}>
                <button
                  onClick={() => setOpenId(s.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                >
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--soft)", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.email}
                    </p>
                  </div>

                  {/* Plan Badge & Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ 
                      background: isPaying ? "rgba(15, 122, 74, 0.1)" : "var(--soft)", 
                      color: isPaying ? "var(--green)" : "var(--muted)",
                      padding: "4px 10px", 
                      borderRadius: 99, 
                      fontSize: 11, 
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "none"
                    }} className="admin-store-pill">
                      {s.plan}
                    </div>

                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                </button>
              </li>
            );
          })}
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
