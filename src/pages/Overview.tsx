import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import PlanCard from "../components/PlanCard";

export default function Overview() {
  const { user, store, products, limits, loading } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [qrOpen, setQrOpen] = useState(false);

  if (loading) {
    return (
      <div className="dash-shell dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }
  if (!user || !store) return null;

  const storeUrl = `${location.origin}/${store.slug}`;

  // 🟢 LIMIT CALCULATIONS
  const productCap = limits?.products ?? 5;
  const atCap = productCap < 100000 && products.length >= productCap;

  // 🟢 ONBOARDING LOGIC
  const hasWhatsapp = !!store.whatsapp;
  const hasDetails = !!store.tagline && !!(store as any).categories;
  const hasBanner = !!(store as any).cover_url;
  const hasProducts = products.length > 0;

  const isStoreReady = hasWhatsapp && hasDetails && hasBanner && hasProducts;
  const completedSteps = [hasWhatsapp, hasDetails, hasBanner, hasProducts].filter(Boolean).length;

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

      {/* 🟢 TOP GRID (ONLY PRODUCTS STAT NOW) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 32 }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, margin: "0 0 4px" }}>Products listed</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <p style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1, color: atCap ? "var(--danger)" : "var(--ink)" }}>
                {products.length}
              </p>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)", margin: 0 }}>
                / {productCap < 100000 ? productCap : "∞"}
              </p>
            </div>
          </div>
          {atCap && (
            <Link to="/plan" className="dash-btn dash-btn-dark" style={{ padding: "8px 16px", fontSize: 12 }}>
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* 🟢 ONBOARDING CHECKLIST */}
      {!isStoreReady && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--green)", borderRadius: 16, padding: 32, marginBottom: 32, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: `${(completedSteps / 4) * 100}%`, height: 4, background: "var(--green)", transition: "width 0.5s ease" }} />
          
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>Complete your setup 🚀</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 24px" }}>Follow these steps to get your store ready for customers.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Step 1: WhatsApp */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: hasWhatsapp ? "var(--soft)" : "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, opacity: hasWhatsapp ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: hasWhatsapp ? "var(--green)" : "transparent", border: hasWhatsapp ? "none" : "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {hasWhatsapp && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textDecoration: hasWhatsapp ? "line-through" : "none" }}>Add WhatsApp Number</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>So customers can place orders.</p>
                </div>
              </div>
              {!hasWhatsapp && <button onClick={() => nav("/settings?edit=true&scroll=whatsapp")} className="dash-btn dash-btn-dark" style={{ padding: "8px 16px", fontSize: 12 }}>Add Number</button>}
            </div>

            {/* Step 2: Store Details */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: hasDetails ? "var(--soft)" : "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, opacity: hasDetails ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: hasDetails ? "var(--green)" : "transparent", border: hasDetails ? "none" : "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {hasDetails && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textDecoration: hasDetails ? "line-through" : "none" }}>Store Details & Categories</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Add a tagline and organize your products.</p>
                </div>
              </div>
              {!hasDetails && <button onClick={() => nav("/settings?edit=true&scroll=details")} className="dash-btn dash-btn-dark" style={{ padding: "8px 16px", fontSize: 12 }}>Add Details</button>}
            </div>

            {/* Step 3: Banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: hasBanner ? "var(--soft)" : "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, opacity: hasBanner ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: hasBanner ? "var(--green)" : "transparent", border: hasBanner ? "none" : "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {hasBanner && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textDecoration: hasBanner ? "line-through" : "none" }}>Upload a Banner</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Make your store look premium.</p>
                </div>
              </div>
              {!hasBanner && <button onClick={() => nav("/settings?edit=true&scroll=banners")} className="dash-btn dash-btn-dark" style={{ padding: "8px 16px", fontSize: 12 }}>Upload Banner</button>}
            </div>

            {/* Step 4: Product */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: hasProducts ? "var(--soft)" : "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, opacity: hasProducts ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: hasProducts ? "var(--green)" : "transparent", border: hasProducts ? "none" : "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {hasProducts && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0, textDecoration: hasProducts ? "line-through" : "none" }}>Add your first product</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Your store needs something to sell.</p>
                </div>
              </div>
              {!hasProducts && <button onClick={() => nav("/dashboard/product")} className="dash-btn dash-btn-dark" style={{ padding: "8px 16px", fontSize: 12 }}>Add Product</button>}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 LIVE BANNER WITH INTEGRATED STORE LINK */}
      {isStoreReady && (
        <div style={{ background: "var(--green)", color: "#fff", borderRadius: 16, padding: "24px 32px", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Your store is live! 🎉</h2>
              <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>You are ready to start receiving orders.</p>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setQrOpen(true)} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}>
                QR Code
              </button>
              <a href={storeUrl} target="_blank" rel="noopener" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                View ↗
              </a>
            </div>
          </div>

          {/* Integrated Link Bar */}
          <div style={{ marginTop: 24, background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{storeUrl}</p>
            <button onClick={copyLink} style={{ background: "#fff", color: "var(--green)", border: 0, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Copy Link
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 48 }}>
        <PlanCard />
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
