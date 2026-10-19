import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminApi } from "../../lib/adminApi";
import StoreDetailsModal from "../../components/StoreDetailsModal";

function sizeFor(value: string): number {
  const len = value.length;
  if (len <= 4) return 34;
  if (len <= 6) return 30;
  if (len <= 8) return 26;
  if (len <= 10) return 22;
  return 18;
}

type TimeFrame = "7d" | "30d";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("7d");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // 🟢 We re-fetch whenever the timeframe changes
  useEffect(() => {
    setLoading(true);
    adminApi.overview() // Assuming your backend handles the timeframe, or we just slice it on frontend
      .then((overview) => setData(overview))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [timeFrame]);

  if (loading && !data) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;
  if (!data) return null;

  const mrrStr = `₦${(data.mrr || 0).toLocaleString()}`;
  const revenueStr = `₦${(data.totalRevenue || 0).toLocaleString()}`;

  // 🟢 CHART LOGIC
  // Slice the chart data based on the selected timeframe (7 or 30 days)
  const rawChart = data.chart || [];
  const chartData = timeFrame === "7d" ? rawChart.slice(-7) : rawChart;
  
  const maxAmount = Math.max(1, ...chartData.map((d: any) => d.amount));
  
  // SVG Dimensions
  const W = 800;
  const H = 240;
  const PAD_X = 40;
  const PAD_Y = 30;
  
  // Calculate points
  const points = chartData.map((d: any, i: number) => {
    const x = PAD_X + (i / (chartData.length - 1 || 1)) * (W - PAD_X * 2);
    const y = H - PAD_Y - (d.amount / maxAmount) * (H - PAD_Y * 2);
    return { x, y, amount: d.amount, label: d.label };
  });

  const linePath = points.map((p: any) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${PAD_X},${H - PAD_Y} L${points.map((p: any) => `${p.x},${p.y}`).join(" L")} L${W - PAD_X},${H - PAD_Y} Z`;

  // Calculate Y-Axis lines (3 lines)
  const ySteps = [0, 0.5, 1].map(pct => {
    const val = maxAmount * pct;
    const y = H - PAD_Y - pct * (H - PAD_Y * 2);
    return { val, y };
  });

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Overview</p>
      <h1 className="admin-page-title">The <em>business</em>.</h1>

      {/* 1. HERO CARD */}
      <div className="admin-hero green" style={{ marginBottom: 24 }}>
        <p className="admin-hero-label">Monthly recurring revenue</p>
        <p className="admin-hero-value">{mrrStr}</p>
        <p className="admin-hero-hint">From {data.payingStores || 0} paying stores</p>
      </div>

      {/* 2. TWO CARDS (Row 1) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="admin-stat">
          <p className="admin-stat-label">Total money earned</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(revenueStr) }}>{revenueStr}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Total stores</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalStores || 0)) }}>{data.totalStores || 0}</p>
        </div>
      </div>

      {/* 3. TWO CARDS (Row 2) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
        <div className={`admin-stat ${data.payingStores > 0 ? "is-green" : ""}`}>
          <p className="admin-stat-label">Paying stores</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.payingStores || 0)) }}>{data.payingStores || 0}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat-label">Products listed</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalProducts || 0)) }}>{(data.totalProducts || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* 4. CHART SECTION */}
      <section className="admin-block" style={{ padding: "24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", marginBottom: 24 }}>
          <h2 className="admin-block-title" style={{ margin: 0 }}>Revenue Chart</h2>
          
          {/* Timeframe Toggle */}
          <div style={{ display: "flex", gap: 4, background: "var(--soft)", padding: 4, borderRadius: 8 }}>
            <button 
              onClick={() => setTimeFrame("7d")}
              style={{ 
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: 0, cursor: "pointer",
                background: timeFrame === "7d" ? "var(--bg)" : "transparent",
                color: timeFrame === "7d" ? "var(--ink)" : "var(--muted)",
                boxShadow: timeFrame === "7d" ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
              }}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTimeFrame("30d")}
              style={{ 
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: 0, cursor: "pointer",
                background: timeFrame === "30d" ? "var(--bg)" : "transparent",
                color: timeFrame === "30d" ? "var(--ink)" : "var(--muted)",
                boxShadow: timeFrame === "30d" ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
              }}
            >
              30 Days
            </button>
          </div>
        </div>

        <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Y-Axis Grid lines and labels */}
            {ySteps.map((step, i) => (
              <g key={i}>
                <line x1={PAD_X} y1={step.y} x2={W - PAD_X} y2={step.y} stroke="var(--line)" strokeDasharray="4 4" />
                <text x={PAD_X - 10} y={step.y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                  ₦{step.val >= 1000 ? `${(step.val / 1000).toFixed(0)}k` : step.val}
                </text>
              </g>
            ))}

            <path d={areaPath} fill="url(#areaGrad)" />
            <polyline points={linePath} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p: any, i: number) => (
              <g key={i}>
                {/* X-Axis Labels (Only show every 5th label if 30 days to avoid crowding) */}
                {(timeFrame === "7d" || i % 5 === 0) && (
                  <text x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">
                    {p.label}
                  </text>
                )}
                {/* Dots */}
                <circle cx={p.x} cy={p.y} r="4" fill="var(--bg)" stroke="var(--green)" strokeWidth="2" />
                
                {/* Interactive Tooltip on Hover */}
                <g className="chart-tooltip">
                  <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                  <title>{`${p.label}: ₦${p.amount.toLocaleString()}`}</title>
                </g>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* 5. TOP PAYING STORES */}
      <section className="admin-block">
        <h2 className="admin-block-title">Top paying stores</h2>
        {data.topStores.length === 0 ? (
          <p className="admin-empty">No payments recorded yet.</p>
        ) : (
          <ul className="admin-feed">
            {data.topStores.map((s: any, i: number) => (
              <li key={s.id} className="admin-feed-row">
                <div className="admin-rank" style={{ 
                  background: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32", 
                  color: "#000" 
                }}>
                  {i + 1}
                </div>
                <button 
                  onClick={() => setSelectedStore(s.id)} // 🟢 Clickable Link
                  className="admin-feed-main" 
                  style={{ background: "none", border: 0, textAlign: "left", cursor: "pointer", flex: 1 }}
                >
                  <p className="admin-feed-name" style={{ textDecoration: "underline", textDecorationColor: "var(--line)" }}>{s.name}</p>
                  <p className="admin-feed-email">/{s.slug}</p>
                </button>
                <span className="admin-feed-value" style={{ color: "var(--green)", fontWeight: 600 }}>
                  ₦{s.totalPaid.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Store Details Modal Portal */}
      {selectedStore && createPortal(
        <StoreDetailsModal storeId={selectedStore} onClose={() => setSelectedStore(null)} />,
        document.body
      )}
    </div>
  );
}
