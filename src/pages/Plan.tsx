import { useState } from "react";
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
      {/* ADDED: Inline style just to force the list markers (bullets) to be white on the dark card */}
      <style>{`
        .plan.pop ul li::marker { color: #fff !important; }
      `}</style>

      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Billing</p>
        <h1 className="dash-title">Upgrade your <em>store</em>.</h1>
        <p className="dash-head-lead">Choose a plan that fits your business.</p>
      </div>

      {/* MONTHLY / QUARTERLY TOGGLE */}
      <div className="switch-wrap" style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
        <div style={{ display: "inline-flex", background: "var(--soft)", padding: 4, borderRadius: 99, border: "1px solid var(--line)" }}>
          <button 
            type="button" 
            onClick={() => setIsQuarterly(false)} 
            style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: !isQuarterly ? "var(--bg)" : "transparent", color: !isQuarterly ? "var(--ink)" : "var(--muted)", transition: "all 0.2s ease" }}
          >
            Monthly
          </button>
          <button 
            type="button" 
            onClick={() => setIsQuarterly(true)} 
            style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: isQuarterly ? "var(--bg)" : "transparent", color: isQuarterly ? "var(--ink)" : "var(--muted)", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease" }}
          >
            Quarterly <span style={{ background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 99, fontSize: 10 }}>Save 8%</span>
          </button>
        </div>
      </div>

      {/* PRICING GRID - Matches Landing Page exactly */}
      <div className="plans">
        
        {/* FREE PLAN */}
        <div className="plan">
          <h3>Free</h3>
          <p className="desc">Test the waters.</p>
          <div className="p"><span>₦0</span></div>
          <ul>
            <li>5 products</li>
            <li>1 photo per product</li>
            <li className="no">No variants</li>
            <li className="no">Biomart ad on storefront</li>
          </ul>
          <button disabled className="btn line" style={{ width: "100%", opacity: currentPlan === "free" ? 0.5 : 1 }}>
            {currentPlan === "free" ? "Current Plan" : "Basic"}
          </button>
        </div>

        {/* STARTER PLAN */}
        <div className="plan">
          <h3>Starter</h3>
          <p className="desc">For the casual seller.</p>
          <div className="p">
            <span>₦{isQuarterly ? PLAN_PRICES_QUARTERLY.starter.toLocaleString() : PLAN_PRICES_MONTHLY.starter.toLocaleString()}</span>
            <span className="per">{isQuarterly ? "/quarter" : "/month"}</span>
          </div>
          <ul>
            <li>15 products</li>
            <li>3 photos per product</li>
            <li className="no">No variants</li>
            <li className="no">Biomart ad on storefront</li>
          </ul>
          <a href={getWhatsAppLink("Starter")} target="_blank" rel="noopener noreferrer" className="btn line" style={{ width: "100%" }}>
            {currentPlan === "starter" ? "Renew Plan" : "Get Starter"}
          </a>
        </div>

        {/* PRO PLAN (Highlighted) - FIXED WITH WHITE TEXT */}
        <div className="plan pop">
          <span className="badge">Most Popular</span>
          
          {/* Added style={{ color: "#fff" }} to these elements below */}
          <h3 style={{ color: "#fff" }}>Pro</h3>
          <p className="desc" style={{ color: "rgba(255,255,255,0.8)" }}>For serious brands.</p>
          
          <div className="p" style={{ color: "#fff" }}>
            <span>₦{isQuarterly ? PLAN_PRICES_QUARTERLY.pro.toLocaleString() : PLAN_PRICES_MONTHLY.pro.toLocaleString()}</span>
            {/* Made the /month text slightly faded white so it looks premium */}
            <span className="per" style={{ color: "rgba(255,255,255,0.6)" }}>{isQuarterly ? "/quarter" : "/month"}</span>
          </div>
          
          <ul style={{ color: "#fff" }}>
            <li>Unlimited products</li>
            <li>10 photos per product</li>
            <li>Product variants</li>
            <li>No Biomart ad</li>
          </ul>
          
          <a href={getWhatsAppLink("Pro")} target="_blank" rel="noopener noreferrer" className="btn" style={{ width: "100%", background: "#fff", color: "#000" }}>
            {currentPlan === "pro" ? "Renew Plan" : "Get Pro"}
          </a>
        </div>

      </div>

      {/* CUSTOM PLAN - Matches Landing Page exactly */}
      <div className="custom-plan-wrapper" style={{ marginTop: 24 }}>
        <div className="plan custom-plan">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Custom E-commerce</h3>
            <p className="desc">Get a full online store with your own domain, shopping cart, and automated Paystack checkout.</p>
            <div className="p" style={{ fontSize: 20 }}>Custom Quote</div>
          </div>
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Biomart, I'd like a quote for a custom e-commerce website.")}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn"
          >
            Contact Sales
          </a>
        </div>
      </div>

    </DashboardLayout>
  );
}
