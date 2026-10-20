import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import PlanCard from "../components/PlanCard";

export default function Overview() {
  const { user, store, products, limits, loading } = useAuth();
  const toast = useToast();
  const [qrOpen, setQrOpen] = useState(false);

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

  // 🟢 CALCULATE REAL NUMBERS FROM PRODUCTS
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalPhotos = products.reduce((sum, p) => sum + (p.images?.length || 0), 0);

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.show("Link copied");
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="dash-head" style={{ padding: 0, marginBottom: 48 }}>
        <p className="dash-head-eyebrow">Overview</p>
        <h1 className="dash-title">Hey, <em>{store.name || "there"}</em>.</h1>
        <p className="dash-head-lead">Everything you need to run your store.</p>
      </div>

      {/* HERO STATS (No heavy card, just clean typography) */}
      <div style={{ marginBottom: 56 }}>
        <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
          Catalogue value
        </p>
        <p style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          ₦{totalValue.toLocaleString()}
        </p>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
          Total value of all your products
        </p>
      </div>

      {/* STATS ROW (Clean, minimal) */}
      <div style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: 56 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
            Products live
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            {products.length}
            {productCap < 100000 && <span style={{ fontSize: 18, color: "var(--muted)", fontWeight: 400 }}> / {productCap}</span>}
          </p>
          
          {productCap < 100000 && (
            <div style={{ height: 4, background: "var(--line)", borderRadius: 99, marginTop: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--green)", width: `${usage}%`, borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
          )}
          {atCap && (
            <p style={{ fontSize: 13, color: "var(--red)", marginTop: 8 }}>
              At limit · <Link to="/plan" style={{ textDecoration: "underline" }}>Upgrade</Link>
            </p>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
            Total photos
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{totalPhotos}</p>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Images uploaded</p>
        </div>
      </div>

      {/* PLAN CARD (Timer) */}
      <div style={{ marginBottom: 56 }}>
        <PlanCard />
      </div>

      {/* STORE LINK (Clean row) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "20px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 56, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, margin: "0 0 4px" }}>Your store link</p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, wordBreak: "break-all" }}>{storeUrl}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copyLink} className="dash-btn dash-btn-line">Copy</button>
          <button onClick={() => setQrOpen(true)} className="dash-btn dash-btn-line">QR</button>
          <a href={storeUrl} target="_blank" rel="noopener" className="dash-btn dash-btn-dark">View store</a>
        </div>
      </div>

      {/* QUICK ACTIONS (Grid, clean borders) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <Link to="/dashboard/product" style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 12, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)", transition: "background 0.2s ease" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "var(--soft)", color: "var(--ink)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Add product</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>New item to your catalogue</small>
          </span>
        </Link>

        <a
          href={`https://wa.me/?text=${encodeURIComponent("Check out my store: " + storeUrl)}`}
          target="_blank"
          rel="noopener"
          style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 12, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)", transition: "background 0.2s ease" }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "var(--soft)", color: "var(--ink)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Share on WhatsApp</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>Send your store link</small>
          </span>
        </a>

        <Link to="/settings" style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 12, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)", transition: "background 0.2s ease" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "var(--soft)", color: "var(--ink)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Store settings</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>Name, WhatsApp, link</small>
          </span>
        </Link>
      </div>

      {/* QR MODAL */}
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
