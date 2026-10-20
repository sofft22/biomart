import { useState } from "react";
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

  // Calculations
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const productCap = limits?.products ?? 5;
  const atCap = productCap < 100000 && products.length >= productCap;
  const storeUrl = `${location.origin}/store/${store.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.show("Link copied");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="dash-head" style={{ padding: 0, marginBottom: 32 }}>
        <p className="dash-head-eyebrow">Overview</p>
        <h1 className="dash-title">Hey, <em>{store.name || "there"}</em>.</h1>
      </div>

      {/* 75/25 GRID - REDUCED HEIGHT */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: 20, 
        marginBottom: 48 
      }}>
        
        {/* CARD 1: GREEN - 75% Width */}
        <div style={{ 
          background: "var(--green)", 
          color: "#fff", 
          borderRadius: 20, 
          padding: "32px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center" 
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8, margin: "0 0 8px" }}>
            Catalogue Value
          </p>
          <p style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            ₦{totalValue.toLocaleString()}
          </p>
        </div>

        {/* CARD 2: WHITE - 25% Width */}
        <div style={{ 
          background: "var(--bg)", 
          border: "1px solid var(--line)", 
          borderRadius: 20, 
          padding: "32px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center" 
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Products
          </p>
          <p style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {products.length}
            {productCap < 100000 && <span style={{ fontSize: "clamp(18px, 3vw, 24px)", color: "var(--muted)", fontWeight: 500 }}> / {productCap}</span>}
          </p>
          {atCap && (
            <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 8, fontWeight: 500 }}>
              Limit. <Link to="/plan" style={{ color: "var(--ink)", fontWeight: 700 }}>Upgrade</Link>
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <PlanCard />
      </div>

      {/* STORE LINK */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 48, flexWrap: "wrap" }}>
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

      {/* QUICK ACTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <Link to="/dashboard/product" style={{ padding: 20, border: "1px solid var(--line)", borderRadius: 16, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "var(--green)", color: "#fff" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 16, fontWeight: 600 }}>Add product</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>New item</small>
          </span>
        </Link>

        <a href={`https://wa.me/?text=${encodeURIComponent("Check out my store: " + storeUrl)}`} target="_blank" rel="noopener" style={{ padding: 20, border: "1px solid var(--line)", borderRadius: 16, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "var(--green)", color: "#fff" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 16, fontWeight: 600 }}>Share</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>WhatsApp</small>
          </span>
        </a>

        <Link to="/settings" style={{ padding: 20, border: "1px solid var(--line)", borderRadius: 16, display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", background: "var(--bg)" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 12, background: "var(--green)", color: "#fff" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
          </span>
          <span>
            <b style={{ display: "block", fontSize: 16, fontWeight: 600 }}>Settings</b>
            <small style={{ fontSize: 13, color: "var(--muted)" }}>Store info</small>
          </span>
        </Link>
      </div>

      {/* QR MODAL */}
      {qrOpen && (
        <div className="ov-qr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setQrOpen(false); }}>
          <div className="ov-qr-modal">
            <button className="ov-qr-close" onClick={() => setQrOpen(false)} aria-label="Close">×</button>
            <p className="ov-qr-eyebrow">Your store</p>
            <h3 className="ov-qr-title">Scan to open</h3>
            <div className="ov-qr-image">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&color=1A1A1A&bgcolor=FBF9F5&data=${encodeURIComponent(storeUrl)}`} width={280} height={280} alt="Store QR code" />
            </div>
            <p className="ov-qr-url">{storeUrl}</p>
            <p className="ov-qr-hint">Print on flyers, cards, or your stall.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
