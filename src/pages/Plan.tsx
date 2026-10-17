import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

type Plan = {
  id: string;
  name: string;
  price: string;
  per: string;
  products: number;
  photos: number;
  sizes: boolean;
  support?: boolean;
  badge?: "popular" | "founding";
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₦0",
    per: "forever",
    products: 5,
    photos: 1,
    sizes: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "₦2,000",
    per: "/month",
    products: 15,
    photos: 2,
    sizes: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦4,000",
    per: "/month",
    products: 50,
    photos: 5,
    sizes: true,
    support: true,
    badge: "popular",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "₦40,000",
    per: "once",
    products: Infinity,
    photos: 10,
    sizes: true,
    support: true,
    badge: "founding",
  },
];

const WHATSAPP =
  "https://wa.me/2347072789513?text=" +
  encodeURIComponent("Hi biomart, I'd like a quote for a custom online store.");

export default function Plan() {
  const { products, limits, store } = useAuth();
  if (!store) return null;

  const currentPlan = limits?.planName?.toLowerCase() || "free";
  const productLimit = limits?.products ?? 5;
  const usage =
    productLimit < 100000 ? Math.min(100, (products.length / productLimit) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Plan</p>
        <h1 className="dash-title">
          Your <em>plan</em>.
        </h1>
      </div>

      {/* USAGE */}
      <section className="plan-usage">
        <div className="plan-usage-head">
          <span>Products used</span>
          <b>
            {products.length}
            {productLimit < 100000 ? ` / ${productLimit}` : " / ∞"}
          </b>
        </div>
        <div className="plan-usage-bar">
          <div className="plan-usage-fill" style={{ width: `${usage}%` }} />
        </div>
        {usage >= 100 && (
          <p className="plan-usage-warn">
            You've hit your product limit. Upgrade below.
          </p>
        )}
      </section>

      {/* PLANS */}
      <section className="plan-grid">
        {PLANS.map((p) => {
          const isCurrent =
            currentPlan === p.id || (p.id === "free" && !limits);
          const isPopular = p.badge === "popular";
          const isFounding = p.badge === "founding";

          return (
            <div
              key={p.id}
              className={[
                "plan",
                isCurrent ? "is-current" : "",
                isPopular ? "is-popular" : "",
                isFounding ? "is-founding" : "",
              ].filter(Boolean).join(" ")}
            >
              {isCurrent && <span className="plan-tag current">Current</span>}
              {!isCurrent && isPopular && <span className="plan-tag popular">Popular</span>}
              {!isCurrent && isFounding && <span className="plan-tag founding">Founding</span>}

              <h3 className="plan-name">{p.name}</h3>
              <div className="plan-price">
                <b>{p.price}</b>
                <span>{p.per}</span>
              </div>

              <ul className="plan-features">
                <li>
                  {p.products === Infinity ? "Unlimited products" : `${p.products} products`}
                </li>
                <li>
                  {p.photos} photo{p.photos > 1 ? "s" : ""} each
                </li>
                <li>WhatsApp orders</li>
                <li className={p.sizes ? "" : "off"}>
                  {p.sizes ? "Sizes and options" : "Sizes and options"}
                </li>
                {p.support && <li>24/7 customer support</li>}
              </ul>

              {isCurrent ? (
                <button className="plan-btn current" disabled>
                  Your current plan
                </button>
              ) : (
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`plan-btn ${isPopular ? "primary" : ""}`}
                >
                  Upgrade
                </a>
              )}
            </div>
          );
        })}
      </section>

      {/* CUSTOM */}
      <section className="plan-custom">
        <div className="plan-custom-info">
          <span className="plan-custom-tag">Custom</span>
          <h3>Full online store</h3>
          <p>Cart, payments, and your own domain.</p>
        </div>
        <div className="plan-custom-price">
          <span>From</span>
          <b>₦100,000</b>
        </div>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="plan-btn primary"
        >
          Talk to us
        </a>
      </section>
    </DashboardLayout>
  );
}