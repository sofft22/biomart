import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { store as storeApi } from "../lib/api";
import { getCategoriesWithImages } from "../lib/storeData"; // 🟢 Re-added this to get exact saved images
import { naira } from "../lib/format";
import type { Product, Category, Store } from "../types";

import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartContext";

type CatWithImg = Category & { image?: string };

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [sortBy, setSortBy] = useState("featured");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    storeApi
      .public(slug)
      .then((data) => {
        setStore(data.store);
        setProducts(data.products ?? []);
        
        // 🟢 FIX: Use the exact categories from Settings (includes exact images)
        // No fallbacks, no random default fields.
        const savedCats = getCategoriesWithImages(slug);
        setCategories(savedCats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  const displayedProducts = useMemo(() => {
    let list = [...products];
    if (filterCategory !== "all") {
      list = list.filter((p) => p.category_id === filterCategory);
    }
    switch (sortBy) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "newest": list.sort((a, b) => new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime()); break;
      case "featured": default:
        list.sort((a, b) => {
          const ao = (a as any).sort_order ?? 999999;
          const bo = (b as any).sort_order ?? 999999;
          return ao - bo;
        });
        break;
    }
    return list;
  }, [products, filterCategory, sortBy]);

  if (loading) return <div className="sf-loading"><div className="sf-spinner" /></div>;
  if (!store) return <div className="sf-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}><h1 className="sf-notfound-title">Store not found</h1></div>;

  return (
    <div className="sf-shell">
      {/* HEADER (Matches your screenshot) */}
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 40, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>
          {store.name}
        </h1>
        <button onClick={() => setCartOpen(true)} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </button>
      </header>

      {/* BANNER */}
      <div className="sf-banner">
        {store.cover_url ? (
          <img src={store.cover_url} alt={store.name} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--mat)" }} />
        )}
        <div className="sf-banner-overlay" />
        <div className="sf-banner-text">
          <h2 className="sf-banner-tagline">
            {(store as any).tagline || "Discover your new favourites."}
          </h2>
          <button className="sf-banner-cta" onClick={() => document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth" })}>
            Shop Now
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-head-center">
            <p className="sf-section-eyebrow">Explore</p>
            <h2 className="sf-section-title-center">Shop by category</h2>
          </div>
          <div className={`sf-cat-grid sf-cat-count-${Math.min(categories.length, 4)}`}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="sf-cat-tile"
                onClick={() => {
                  setFilterCategory(cat.id);
                  document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {/* 🟢 FIX: Strictly uses the image saved in settings. No fallbacks. */}
                {cat.image ? (
                  <img src={cat.image} alt={cat.label} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--mat)" }} />
                )}
                <div className="sf-cat-tile-overlay" />
                <div className="sf-cat-tile-content">
                  <span className="sf-cat-tile-name">{cat.label}</span>
                  <span className="sf-cat-arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCT GRID */}
      <section id="shop-all" className="sf-section">
        <div className="sf-section-head">
          <div>
            <p className="sf-section-eyebrow">Catalogue</p>
            <h2 className="sf-section-title">Shop all</h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="sf-filter-bar">
          <div className="sf-filter-group">
            <select className="sf-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>

            <select className="sf-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="sf-empty">
            <h3 className="sf-empty-title">No products found</h3>
            <p style={{ color: "var(--muted)" }}>Try changing the filter or category.</p>
          </div>
        ) : (
          <div className="sf-grid-all">
            {displayedProducts.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onClick={() => setSelectedProduct(p)}
                onAddToCart={() => {
                  addToCart(p, 1, undefined, 0);
                  setCartOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* FOOTER (Matches your screenshot) */}
      <footer className="sf-footer">
        <div className="sf-footer-inner">
          <div className="sf-footer-top" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "40px" }}>
             <span className="sf-footer-brand">
                <span className="sf-footer-brand-1">{store.name}</span>
                <span className="sf-footer-brand-dot">.</span>
              </span>
              <p className="sf-footer-bio" style={{ marginTop: "8px" }}>
                {(store as any).tagline || "Quality wears always"}
              </p>
          </div>
          <div className="sf-footer-bot">
            <p className="sf-footer-copyright">© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
            <a href="https://biomart.pages.dev" target="_blank" rel="noreferrer" className="sf-footer-pow">
              Powered by Biomart
            </a>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="sf-floating-wa">
        <svg viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
        </svg>
      </a>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          products={products}
          store={store}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(qty, variant, delta) => addToCart(selectedProduct, qty, variant, delta)}
          onOpenProduct={(p) => setSelectedProduct(p)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
