import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { PLAN_PRICES_MONTHLY, PLAN_PRICES_QUARTERLY } from "../lib/plans";

/**
 * Single source of truth for Biomart's sales/support WhatsApp number.
 * Everything that contacts *us* (upgrades, quotes, support) uses this.
 */
const BIOMART_WHATSAPP = "2347072789513";

/** Build a wa.me link to Biomart sales with a pre-filled message. */
const biomartWa = (message) =>
  `https://wa.me/${BIOMART_WHATSAPP}?text=${encodeURIComponent(message)}`;

export default function Plan() {
  const { store } = useAuth();
  const [isQuarterly, setIsQuarterly] = useState(false);

  const currentPlan = store?.plan || "free";
  const storeSlug = store?.slug || "my-store";

  // Seller's own number — only ever used for customer-facing order links,
  // never for upgrade requests.
  const sellerWhatsApp = store?.whatsapp?.replace(/\D/g, "") || "";

  const getUpgradeLink = (planName) => {
    const cycle = isQuarterly ? "Quarterly" : "Monthly";
    return biomartWa(
      `Hi Biomart, I'd like to upgrade my store (${storeSlug}) to the ${planName} (${cycle}) plan. Please send me the payment details.`
    );
  };

  return (
    <DashboardLayout>
      {/* Force bullet markers to be white on the dark "pop" card */}
      <style>{`
        .plan.pop ul li::marker { color: #fff !important; }
      `}</style>

      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Billing</p>
        <h1 className="dash-title">
          Upgrade your <em>store</em>.
        </h1>
        <p className="dash-head-lead">Choose a plan that fits your business.</p>
      </div>

      {/* MONTHLY / QUARTERLY TOGGLE */}
      <div
        className="switch-wrap"
        style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "var(--soft)",
            padding: 4,
            borderRadius: 99,
            border: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
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
              transition: "all 0.2s ease",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
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
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease",
            }}
          >
            Quarterly{" "}
            <span
              style={{
                background: "var(--green)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 10,
              }}
            >
              Save 8%
            </span>
          </button>
        </div>
      </div>

      {/* PRICING GRID */}
      <div className="plans">
        {/* FREE PLAN */}
        <div className="plan">
          <h3>Free</h3>
          <p className="desc">Test the waters.</p>
          <div className="p">
            <span>₦0</span>
          </div>
          <ul>
            <li>5 products</li>
            <li>1 photo per product</li>
            <li className="no">No variants</li>
            <li className="no">Biomart ad on storefront</li>
          </ul>
          <button
            disabled
            className="btn line"
            style={{ width: "100%", opacity: currentPlan === "free" ? 0.5 : 1 }}
          >
            {currentPlan === "free" ? "Current Plan" : "Basic"}
          </button>
        </div>

        {/* STARTER PLAN */}
        <div className="plan">
          <h3>Starter</h3>
          <p className="desc">For the casual seller.</p>
          <div className="p">
            <span>
              ₦
              {(isQuarterly
                ? PLAN_PRICES_QUARTERLY.starter
                : PLAN_PRICES_MONTHLY.starter
              ).toLocaleString()}
            </span>
            <span className="per">{isQuarterly ? "/quarter" : "/month"}</span>
          </div>
          <ul>
            <li>15 products</li>
            <li>3 photos per product</li>
            <li className="no">No variants</li>
            <li className="no">Biomart ad on storefront</li>
          </ul>
          <a
            href={getUpgradeLink("Starter")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn line"
            style={{ width: "100%" }}
          >
            {currentPlan === "starter" ? "Renew Plan" : "Get Starter"}
          </a>
        </div>

        {/* PRO PLAN (Highlighted) */}
        <div className="plan pop">
          <span className="badge">Most Popular</span>

          <h3 style={{ color: "#fff" }}>Pro</h3>
          <p className="desc" style={{ color: "rgba(255,255,255,0.8)" }}>
            For serious brands.
          </p>

          <div className="p" style={{ color: "#fff" }}>
            <span>
              ₦
              {(isQuarterly
                ? PLAN_PRICES_QUARTERLY.pro
                : PLAN_PRICES_MONTHLY.pro
              ).toLocaleString()}
            </span>
            <span className="per" style={{ color: "rgba(255,255,255,0.6)" }}>
              {isQuarterly ? "/quarter" : "/month"}
            </span>
          </div>

          <ul style={{ color: "#fff" }}>
            <li>Unlimited products</li>
            <li>10 photos per product</li>
            <li>Product variants</li>
            <li>No Biomart ad</li>
          </ul>

          <a
            href={getUpgradeLink("Pro")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ width: "100%", background: "#fff", color: "#000" }}
          >
            {currentPlan === "pro" ? "Renew Plan" : "Get Pro"}
          </a>
        </div>
      </div>

           {/* CUSTOM PLAN */}
      <div className="custom-plan-wrapper" style={{ marginTop: 24 }}>
        <div className="plan custom-plan" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Custom E-commerce</h3>
            <p className="desc">
              Get a full online store built from scratch, tailored exactly to your brand's needs.
            </p>
            <div className="p" style={{ fontSize: 20, marginBottom: 16 }}>
              <span>From ₦100,000</span>
            </div>
            
            {/* 🟢 CLEAN BULLET LIST (NO CUSTOM TICKS) */}
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px 24px", margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              <li>Your own custom domain</li>
              <li>Advanced shopping cart & checkout</li>
              <li>Automated Paystack payments</li>
              <li>Automated order tracking</li>
              <li>Custom branding & UI design</li>
              <li>Priority lifetime support</li>
            </ul>
          </div>
          
          <a
            href={biomartWa(
              "Hi Biomart, I'd like a quote for a custom e-commerce website."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ marginTop: 16, flexShrink: 0 }}
          >
            Contact Sales
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
