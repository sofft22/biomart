import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { PLAN_PRICES_MONTHLY, PLAN_PRICES_QUARTERLY } from "../lib/plans";

export default function Plan() {
  const { store } = useAuth();
  const [isQuarterly, setIsQuarterly] = useState(false);

  const currentPlan = store?.plan || "free";
  const storeSlug = store?.slug || "my-store";
  const whatsappNumber = store?.whatsapp?.replace(/\D/g, "") || "";

  const getWhatsAppLink = (planName: string) => {
    const cycle = isQuarterly ? "Quarterly" : "Monthly";
    const text = `Hi, I'd like to upgrade my store (${storeSlug}) to the ${planName} (${cycle}) plan. Please send me the payment details.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Billing</p>
        <h1 className="dash-title">Upgrade your <em>store</em>.</h1>
        <p className="dash-head-lead">Choose a plan that fits your business.</p>
      </div>

      {/* 🟢 MONTHLY / QUARTERLY TOGGLE */}
      <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
        <div style={{ 
          display: "inline-flex", 
          background: "var(--soft)", 
          padding: 4, 
          borderRadius: 99,
          border: "1px solid var(--line)"
        }}>
          <button
            onClick={() => setIsQuarterly(false)}
            style={{
              padding: "10px 24px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              border: 0,
              cursor: "pointer",
              background: !isQuarterly ? "var(--bg)" : "transparent",
              color: !isQuarterly ? "var(--ink)" : "var(--muted)",
              boxShadow: !isQuarterly ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsQuarterly(true)}
            style={{
              padding: "10px 24px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              border: 0,
              cursor: "pointer",
              background: isQuarterly ? "var(--bg)" : "transparent",
              color: isQuarterly ? "var(--ink)" : "var(--muted)",
              boxShadow: isQuarterly ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            Quarterly
            <span style={{ background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 99, fontSize: 10 }}>
              Save 8%
            </span>
          </button>
        </div>
      </div>

      {/* 🟢 PRICING GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
        
        {/* FREE PLAN */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Free</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 24px" }}>For testing the waters.</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 24px" }}>₦0</p>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
            <li>✅ 5 products</li>
            <li>✅ 1 photo per product</li>
            <li>❌ No variants</li>
          </ul>

          <button disabled className="dash-btn dash-btn-line" style={{ marginTop: "auto", width: "100%" }}>
            {currentPlan === "free" ? "Current Plan" : "Basic"}
          </button>
        </div>

        {/* STARTER PLAN */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Starter</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 24px" }}>For the casual seller.</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 24px" }}>
            ₦{isQuarterly ? PLAN_PRICES_QUARTERLY.starter.toLocaleString() : PLAN_PRICES_MONTHLY.starter.toLocaleString()}
            <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 400 }}>
              /{isQuarterly ? "3mo" : "mo"}
            </span>
          </p>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
            <li>✅ 15 products</li>
            <li>✅ 3 photos per product</li>
            <li>❌ No variants</li>
          </ul>

          <a href={getWhatsAppLink("Starter")} target="_blank" rel="noopener" className="dash-btn dash-btn-line" style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {currentPlan === "starter" ? "Renew Plan" : "Upgrade to Starter"}
          </a>
        </div>

        {/* PRO PLAN (Highlighted) */}
        <div style={{ background: "var(--ink)", border: "1px solid var(--ink)", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 16, right: 16, background: "var(--green)", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>MOST POPULAR</div>
          
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Pro</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>For serious brands.</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 24px", color: "#fff" }}>
            ₦{isQuarterly ? PLAN_PRICES_QUARTERLY.pro.toLocaleString() : PLAN_PRICES_MONTHLY.pro.toLocaleString()}
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
              /{isQuarterly ? "3mo" : "mo"}
            </span>
          </p>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
            <li>✅ Unlimited products</li>
            <li>✅ 10 photos per product</li>
            <li>✅ Product variants</li>
          </ul>

          <a href={getWhatsAppLink("Pro")} target="_blank" rel="noopener" className="dash-btn" style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--green)", color: "#fff" }}>
            {currentPlan === "pro" ? "Renew Plan" : "Upgrade to Pro"}
          </a>
        </div>

      </div>

      {/* 🟢 CUSTOM PLAN */}
      <div style={{ background: "var(--soft)", border: "1px dashed var(--line)", borderRadius: 16, padding: 32, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Need a custom e-commerce site?</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, maxWidth: 500 }}>
            Get a fully custom website with your own domain, advanced checkout, and dedicated support. Let's build it together.
          </p>
        </div>
        <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi, I'm interested in a Custom E-commerce website.")}`} target="_blank" rel="noopener" className="dash-btn dash-btn-dark" style={{ padding: "14px 24px" }}>
          Contact Sales
        </a>
      </div>

    </DashboardLayout>
  );
}
