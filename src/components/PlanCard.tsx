import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPlanStatus, getLimit } from "../lib/plans";

export default function PlanCard() {
  const { store } = useAuth();
  if (!store) return null;

  const status = getPlanStatus(store.plan || "free", store.paid_until);
  
  // 🟢 Fetch limits dynamically so you never have to hardcode "100" again
  const freeLimit = getLimit("free");
  const proLimit = getLimit("pro");

  // 🟢 LOGIC FOR FREE USERS
  if (status.status === "free") {
    return (
      <div className="ov-plan-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p className="ov-plan-eyebrow">Free Plan</p>
            <p className="ov-plan-title">Upgrade to unlock more.</p>
          </div>
        </div>
        <p className="ov-plan-sub">
          You have {freeLimit.products} products and {freeLimit.photos} photo per product. Upgrade to Pro to unlock {proLimit.products} products, {proLimit.photos} photos, and product variants.
        </p>
        <Link to="/plan" className="dash-btn dash-btn-dark" style={{ marginTop: 16, display: "inline-flex" }}>
          View Upgrade Plans
        </Link>
      </div>
    );
  }

  // 🟢 LOGIC FOR PAID USERS (Timer)
  const daysLeft = status.daysLeft || 0;
  // Calculate percentage (assuming 30 days for monthly, 90 for quarterly)
  // If the difference is > 30, it's likely a quarterly plan.
  const isQuarterly = daysLeft > 30;
  const totalDays = isQuarterly ? 90 : 30;
  
  const percentage = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  const isExpiringSoon = daysLeft <= 7;

  return (
    <div className="ov-plan-card" style={{ borderColor: isExpiringSoon ? "var(--danger)" : "var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p className="ov-plan-eyebrow" style={{ color: isExpiringSoon ? "var(--danger)" : "var(--green)" }}>
            {store.plan?.toUpperCase()} PLAN
          </p>
          <p className="ov-plan-title">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </p>
        </div>
        {isExpiringSoon && (
          <span style={{ background: "var(--danger-soft)", color: "var(--danger)", padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
            Expiring Soon
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="ov-plan-bar-bg">
        <div 
          className="ov-plan-bar-fill" 
          style={{ 
            width: `${percentage}%`,
            background: isExpiringSoon ? "var(--danger)" : "var(--green)" 
          }} 
        />
      </div>

      <p className="ov-plan-sub">
        Expires on {new Date(store.paid_until!).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}.
      </p>

      <a 
        href={`https://wa.me/${store.whatsapp?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(`Hi, I want to renew my ${store.plan} plan.`)}`}
        target="_blank" 
        rel="noopener" 
        className="dash-btn dash-btn-dark" 
        style={{ marginTop: 16, display: "inline-flex", background: isExpiringSoon ? "var(--danger)" : "var(--green)" }}
      >
        Renew on WhatsApp
      </a>
    </div>
  );
}
