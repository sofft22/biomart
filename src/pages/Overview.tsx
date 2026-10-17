import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import PlanCard from "../components/PlanCard";
import { stats as statsApi } from "../lib/api";

type Range = "today" | "week" | "month";

type StatsData = {
  visits: { today: number; week: number; month: number };
  totalProductViews: number;
  chart: {
    today: { date: string; count: number }[];
    week: { date: string; count: number }[];
    month: { date: string; count: number }[];
  };
  topProducts: { id: string; name: string; price: number; image_url: string | null; views: number }[];
};

function ViewsChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 640;
  const H = 180;
  const PAD = 24;
  const max = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => {
    const x = PAD + (i * (W - PAD * 2)) / Math.max(1, data.length - 1);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return { x, y, d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PAD},${H - PAD} ` + line + ` ${W - PAD},${H - PAD}`;
  const step = data.length > 14 ? 5 : data.length > 8 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="views-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" strokeWidth="1" />
      <polygon points={area} fill="url(#area)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--green)" />
      ))}
      {points.map((p, i) =>
        i % step === 0 ? (
          <text
            key={i}
            x={p.x}
            y={H - 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="var(--faint)"
            fontFamily="var(--font)"
          >
            {p.d.date}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default function Overview() {
  const { user, store, products, limits, loading } = useAuth();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [range, setRange] = useState<Range>("week");
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user || !store) return;
    statsApi.get()
      .then(setData)
      .catch(() => setData(null));
  }, [user, store]);

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

  const visitsNumber =
    range === "today" ? data?.visits.today ?? 0
    : range === "week" ? data?.visits.week ?? 0
    : data?.visits.month ?? 0;

  const chartData = range === "today"
    ? data?.chart.today ?? []
    : range === "week"
      ? data?.chart.week ?? []
      : data?.chart.month ?? [];

  const chartLabel =
    range === "today" ? "Today, hourly"
    : range === "week" ? "Last 7 days"
    : "Last 30 days";

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

      {/* ── GREEN CARD ── */}
      <div className="ov-hero-card">
        <div className="ov-hero-left">
          <p className="ov-hero-label">Store visits</p>
          <p className="ov-hero-value">{visitsNumber.toLocaleString()}</p>
          <p className="ov-hero-hint">
            {range === "today" ? "Today" : range === "week" ? "Last 7 days" : "Last 30 days"}
          </p>
        </div>
        <div className="ov-range" role="group" aria-label="Time range">
          <button
            type="button"
            className={range === "today" ? "on" : ""}
            onClick={() => setRange("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={range === "week" ? "on" : ""}
            onClick={() => setRange("week")}
          >
            7 days
          </button>
          <button
            type="button"
            className={range === "month" ? "on" : ""}
            onClick={() => setRange("month")}
          >
            30 days
          </button>
        </div>
      </div>

      {/* ── STATS (2 Columns now) ── */}
      <div className="ov-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="ov-stat">
          <p className="ov-stat-label">Total product views</p>
          <p className="ov-stat-value">{data?.totalProductViews ?? 0}</p>
          <p className="ov-stat-hint">Across all products</p>
        </div>

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
      </div>

      {/* ── PLAN CARD (The single source of truth) ── */}
      <PlanCard />

      {/* ── CHART ── */}
      <div className={`ov-panel ${mounted ? "in" : ""}`}>
        <div className="ov-panel-head">
          <div>
            <h2 className="dash-section-title">Store visits</h2>
            <p className="ov-panel-sub">{chartLabel}</p>
          </div>
          <p className="ov-panel-total">
            <b>{visitsNumber.toLocaleString()}</b>
            <span>{range === "today" ? "today" : range === "week" ? "this week" : "this month"}</span>
          </p>
        </div>
        <div className="ov-chart-wrap">
          <ViewsChart data={chartData} />
        </div>
      </div>

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

      {/* ── TOP PRODUCTS ── */}
      <div className="ov-panel">
        <div className="ov-panel-head">
          <div>
            <h2 className="dash-section-title">Top products</h2>
            <p className="ov-panel-sub">
              {(data?.topProducts?.length ?? 0) === 0 ? "No views yet" : "Most viewed across your store"}
            </p>
          </div>
          {products.length > 0 && (
            <Link to="/dashboard/products" className="ov-panel-link">
              All products
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          )}
        </div>

        {(data?.topProducts?.length ?? 0) === 0 ? (
          <div className="ov-empty">
            <p>No product views yet. Share your store link.</p>
          </div>
        ) : (
          <ul className="ov-top">
            {data!.topProducts.map((p, i) => (
              <li key={p.id}>
                <Link to={`/dashboard/product/${p.id}`} className="ov-top-row">
                  <span className="ov-top-rank">{i + 1}</span>
                  <div className="ov-top-thumb">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" />
                    ) : (
                      <span className="ov-top-initial">{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ov-top-info">
                    <p className="ov-top-name">{p.name}</p>
                    <p className="ov-top-meta">{p.views.toLocaleString()} views</p>
                  </div>
                  <span className="ov-top-price">
                    ₦{Number(p.price || 0).toLocaleString()}
                  </span>
                  <svg className="ov-top-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
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