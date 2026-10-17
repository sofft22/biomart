import { useEffect, useState } from "react";
import { adminApi } from "../../lib/adminApi";

export default function AdminSettings() {
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.settings()
      .then((r: any) => setFlags(r.flags))
      .catch(() => setFlags({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-page">Loading…</div>;

  const hints: Record<string, string> = {
    signups_paused: "Stop new stores from signing up",
    maintenance_mode: "Show maintenance page to all stores",
    support_number: "WhatsApp number shown on landing",
  };

  const flagCount = Object.keys(flags).length;
  const onCount = Object.values(flags).filter(
    (v) => v === "true" || v.startsWith("+") || v.startsWith("0")
  ).length;

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Settings</p>
      <h1 className="admin-page-title">
        Admin <em>settings</em>.
      </h1>

      <div className="admin-hero dark">
        <p className="admin-hero-label">Global flags</p>
        <p className="admin-hero-value">{flagCount}</p>
        <p className="admin-hero-hint">
          {onCount} active · {flagCount - onCount} inactive
        </p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <p className="admin-stat-label">Total flags</p>
          <p className="admin-stat-value">{flagCount}</p>
        </div>
        <div className="admin-stat is-green">
          <p className="admin-stat-label">Active</p>
          <p className="admin-stat-value">{onCount}</p>
        </div>
      </div>

      <section className="admin-block">
        <h2 className="admin-block-title">All flags</h2>
        {flagCount === 0 ? (
          <p className="admin-empty">No flags configured.</p>
        ) : (
          <div>
            {Object.entries(flags).map(([k, v]) => {
              const isOn = v === "true";
              const isOff = v === "false";
              return (
                <div key={k} className="admin-setting-row">
                  <div className="admin-setting-info">
                    <p className="admin-setting-name">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="admin-setting-hint">
                      {hints[k] ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`admin-setting-value ${
                      isOn ? "on" : isOff ? "off" : ""
                    }`}
                  >
                    {v}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}