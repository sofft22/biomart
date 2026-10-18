import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import PlanCard from "../components/PlanCard";

export default function Overview() {
  const { user, store, products, limits, loading } = useAuth();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (loading) {
    return (
      <div className="dash-shell dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }
  if (!user || !store) return null;

  const productCap = limits?.products ?? 5;
  const usage = productCap < 100000 ? Math.min(100, (products.length / productCap) * 100) : 0;
  const atCap = productCap < 100000 && products.length >= productCap;

  const storeUrl = `${location.origin}/store/${store.slug}`;

  // 🟢 CALCULATE REAL NUMBERS
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const outOfStock = products.filter(p => !(p as any).inStock && !(p as any).in_stock).length;

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.show("Link copied");
  };

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Overview</p>
        <h1 className="dash-title">Hey, <em>{store.name || "there"}</em>.</h1>
        <p className="dash-head-lead">Everything you need to run your store.</p>
      </div>

      {/* ── HERO CARD (Store Value & Products) ── */}
      <div className="ov-hero-card">
        <div className="ov-hero-left">
          <p className="ov-hero-label">Catalogue value</p>
          <p className="ov-hero-value">₦{totalValue.toLocaleString()}</p>
          <p className="ov-hero-hint">Total value of all your products</p>
        </div>
      </div>

      {/* ── STATS (2 Columns) ── */}
      <div className="ov-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="ov-stat">
          <p className="ov-stat-label">Products live</p>
          <p className="ov-stat-value">
            {products.length}
            {productCap < 100000 && <span className="ov-stat-cap"> / {productCap}</span>}
          </p>
          {productCap < 100000 && (
            <div className="ov-usage">
              <div className="ov-usage-fill" style={{ width: `${usage}%` }} />
            </div>
          )}
          {atCap && (
            <p className="ov-stat-warn">At limit · <Link to="/plan">Upgrade</Link></p>
          )}
        </div>

        <div className="ov-stat">
          <p className="ov-stat-label">Out of stock</p>
          <p className="ov-stat-value" style={{ color: outOfStock > 0 ? "var(--danger)" : "inherit" }}>
            {outOfStock}
          </p>
          <p className="ov-stat-hint">Products needing restock</p>
        </div>
      </div>

      {/* ── PLAN CARD ── */}
      <PlanCard />

      {/* ── STORE LINK ── */}
      <div className="ov-share">
        <div className="ov-share-info">
          <p className="ov-share-label">Your store link</p>
          <p className="ov-share-url">{storeUrl}</p>
        </div>
        <div className="ov-share-actions">
          <button onClick={copyLink} className="dash-btn dash-btn-line">Copy</button>
          <button onClick={() => setQrOpen(true)} className="dash-btn dash-btn-line">QR</button>
          <a href={storeUrl} target="_blank" rel="noopener" className="dash-btn dash-btn-dark">View store</a>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="ov-quick">
        <Link to="/dashboard/product" className="ov-quick-btn">
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <span>
            <b>Add product</b>
            <small>New item to your catalogue</small>
          </span>
        </Link>

        <a
          href={`https://wa.me/?text=${encodeURIComponent("Check out my store: " + storeUrl)}`}
          target="_blank"
          rel="noopener"
          className="ov-quick-btn"
        >
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/></svg>
          </span>
          <span>
            <b>Share on WhatsApp</b>
            <small>Send your store link</small>
          </span>
        </a>

        <Link to="/settings" className="ov-quick-btn">
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
          </span>
          <span>
            <b>Store settings</b>
            <small>Name, WhatsApp, link</small>
          </span>
        </Link>
      </div>

      {/* ── QR MODAL ── */}
      {qrOpen && (
        <div
          className="ov-qr-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setQrOpen(false); }}
        >
          <div className="ov-qr-modal">
            <button className="ov-qr-close" onClick={() => setQrOpen(false)} aria-label="Close">×</button>
            <p className="ov-qr-eyebrow">Your store</p>
            <h3 className="ov-qr-title">Scan to open</h3>
            <div className="ov-qr-image">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&color=1A1A1A&bgcolor=FBF9F5&data=${encodeURIComponent(storeUrl)}`}
                width={280}
                height={280}
                alt="Store QR code"
              />
            </div>
            <p className="ov-qr-url">{storeUrl}</p>
            <p className="ov-qr-hint">Print on flyers, cards, or your stall.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
