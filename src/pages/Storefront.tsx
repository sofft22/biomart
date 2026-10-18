import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useStoreContext } from "../context/StoreContext";
import { useCart } from "../context/CartContext";
import { track } from "../lib/api";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import CartDrawer from "../components/CartDrawer";
import { getCategoryLabel } from "../lib/categories";
import { getCategories, getCategoryImages } from "../lib/storeData";
import { naira } from "../lib/format";
import type { Category, Product } from "../types";

type SortKey = "new" | "price-asc" | "price-desc" | "name";

function titleCase(s: string): string {
  return (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function splitBrandName(name: string): { first: string; second: string } {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || "", second: "" };
  return { first: parts[0], second: parts.slice(1).join(" ") };
}

function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    let mounted = true;
    const io = ("IntersectionObserver" in window)
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add("in");
                io.unobserve(entry.target);
              }
            }
          },
          { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
        )
      : null;

    const scan = () => {
      if (!mounted) return;
      const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)");
      if (!io) {
        els.forEach((el) => el.classList.add("in"));
        return;
      }
      els.forEach((el) => io.observe(el));
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mounted = false;
      io?.disconnect();
      mo.disconnect();
    };
  }, deps);
}

export default function Storefront() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { loading, store, products, error } = useStoreContext();
  const cart = useCart();

  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [headerHidden, setHeaderHidden] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [categoryTick, setCategoryTick] = useState(0);
  const lastYRef = useRef(0);

  // 🟢 SLIDER STATE
  const [currentSlide, setCurrentSlide] = useState(0);
  const bannerImages = [
    store?.cover_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=85",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=85"
  ];

  // 🟢 PAGINATION STATE (10/15/20)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setItemsPerPage(20); // Desktop
      else if (window.innerWidth >= 768) setItemsPerPage(15); // Tablet
      else setItemsPerPage(10); // Mobile
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🟢 AUTO-SLIDE
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  useEffect(() => {
    if (!slug) return;
    const key = `biomart:tracked:store:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track.storeVisit(slug).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setCategories(getCategories(slug));
    setCategoryImages(getCategoryImages(slug));
  }, [slug, categoryTick]);

  useEffect(() => {
    const onFocus = () => setCategoryTick((t) => t + 1);
    const onVisible = () => {
      if (document.visibilityState === "visible") setCategoryTick((t) => t + 1);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

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

  useReveal([products.length, categories.length, activeCategory, sort, query, currentPage]);

  const usedCategories = useMemo(() => {
    const uniqueCats = new Map<string, Category>();
    for (const p of products) {
      const cid = (p as any).category_id || (p as any).category;
      if (cid && !uniqueCats.has(cid)) {
        const existingCat = categories.find((c) => c.id === cid);
        uniqueCats.set(cid, { id: cid, label: existingCat?.label || cid, sort_order: 0 });
      }
    }
    if (uniqueCats.size === 0 && categories.length > 0) return categories;
    return Array.from(uniqueCats.values());
  }, [categories, products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") {
      list = list.filter((p) => ((p as any).category_id || (p as any).category) === activeCategory);
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
  }, [products, activeCategory, query, sort]);

  // 🟢 PAGINATION SLICE
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenProduct = (p: Product) => setOpenProduct(p);
  const handleAddToCart = (product: Product, qty: number, variant: string | null, unitPrice: number) => {
    cart.add(product, qty, variant, unitPrice);
    setCartOpen(true);
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) return <div className="sf-loading"><div className="sf-spinner" /></div>;
  if (error || !store) return <div className="sf-loading">Store not found</div>;

  const brand = splitBrandName(store.name);
  const tagline = (store as any).tagline || "";
  const address = (store as any).address || "";

  const headerClasses = ["sf-head", headerSolid ? "sf-head-solid" : "", headerHidden ? "sf-head-hidden" : "", searchOpen ? "sf-head-searching" : ""].filter(Boolean).join(" ");

  return (
    <div className="sf-shell">
      {/* ═══ HEADER ═══ */}
      <header className={headerClasses}>
        <div className="sf-head-inner">
          {!searchOpen && (
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="sf-wordmark" aria-label={store.name}>
              {brand.first && <span className="sf-wordmark-1">{titleCase(brand.first)}</span>}
              {brand.second && <span className="sf-wordmark-2">{titleCase(brand.second)}</span>}
              {brand.first && <span className="sf-wordmark-dot">.</span>}
            </button>
          )}
          <div className={`sf-head-searchbar ${searchOpen ? "open" : ""}`}>
            {searchOpen && (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} placeholder="Search products…" autoFocus />
              </>
            )}
          </div>
          {!searchOpen && <div className="sf-head-spacer" />}
          {!searchOpen && (
            <nav className="sf-head-links">
              <button onClick={() => scrollTo("categories")}>Categories</button>
              <button onClick={() => scrollTo("shop-all")}>Shop all</button>
            </nav>
          )}
          <div className="sf-head-actions">
            <button onClick={() => setSearchOpen(!searchOpen)} className="sf-icon-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </button>
            {!searchOpen && (
              <button onClick={() => setCartOpen(true)} className="sf-icon-btn" aria-label="Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                {cart.count > 0 && <span className="sf-icon-badge">{cart.count > 99 ? "99+" : cart.count}</span>}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══ AUTO-SLIDER BANNER ═══ */}
      <section className="sf-banner">
        {bannerImages.map((img, i) => (
          <img key={i} src={img} alt="Banner" style={{ opacity: i === currentSlide ? 1 : 0, transition: 'opacity 0.8s ease' }} />
        ))}
        <div className="sf-banner-overlay" />
        <div className="sf-banner-text">
          <h1 className="sf-banner-tagline">{tagline || titleCase(store.name)}</h1>
          <button onClick={() => scrollTo("shop-all")} className="sf-banner-cta">
            Shop now <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      {usedCategories.length > 0 && (
        <section className="sf-section" id="categories">
          <div className="sf-section-head-center">
            <span className="sf-section-eyebrow">Explore</span>
            <h2 className="sf-section-title-center">Shop by category</h2>
          </div>
          <div className="sf-cat-grid">
            {usedCategories.map((c, i) => {
              const img = categoryImages[c.id] || products.find(p => (p.category_id || p.category) === c.id)?.image_url;
              const active = activeCategory === c.id;
              return (
                <button key={c.id} onClick={() => { setActiveCategory(active ? "all" : c.id); setCurrentPage(1); scrollTo("shop-all"); }} className={`sf-cat-tile ${active ? "on" : ""}`}>
                  {img ? <img src={img} alt={c.label} loading="lazy" /> : <div className="sf-cat-tile-placeholder">{c.label.charAt(0)}</div>}
                  <div className="sf-cat-tile-overlay" />
                  <div className="sf-cat-tile-content">
                    <div className="sf-cat-tile-name">{titleCase(c.label)}</div>
                    <span className="sf-cat-arrow">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ SHOP ALL (With 5-row pagination) ═══ */}
      <section className="sf-section" id="shop-all">
        <div className="sf-section-head">
          <div>
            <h2 className="sf-section-title">{activeCategory === "all" ? (query ? `Results for "${query}"` : "Shop all") : titleCase(getCategoryLabel(categories, activeCategory))}</h2>
          </div>
        </div>

        {paginatedProducts.length === 0 ? (
          <div className="sf-empty"><h3 className="sf-empty-title">Nothing here yet</h3></div>
        ) : (
          <>
            <div className="sf-grid-all">
              {paginatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} priority={i < 4} onClick={() => handleOpenProduct(p)} onAddToCart={() => handleAddToCart(p, 1, null, p.price)} />
              ))}
            </div>
            
            {/* 🟢 PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="sf-pagination">
                <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollTo("shop-all"); }}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); scrollTo("shop-all"); }}>Next</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="sf-footer" id="contact">
        <div className="sf-footer-inner">
          <div className="sf-footer-top">
            <div className="sf-footer-brand-col">
              <div className="sf-footer-brand">
                {brand.first && <span className="sf-footer-brand-1">{titleCase(brand.first)}</span>}
                {brand.second && <span className="sf-footer-brand-2">{titleCase(brand.second)}</span>}
                {brand.first && <span className="sf-footer-brand-dot">.</span>}
              </div>
              <p className="sf-footer-bio">{tagline || "Curated essentials for the modern wardrobe."}</p>
            </div>
            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Shop</h4>
              <ul>
                <li><button onClick={() => scrollTo("categories")}>Categories</button></li>
                <li><button onClick={() => scrollTo("shop-all")}>Shop all</button></li>
              </ul>
            </div>
            <div className="sf-footer-col">
              <h4 className="sf-footer-h">Contact</h4>
              <button onClick={() => window.open(`https://wa.me/${store.whatsapp}?text=Hi, I'm interested in your products.`, '_blank')} className="sf-wa-button">
                Chat on WhatsApp
              </button>
              {address && <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>{address}</p>}
            </div>
          </div>
          <div className="sf-footer-bot">
            <span className="sf-footer-copyright">© 2026 {titleCase(store.name)}</span>
            <a href="https://biomart.com" target="_blank" rel="noopener" className="sf-footer-pow">
              <svg viewBox="0 0 60 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"><path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" /><path d="M20 26V14A10 10 0 0 1 40 14V26" /></svg>
              Powered by biomart
            </a>
          </div>
        </div>
      </footer>

      {openProduct && (
        <ProductModal product={openProduct} products={products} store={store} onClose={() => setOpenProduct(null)} onAddToCart={(qty, variant, priceDelta) => handleAddToCart(openProduct, qty, variant ?? null, openProduct.price + (priceDelta ?? 0))} onOpenProduct={(p) => handleOpenProduct(p)} />
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
