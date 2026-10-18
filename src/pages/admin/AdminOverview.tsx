import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi"; 

function sizeFor(value: string): number {
  const len = value.length;
  if (len <= 4) return 34;
  if (len <= 6) return 30;
  if (len <= 8) return 26;
  if (len <= 10) return 22;
  return 18;
}

export default function Overview() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.overview()
      .then((overview) => setData(overview))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;
  if (!data) return null;

  const mrrStr = `₦${(data.mrr || 0).toLocaleString()}`;
  const revenueStr = `₦${(data.totalRevenue || 0).toLocaleString()}`;

  // 🟢 Build the SVG Line Chart
  const chartData = data.chart || [];
  const maxAmount = Math.max(1, ...chartData.map((d: any) => d.amount));
  const svgWidth = 800;
  const svgHeight = 200;
  
  const points = chartData.map((d: any, i: number) => {
    const x = (i / (chartData.length - 1 || 1)) * svgWidth;
    const y = svgHeight - ((d.amount / maxAmount) * (svgHeight - 40)) - 20;
    return { x, y, amount: d.amount, label: d.label };
  });

  const linePath = points.map((p: any) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M0,${svgHeight} L${points.map((p: any) => `${p.x},${p.y}`).join(" L")} L${svgWidth},${svgHeight} Z`;

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Overview</p>
      <h1 className="admin-page-title">The <em>business</em>.</h1>

      {/* MRR HERO CARD */}
      <div className="admin-hero green">
        <p className="admin-hero-label">Monthly recurring revenue</p>
        <p className="admin-hero-value">{mrrStr}</p>
        <p className="admin-hero-hint">From {data.payingStores || 0} paying stores</p>
      </div>

      {/* 🟢 REMOVED THE OLD "FREE" CARD, ONLY KEPT THE ESSENTIALS */}
      <div className="admin-stats">
        <div className="admin-stat">
          <p className="admin-stat-label">Total money earned</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(revenueStr) }}>{revenueStr}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Total stores</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalStores || 0)) }}>{data.totalStores || 0}</p>
        </div>
        <div className={`admin-stat ${data.payingStores > 0 ? "is-green" : ""}`}>
          <p className="admin-stat-label">Paying stores</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.payingStores || 0)) }}>{data.payingStores || 0}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Products listed</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalProducts || 0)) }}>{(data.totalProducts || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* 🟢 SMOOTH LINE CHART (Replaces Bar Chart) */}
      <section className="admin-block">
        <h2 className="admin-block-title">Revenue · Last 7 Days</h2>
        <div style={{ position: "relative", width: "100%", overflow: "hidden", marginTop: 24 }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path d={areaPath} fill="url(#areaGrad)" />
            <polyline points={linePath} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p: any, i: number) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="var(--bg)" stroke="var(--green)" strokeWidth="3" />
                <text x={p.x} y={svgHeight - 4} textAnchor="middle" fontSize="12" fill="var(--muted)" fontWeight="bold">
                  {p.label}
                </text>
                <title>{`${p.label}: ₦${p.amount.toLocaleString()}`}</title>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* 🟢 TOP 3 PAYING STORES (Replaces Top Visited) */}
      <section className="admin-block">
        <h2 className="admin-block-title">Top paying stores</h2>
        {data.topStores.length === 0 ? (
          <p className="admin-empty">No payments recorded yet.</p>
        ) : (
          <ul className="admin-feed">
            {data.topStores.map((s: any, i: number) => (
              <li key={s.slug} className="admin-feed-row">
                <div className="admin-rank" style={{ 
                  background: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32", 
                  color: "#000" 
                }}>
                  {i + 1}
                </div>
                <div className="admin-feed-main">
                  <p className="admin-feed-name">{s.name}</p>
                  <p className="admin-feed-email">/{s.slug}</p>
                </div>
                <span className="admin-feed-value" style={{ color: "var(--green)", fontWeight: 600 }}>
                  ₦{s.totalPaid.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
