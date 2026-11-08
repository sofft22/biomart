import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { products as productsApi } from "../lib/api";
import { getCategories } from "../lib/storeData";
import { useToast } from "../components/Toast";
import type { Category, Product } from "../types";

type SortKey = "manual" | "newest" | "name" | "price";

function formatPrice(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export default function Dashboard() {
  const nav = useNavigate();
  // 🟢 Just pull products directly from auth, no local state needed.
  const { store: currentStore, products, refresh } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("manual");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStore?.slug) return;
    setCategories(getCategories(currentStore.slug));
  }, [currentStore?.slug]);

  const filtered = useMemo(() => {
    let list = [...products];
    
    if (category !== "all") {
      list = list.filter((p) => p.category_id === category);
    }
    
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => 
          p.name.toLowerCase().includes(q) || 
          (p.category_id || "").toLowerCase().includes(q)
      );
    }
    
    switch (sort) {
      case "manual":
        list.sort((a, b) => {
          const ao = (a as any).sort_order ?? 999999;
          const bo = (b as any).sort_order ?? 999999;
          if (ao !== bo) return ao - bo;
          return new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime();
        });
        break;
      case "name": 
        list.sort((a, b) => a.name.localeCompare(b.name)); 
        break;
      case "price": 
        list.sort((a, b) => b.price - a.price); 
        break;
      case "newest":
        list.sort((a, b) => new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime());
        break;
    }
    
    return list;
  }, [products, category, query, sort]);

  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  const categoryTabs = useMemo(
    () => [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.label }))],
    [categories]
  );

  const countFor = (id: string) =>
    id === "all" ? products.length : products.filter((p) => p.category_id === id).length;

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); 
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    setDeletingId(id);
    try {
      await productsApi.remove(id);
      await refresh(true); 
      toast.show("Product deleted successfully");
    } catch (err) {
      toast.show("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0, marginBottom: 40 }}>
        <p className="dash-head-eyebrow">Catalogue</p>
        <h1 className="dash-title">
          Your <em>products</em>.
        </h1>
        <p className="dash-head-lead">
          {products.length} total
          {outOfStockCount > 0 && (
            <> · <span style={{ color: "var(--green)" }}>{outOfStockCount} out of stock</span></>
          )}
        </p>
      </div>

      <div className="pr-toolbar" style={{ marginBottom: 28 }}>
        <div className="pr-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button onClick={() => nav("/dashboard/product")} className="pr-add" aria-label="Add product">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add</span>
        </button>
      </div>

      <div className="pr-filterbar" style={{ marginBottom: 28 }}>
        <nav className="pr-tabs">
          {categoryTabs.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`pr-tab ${active ? "active" : ""}`}
              >
                {c.label}
                <span className="pr-tab-count">{countFor(c.id)}</span>
              </button>
            );
          })}
        </nav>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="pr-select"
          aria-label="Sort"
        >
          <option value="manual">Custom</option>
          <option value="newest">Newest</option>
          <option value="name">A–Z</option>
          <option value="price">Price ↓</option>
        </select>
      </div>

      {filtered.length > 0 && (
        <div style={{ textAlign: "right", padding: "0 16px 20px", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          Tap to edit product
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l-1 12H6L5 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </div>
          <p className="dash-empty-title">
            {products.length === 0 ? "No products yet" : "No results"}
          </p>
          <p className="dash-empty-sub">
            {products.length === 0 ? "Add your first one — it takes 30 seconds." : "Try a different search or category."}
          </p>
          {products.length === 0 && (
            <button onClick={() => nav("/dashboard/product")} className="dash-btn dash-btn-dark" style={{ marginTop: 24 }}>
              + Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="pr-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => {
            const productCategory = categories.find((c) => c.id === p.category_id)?.label || p.category;
            const isDeleting = deletingId === p.id;
            
            return (
              <div 
                key={p.id} 
                className="pr-item" 
                style={{ 
                  opacity: isDeleting ? 0.5 : 1, 
                  pointerEvents: isDeleting ? "none" : "auto",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  gap: 16,
                  padding: "20px 16px",
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 16
                }}
              >
                <button 
                  onClick={() => nav(`/dashboard/product/${p.id}`)} 
                  className="pr-item-body" 
                  style={{ flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: 16 }} 
                >
                  <div className="pr-item-thumb" style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "var(--soft)", color: "var(--muted)", fontSize: 18, fontWeight: 700 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="pr-item-info" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p className="pr-item-name" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{p.name}</p>
                      {productCategory && (
                        <span style={{ 
                          fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "2px 6px", background: "var(--soft)", color: "var(--muted)", borderRadius: 4, border: "1px solid var(--line)"
                        }}>
                          {productCategory}
                        </span>
                      )}
                    </div>
                    <p className="pr-item-meta" style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </button>

                <button 
                  onClick={(e) => handleDelete(e, p.id, p.name)}
                  disabled={isDeleting}
                  style={{
                    background: "transparent", border: 0, padding: "12px", borderRadius: "50%", flexShrink: 0,
                    cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--muted)", transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#d32f2f";
                    e.currentTarget.style.background = "rgba(211, 47, 47, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  aria-label="Delete product"
                >
                  {isDeleting ? (
                    <div className="dash-spinner" style={{ width: 16, height: 16, borderTopColor: "var(--muted)" }} />
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
