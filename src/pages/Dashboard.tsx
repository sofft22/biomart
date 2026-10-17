import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { store as storeApi, products as productsApi } from "../lib/api";
import { getCategories } from "../lib/storeData";
import type { Category, Product } from "../types";

const LONG_PRESS_MS = 500;
type SortKey = "manual" | "newest" | "name" | "price";

function formatPrice(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export default function Dashboard() {
  const nav = useNavigate();
  const { store: currentStore } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("manual");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedOverId, setPickedOverId] = useState<string | null>(null);

  const longPressTimer = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!currentStore?.slug) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await storeApi.public(currentStore.slug);
      setProducts(((data as any).products as Product[]) ?? []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.slug]);

  useEffect(() => {
    if (!currentStore?.slug) return;
    setCategories(getCategories(currentStore.slug));
  }, [currentStore?.slug]);

  const canReorder = category === "all" && query === "" && sort === "manual";

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category_id === category);
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
          return (
            new Date((b as any).created_at ?? 0).getTime() -
            new Date((a as any).created_at ?? 0).getTime()
          );
        });
        break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price": list.sort((a, b) => b.price - a.price); break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date((b as any).created_at ?? 0).getTime() -
            new Date((a as any).created_at ?? 0).getTime()
        );
        break;
    }
    return list;
  }, [products, category, query, sort]);

  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  const persistOrder = async (orderedList: Product[]) => {
    for (let i = 0; i < orderedList.length; i++) {
      await productsApi.update(orderedList[i].id, { sort_order: i } as any);
    }
  };

  const applyMove = async (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    if (!canReorder) return;
    const list = [...filtered];
    const fromIdx = list.findIndex((p) => p.id === fromId);
    const toIdx = list.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const reordered = list.map((p, i) => ({ ...(p as any), sort_order: i })) as Product[];
    setProducts(reordered);
    await persistOrder(reordered);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canReorder) { e.preventDefault(); return; }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!canReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  };
  const handleDragEnd = () => {
    if (!canReorder) return;
    const fromId = draggingId;
    const toId = dragOverId;
    setDraggingId(null);
    setDragOverId(null);
    if (fromId && toId) applyMove(fromId, toId);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!canReorder) return;
    touchStartY.current = e.touches[0].clientY;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setPickedId(id);
      setPickedOverId(id);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canReorder) return;
    if (longPressTimer.current && !pickedId) {
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 5) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (!pickedId) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    const rows = listRef.current?.querySelectorAll("[data-product-id]");
    if (!rows) return;
    let targetId: string | null = null;
    rows.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        targetId = (el as HTMLElement).dataset.productId ?? null;
      }
    });
    if (targetId && targetId !== pickedOverId) setPickedOverId(targetId);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pickedId && pickedOverId && pickedId !== pickedOverId) {
      applyMove(pickedId, pickedOverId);
    }
    setPickedId(null);
    setPickedOverId(null);
  };

  const categoryTabs = useMemo(
    () => [
      { id: "all", label: "All" },
      ...categories.map((c) => ({ id: c.id, label: c.label })),
    ],
    [categories]
  );

  const countFor = (id: string) =>
    id === "all" ? products.length : products.filter((p) => p.category_id === id).length;

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0 }}>
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

      {/* Search + Add — sticky on mobile */}
      <div className="pr-toolbar">
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
        <button
          onClick={() => nav("/dashboard/product")}
          className="pr-add"
          aria-label="Add product"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add</span>
        </button>
      </div>

      {/* Filter row */}
      <div className="pr-filterbar">
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

      {canReorder && (
        <p className="pr-hint">Long-press a product to reorder</p>
      )}

      {loading ? (
        <div className="dash-loading-inline"><div className="dash-spinner" /></div>
      ) : filtered.length === 0 ? (
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
            {products.length === 0
              ? "Add your first one — it takes 30 seconds."
              : "Try a different search or category."}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => nav("/dashboard/product")}
              className="dash-btn dash-btn-dark"
              style={{ marginTop: 20 }}
            >
              + Add your first product
            </button>
          )}
        </div>
      ) : (
        <div ref={listRef} className="pr-list">
          {filtered.map((p) => {
            const isPicked = pickedId === p.id;
            const isPickedOver = pickedOverId === p.id && pickedId && pickedId !== p.id;
            const isDragOver = dragOverId === p.id;
            const catLabel =
              categories.find((c) => c.id === p.category_id)?.label ?? p.category_id;

            return (
              <div
                key={p.id}
                data-product-id={p.id}
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => e.preventDefault()}
                onTouchStart={(e) => handleTouchStart(e, p.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`pr-item ${isPicked ? "picked" : ""} ${
                  isPickedOver || isDragOver ? "over" : ""
                } ${draggingId === p.id ? "dragging" : ""}`}
              >
                <button
                  onClick={() => !isPicked && nav(`/dashboard/product/${p.id}`)}
                  className="pr-item-body"
                >
                  <div className="pr-item-thumb">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" />
                    ) : (
                      <span className="pr-item-initial">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="pr-item-info">
                    <p className="pr-item-name">{p.name}</p>
                    <p className="pr-item-meta">
  {catLabel || "Uncategorised"} · {formatPrice(p.price)}
  {typeof (p as any).views === "number" && (
    <> · {(p as any).views} {(p as any).views === 1 ? "view" : "views"}</>
  )}
</p>
                  </div>
                  <svg
                    className="pr-item-chevron"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}