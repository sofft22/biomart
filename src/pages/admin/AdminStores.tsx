import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { adminApi, type AdminStoreRow } from "../../lib/adminApi";
import StoreDetailsModal from "../../components/StoreDetailsModal";

type FilterTab = "all" | "paying" | "free" | "expiring";

export default function AdminStores() {
  const [rows, setRows] = useState<AdminStoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [planFilter, setPlanFilter] = useState("all");
  
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stores()
      .then((r: any) => setRows(r.stores ?? []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 🟢 CALCULATE TABS
  const counts = useMemo(() => {
    const now = Date.now();
    let paying = 0;
    let free = 0;
    let expiring = 0;

    rows.forEach((r) => {
      const isPaying = r.plan === "starter" || r.plan === "pro";
      if (isPaying) paying++;
      else free++;

      // Check if expiring in next 7 days (you'd need to add paid_until to AdminStoreRow type if you want this to be accurate)
      // For now, we will just use paying count for the tab
    });

    return { all: rows.length, paying, free, expiring };
  }, [rows]);

  // 🟢 APPLY FILTERS
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // 1. Tab Filter
      const isPaying = r.plan === "starter" || r.plan === "pro";
      if (activeTab === "paying" && !isPaying) return false;
      if (activeTab === "free" && isPaying) return false;
      
      // 2. Plan Dropdown Filter
      if (planFilter !== "all" && r.plan !== planFilter) return false;

      // 3. Search Query
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
  }, [rows, activeTab, planFilter, query]);

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

      {/* 🟢 TABS */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginTop: 24, borderBottom: "1px solid var(--line)" }}>
        {[
          { id: "all", label: "All Stores", count: counts.all },
          { id: "paying", label: "Paying", count: counts.paying },
          { id: "free", label: "Free", count: counts.free },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FilterTab)}
            style={{
              background: activeTab === tab.id ? "var(--ink)" : "transparent",
              color: activeTab === tab.id ? "var(--bg)" : "var(--muted)",
              border: 0,
              padding: "8px 16px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
            <span style={{ 
              background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "var(--soft)", 
              padding: "2px 8px", 
              borderRadius: 99, 
              fontSize: 11 
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 🟢 SEARCH & FILTER BAR */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
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

        <select 
          value={planFilter} 
          onChange={(e) => setPlanFilter(e.target.value)}
          className="pe-select"
          style={{ width: 160, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg)" }}
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* 🟢 STORE LIST */}
      {filtered.length === 0 ? (
        <div className="admin-empty" style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>No stores found</p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Try adjusting your search or filters.</p>
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
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--soft)", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.email}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ 
                      background: isPaying ? "rgba(15, 122, 74, 0.1)" : "var(--soft)", 
                      color: isPaying ? "var(--green)" : "var(--muted)",
                      padding: "4px 10px", 
                      borderRadius: 99, 
                      fontSize: 11, 
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "none" // Hide on mobile, show on desktop via CSS class if you want
                    }} className="admin-store-pill">
                      {s.plan}
                    </div>

                    <svg className="admin-store-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
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
