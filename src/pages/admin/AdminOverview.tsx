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

interface DayBar {
  date: string;
  label: string;
  count: number;
}

interface TopStore {
  id: string;
  name: string;
  slug: string;
  plan: string;
  visits: number;
}

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState<DayBar[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.overview(),
      adminApi.visitsByDay(),
      adminApi.topStores(),
    ])
      .then(([overview, vbd, top]) => {
        setData(overview);
        setDays(vbd.days ?? []);
        setTopStores(top.stores ?? []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;
  if (!data) return null;

  const mrrStr = `₦${(data.mrr || 0).toLocaleString()}`;
  const revenueStr = `₦${(data.totalRevenue || 0).toLocaleString()}`;

  const maxVisits = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Overview</p>
      <h1 className="admin-page-title">
        The <em>business</em>.
      </h1>

      {/* Hero — MRR */}
      <div className="admin-hero green">
        <p className="admin-hero-label">Monthly recurring revenue</p>
        <p className="admin-hero-value">{mrrStr}</p>
        <p className="admin-hero-hint">
          From {data.payingStores || 0}{" "}
          {data.payingStores === 1 ? "paying store" : "paying stores"}
        </p>
      </div>

      {/* 6 number cards */}
      <div className="admin-stats">
        <div className="admin-stat">
          <p className="admin-stat-label">Total revenue</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(revenueStr) }}>
            {revenueStr}
          </p>
        </div>

        <div className="admin-stat">
          <p className="admin-stat-label">Total stores</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalStores || 0)) }}>
            {data.totalStores || 0}
          </p>
        </div>

        <div className={`admin-stat ${data.payingStores > 0 ? "is-green" : ""}`}>
          <p className="admin-stat-label">Paying</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.payingStores || 0)) }}>
            {data.payingStores || 0}
          </p>
        </div>

        <div className="admin-stat">
          <p className="admin-stat-label">Free</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.freeStores || 0)) }}>
            {data.freeStores || 0}
          </p>
        </div>

        <div className="admin-stat">
          <p className="admin-stat-label">Store visits</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalVisits || 0)) }}>
            {(data.totalVisits || 0).toLocaleString()}
          </p>
        </div>

        <div className="admin-stat">
          <p className="admin-stat-label">Products listed</p>
          <p className="admin-stat-value" style={{ fontSize: sizeFor(String(data.totalProducts || 0)) }}>
            {(data.totalProducts || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart — last 7 days */}
      <section className="admin-block">
        <h2 className="admin-block-title">Visits · last 7 days</h2>
        <div className="admin-chart">
          {days.map((d) => {
            const h = (d.count / maxVisits) * 100;
            return (
              <div key={d.date} className="admin-chart-col">
                <div className="admin-chart-bar-wrap">
                  <div
                    className="admin-chart-bar"
                    style={{ height: `${Math.max(4, h)}%` }}
                    title={`${d.count} visits`}
                  />
                </div>
                <span className="admin-chart-label">{d.label}</span>
                <span className="admin-chart-count">{d.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top visited stores */}
      <section className="admin-block">
        <h2 className="admin-block-title">Top visited stores</h2>
        {topStores.length === 0 ? (
          <p className="admin-empty">No visits yet.</p>
        ) : (
          <ul className="admin-feed">
            {topStores.map((s, i) => (
              <li key={s.id} className="admin-feed-row">
                <div className="admin-rank">{i + 1}</div>
                <div className="admin-feed-main">
                  <p className="admin-feed-name">{s.name}</p>
                  <p className="admin-feed-email">/{s.slug}</p>
                </div>
                <span className={`admin-pill plan-${s.plan}`}>{s.plan}</span>
                <span className="admin-feed-value">{s.visits}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
