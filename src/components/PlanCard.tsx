import { useAuth } from "../context/AuthContext";
import { getLimit, getPlanStatus } from "../lib/plans";

const OWNER_WHATSAPP = "2348012345678";

export default function PlanCard() {
  const { store, products } = useAuth();
  if (!store) return null;

  const plan = (store as any).plan ?? "free";
  const paidUntil = (store as any).paid_until ?? null;
  const status = getPlanStatus(plan, paidUntil);
  const limit = getLimit(plan).visible;
  const used = products.length;
  const shown = Math.min(used, limit);

  // ── Free ──
  if (status.status === "free") {
    return (
      <div className="plan-card">
        <p className="plan-card-eyebrow">Free plan</p>
        <p className="plan-card-title">
          {shown} of {limit} products live
        </p>
        <p className="plan-card-sub">
          You're on the free plan. Upgrade for more products and photos.
        </p>
        <a
          href={`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(
            `Hi, I'd like to upgrade my store ${store.name}.`
          )}`}
          target="_blank"
          rel="noopener"
          className="plan-card-btn"
        >
          Upgrade on WhatsApp
        </a>
      </div>
    );
  }

  // ── Lifetime ──
  if (status.status === "lifetime") {
    return (
      <div className="plan-card plan-card-lifetime">
        <p className="plan-card-eyebrow">Lifetime plan</p>
        <p className="plan-card-title">Thank you.</p>
        <p className="plan-card-sub">
          This plan never expires. {shown} products live on your store.
        </p>
      </div>
    );
  }

  // ── Expired / downgraded ──
  if (status.status === "expired" || status.status === "downgraded") {
    return (
      <div className="plan-card plan-card-danger">
        <p className="plan-card-eyebrow">Plan expired</p>
        <p className="plan-card-title">
          {status.status === "downgraded"
            ? "Your account has downgraded to Free."
            : `Your ${plan} plan expired.`}
        </p>
        <p className="plan-card-sub">
          {status.status === "downgraded"
            ? `Only ${limit} products show on your store. Renew to make them all visible.`
            : `You have ${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"} before downgrade.`}
        </p>
        <a
          href={`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(
            `Hi, I need to renew my ${plan} plan for ${store.name}.`
          )}`}
          target="_blank"
          rel="noopener"
          className="plan-card-btn"
        >
          Renew on WhatsApp
        </a>
      </div>
    );
  }

  // ── Active / expiring ──
  const total = 30;
  const elapsed = total - (status.daysLeft ?? 0);
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));

  return (
    <div
      className={`plan-card ${
        status.status === "expiring" ? "plan-card-warn" : "plan-card-active"
      }`}
    >
      <p className="plan-card-eyebrow">{plan} plan</p>
      <p className="plan-card-title">
        Renews in {status.daysLeft} {status.daysLeft === 1 ? "day" : "days"}
      </p>
      <div className="plan-card-bar">
        <div className="plan-card-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="plan-card-sub">
        {shown} of {used} products live on your store.
      </p>
      <a
        href={`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(
          `Hi, I'd like to renew my ${plan} plan for ${store.name}.`
        )}`}
        target="_blank"
        rel="noopener"
        className="plan-card-btn"
      >
        Renew on WhatsApp
      </a>
    </div>
  );
}