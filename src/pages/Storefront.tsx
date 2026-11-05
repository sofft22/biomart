import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useStoreContext } from "../context/StoreContext";
import { useCart } from "../context/CartContext";
import { track } from "../lib/api";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import CartDrawer from "../components/CartDrawer";
import type { Product } from "../types";

type SortKey = "new" | "price-asc" | "price-desc" | "name";

function titleCase(s: string): string {
  return (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function splitBrandName(name: string): { first: string; second: string } {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || "", second: "" };
  return { first: parts[0], second: parts.slice(1).join(" ") };
}

function renderHeroTitle(title: string) {
  if (!title) return null;
  const firstSpaceIdx = title.indexOf(" ");
  if (firstSpaceIdx === -1) return <span>{title}</span>;
  const line1 = title.substring(0, firstSpaceIdx);
  const line2 = title.substring(firstSpaceIdx + 1);
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span>{line1}</span>
      <span>{line2}</span>
    </span>
  );
}

export default function Storefront() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { loading, store, products, error } = useStoreContext();
  const cart = useCart();

  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("new");
  const [query, setQuery] = useState("");
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const [headerHidden, setHeaderHidden] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const lastYRef = useRef(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setCategoryOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setItemsPerPage(20);
      else if (window.innerWidth >= 768) setItemsPerPage(15);
      else setItemsPerPage(12);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!slug) return;
    const key = `biomart:tracked:store:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track.storeVisit(slug).catch(() => {});
  }, [slug]);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const last = lastYRef.current;
      const diff = y - last;
      const atTop = y < 40;

      setHeaderSolid(y > 120);
      if (atTop) setHeaderHidden(false);
      else if (diff > 6 && y > 200) setHeaderHidden(true);
      else if (diff < -6) setHeaderHidden(false);

      lastYRef.current = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categoriesList = useMemo(() => {
    const raw = (store as any)?.categories;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return trimmed.split(",").map((c: string) => c.trim()).filter(Boolean);
    }
    return [];
  }, [store]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All") {
      list = list.filter((p) => (p as any).category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    const sorted = [...list];
    switch (sort) {
      case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
      case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
      case "name": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "new":
      default:
        sorted.sort((a, b) => new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime());
        break;
    }
    return sorted;
  }, [products, query, sort, activeCategory]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenProduct = (p: Product) => setOpenProduct(p);
  const handleAddToCart = (product: Product, qty: number, variant: string | null, unitPrice: number) => {
    cart.add(product, qty, variant, unitPrice);
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (loading) return <div className="sf-loading"><div className="sf-spinner" /></div>;
  if (error || !store) return <div className="sf-loading">Store not found</div>;

  const brand = splitBrandName(store.name);
  const tagline = (store as any).tagline || "";
  const heroTitle = (store as any).hero_title || ""; 
  const address = (store as any).address || "";
  const hasCustomBanner = !!store.cover_url;

  const headerClasses = ["sf-head", headerSolid ? "sf-head-solid" : "", !hasCustomBanner ? "sf-head-solid" : "", headerHidden ? "sf-head-hidden" : ""].filter(Boolean).join(" ");

  return (
    <div className="sf-shell">
      {/* PREMIUM HEADER */}
      <header className={headerClasses} style={{ transition: "all 0.3s ease" }}>
        <div className="sf-head-inner" style={{ padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button 
            onClick={scrollToTop} 
            className="sf-wordmark" 
            aria-label={store.name} 
            style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, minWidth: 0, paddingRight: "16px" }}
          >
            {brand.first && <span className="sf-wordmark-1" style={{ fontSize: "clamp(14px, 3.5vw, 18px)", whiteSpace: "nowrap" }}>{titleCase(brand.first)}</span>}
            {brand.second && <span className="sf-wordmark-2" style={{ fontSize: "clamp(14px, 3.5vw, 18px)", whiteSpace: "nowrap" }}>{titleCase(brand.second)}</span>}
          </button>
          <div className="sf-head-actions" style={{ flexShrink: 0 }}>
            <button onClick={() => setCartOpen(true)} className="sf-icon-btn" aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              {cart.count > 0 && <span className="sf-icon-badge">{cart.count > 99 ? "99+" : cart.count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      {hasCustomBanner && (
        <section className="sf-banner" style={{ minHeight: "70vh" }}>
          <img 
            src={store.cover_url!} 
            alt="Banner" 
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} 
          />
          
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          
          <div 
            className="sf-banner-text" 
            style={{ 
              position: "relative", display: "flex", flexDirection: "column", 
              justifyContent: "flex-end", 
              alignItems: "center", height: "100%", 
              paddingBottom: "clamp(60px, 12vw, 100px)", paddingLeft: 24, paddingRight: 24, gap: 24 
            }}
          >
            {heroTitle && (
              <h1 
                style={{ 
                  fontFamily: "'Playfair Display', 'Georgia', serif", 
                  color: "#fff", 
                  fontSize: "clamp(2.5rem, 8vw, 5rem)", 
                  fontWeight: 600, 
                  textAlign: "center", 
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  margin: 0, 
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)", 
                  maxWidth: "900px",
                  // 🟢 FIXED MOTION
                  animationName: "sf-slide-up",
                  animationDuration: "1s",
                  animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  animationFillMode: "both",
                  animationDelay: "0.1s"
                }}
              >
                {renderHeroTitle(heroTitle)}
              </h1>
            )}
            
            <button 
              onClick={() => scrollTo("shop-all")} 
              className="sf-banner-cta" 
              style={{ 
                background: "#fff", color: "#000", padding: "16px 32px", 
                fontSize: "13px", letterSpacing: "0.05em", fontWeight: 600, flexShrink: 0, marginTop: 16,
                // 🟢 FIXED MOTION
                animationName: "sf-slide-up",
                animationDuration: "1s",
                animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                animationFillMode: "both",
                animationDelay: "0.3s"
              }}
            >
              SHOP NOW 
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8, width: 16, height: 16 }}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* SHOP ALL SECTION */}
      <section className="sf-section" id="shop-all" style={{ paddingTop: hasCustomBanner ? "100px" : "120px" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", gap: 12, marginBottom: 32 }}>
          
          <div ref={categoryRef} style={{ position: "relative", flex: "1 1 auto", minWidth: 0 }}>
            <button 
              onClick={() => setCategoryOpen(!categoryOpen)}
              style={{ background: "transparent", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <h2 className="sf-section-title" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                {query ? `Search` : activeCategory === "All" ? "Shop all" : activeCategory}
              </h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, opacity: 0.5 }}>
                <path d={categoryOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>

            {categoryOpen && categoriesList.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 12, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", minWidth: 200, zIndex: 50, overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
                  {["All", ...categoriesList].map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setCurrentPage(1); setCategoryOpen(false); setQuery(""); }}
                      style={{ padding: "12px 20px", textAlign: "left", background: activeCategory === cat && !query ? "var(--soft)" : "transparent", border: "none", fontSize: 14, fontWeight: activeCategory === cat && !query ? 600 : 500, color: "var(--text)", cursor: "pointer" }}
                    >
                      {cat === "All" ? "Shop All" : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
            
            <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: "transparent", border: "none", padding: 6, cursor: "pointer", color: "var(--text)", display: "flex" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </button>

            <div ref={sortRef} style={{ position: "relative" }}>
              <button 
                onClick={() => setSortOpen(!sortOpen)}
                style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: "100px", padding: 6, width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                  <path d="M3 6h18M6 12h12M10 18h4" />
                </svg>
              </button>

              {sortOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 12, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", minWidth: 160, zIndex: 50, overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
                    {[
                      { key: "new", label: "Newest" },
                      { key: "price-asc", label: "Price: Low to High" },
                      { key: "price-desc", label: "Price: High to Low" },
                      { key: "name", label: "Name: A-Z" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSort(opt.key as SortKey); setCurrentPage(1); setSortOpen(false); }}
                        style={{ padding: "12px 20px", textAlign: "left", background: sort === opt.key ? "var(--soft)" : "transparent", border: "none", fontSize: 13, fontWeight: sort === opt.key ? 600 : 500, color: "var(--text)", cursor: "pointer" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {searchOpen && (
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 12, background: "var(--soft)", padding: "10px 16px", borderRadius: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, opacity: 0.5 }}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input 
              type="search" 
              value={query} 
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} 
              placeholder="Search products…" 
              autoFocus 
              style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: 14, color: "var(--text)" }}
            />
            <button onClick={() => { setSearchOpen(false); setQuery(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>Cancel</button>
          </div>
        )}

        {paginatedProducts.length === 0 ? (
          <div className="sf-empty"><h3 className="sf-empty-title">Nothing here yet</h3></div>
        ) : (
          <>
            <div className="sf-grid-all" style={{ gap: "64px 20px" }}>
              {paginatedProducts.map((p, i) => (
                <div 
                  key={p.id} 
                  // 🟢 FIXED MOTION (Explicit properties)
                  style={{ 
                    animationName: "sf-rise",
                    animationDuration: "0.8s",
                    animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    animationFillMode: "both",
                    animationDelay: `${Math.min(i * 0.05, 0.4)}s`
                  }}
                >
                  <ProductCard 
                    product={p} 
                    index={i} 
                    priority={i < 4} 
                    onClick={() => handleOpenProduct(p)} 
                    onAddToCart={() => handleAddToCart(p, 1, null, p.price)} 
                  />
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="sf-pagination" style={{ marginTop: 56 }}>
                <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollTo("shop-all"); }}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollTo("shop-all"); }}>Next</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 🟢 PREMIUM EDITORIAL FOOTER (Left-aligned Mobile, 3-col Desktop) */}
      <footer className="sf-footer" id="contact" style={{ paddingTop: "64px", paddingBottom: "32px" }}>
        <div className="sf-footer-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          
          <div className="sf-footer-top" style={{ display: "grid", gap: "48px", paddingBottom: "64px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            
            {/* Brand Column */}
            <div className="sf-footer-brand-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
              <div className="sf-footer-brand" style={{ marginBottom: 12, display: "flex", justifyContent: "flex-start", gap: 6 }}>
                {brand.first && <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#fff" }}>{titleCase(brand.first)}</span>}
                {brand.second && <span style={{ fontSize: 24, fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>{titleCase(brand.second)}</span>}
              </div>
              <p className="sf-footer-bio" style={{ maxWidth: 300, margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
                {tagline || "Curated essentials for the modern wardrobe."}
              </p>
            </div>

            {/* Mobile Links Grid (2 columns) */}
            <div className="sf-footer-mobile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", width: "100%" }}>
              <div>
                <h4 style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Navigation</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <a href="#shop-all" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Signature Treats</a>
                  <a href="#shop-all" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Categories</a>
                </div>
              </div>
              <div>
                <h4 style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Socials</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {store.tiktok && <a href={`https://tiktok.com/@${store.tiktok}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>TikTok</a>}
                  {store.whatsapp && <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>WhatsApp</a>}
                  {store.instagram && <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Instagram</a>}
                </div>
              </div>
              <div>
                <h4 style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Legal</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <a href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Terms & Conditions</a>
                  <a href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Privacy Policy</a>
                </div>
              </div>
              {address && (
                <div>
                  <h4 style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>Location</h4>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14, lineHeight: 1.5, display: "block" }}>
                    {address}
                  </a>
                </div>
              )}
            </div>

            {/* Desktop Links Grid (3 columns) */}
            <div className="sf-footer-desktop-cols" style={{ display: "none" }}>
              <div>
                <h4 className="sf-footer-h" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Navigation</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <a href="#shop-all" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Signature Treats</a>
                  <a href="#shop-all" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Categories</a>
                </div>
              </div>
              <div>
                <h4 className="sf-footer-h" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Socials</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {store.tiktok && <a href={`https://tiktok.com/@${store.tiktok}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>TikTok</a>}
                  {store.whatsapp && <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>WhatsApp</a>}
                  {store.instagram && <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Instagram</a>}
                </div>
              </div>
              <div>
                <h4 className="sf-footer-h" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>Legal</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <a href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Terms & Conditions</a>
                  <a href="#" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>Privacy Policy</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="sf-footer-bot" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 24, fontSize: 13, color: "rgba(255,255,255,0.4)", width: "100%" }}>
            <span>© 2026 {titleCase(store.name)}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <a href="https://biomart.pages.dev" target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}>
                <svg viewBox="0 0 60 64" width="16" height="16" fill="none" stroke="#25D366" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"><path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" /><path d="M20 26V14A10 10 0 0 1 40 14V26" /></svg>
                Powered by biomart
              </a>
              <button 
                onClick={scrollToTop} 
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "inherit", display: "flex", alignItems: "center", gap: 6 }}
              >
                Back to top
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </button>
            </div>
          </div>

          {/* CSS Overrides for Responsive Footer */}
          <style>{`
            @media (min-width: 768px) {
              .sf-footer-top {
                grid-template-columns: 1fr 2fr !important;
                gap: 80px !important;
              }
              .sf-footer-brand-col {
                align-items: flex-start !important;
                text-align: left !important;
              }
              .sf-footer-brand {
                justify-content: flex-start !important;
              }
              .sf-footer-mobile-grid {
                display: none !important;
              }
              .sf-footer-desktop-cols {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr);
                gap: 32px;
              }
            }
          `}</style>
        </div>
      </footer>

      {openProduct && (
        <ProductModal 
          product={openProduct} products={products} store={store} 
          onClose={() => setOpenProduct(null)} 
          onAddToCart={(qty, variant, priceDelta) => { handleAddToCart(openProduct, qty, variant ?? null, openProduct.price + (priceDelta ?? 0)); }} 
          onOpenProduct={(p) => handleOpenProduct(p)} 
        />
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
