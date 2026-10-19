import { useEffect, useState } from "react";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert("Failed to save settings");
    }
    setSaving(false);
  };

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="admin-page">Loading…</div>;

  return (
    <div className="admin-page">
      <p className="admin-page-eyebrow">Settings</p>
      <h1 className="admin-page-title">Platform <em>settings</em>.</h1>

      <div style={{ display: "grid", gap: 24, maxWidth: 600, marginTop: 32 }}>
        
        {/* STARTER PLAN */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "var(--soft)", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Starter Plan (₦)</h3>
          </div>
          <div style={{ padding: 20, display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Price (₦)</label>
              <input type="number" value={settings.starter_price || ""} onChange={(e) => update("starter_price", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Product Limit</label>
              <input type="number" value={settings.starter_limit || ""} onChange={(e) => update("starter_limit", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Photos per Product</label>
              <input type="number" value={settings.starter_photos || ""} onChange={(e) => update("starter_photos", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
          </div>
        </div>

        {/* PRO PLAN */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "var(--soft)", borderBottom: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Pro Plan (₦)</h3>
          </div>
          <div style={{ padding: 20, display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Price (₦)</label>
              <input type="number" value={settings.pro_price || ""} onChange={(e) => update("pro_price", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Product Limit (1000000 = Unlimited)</label>
              <input type="number" value={settings.pro_limit || ""} onChange={(e) => update("pro_limit", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Photos per Product</label>
              <input type="number" value={settings.pro_photos || ""} onChange={(e) => update("pro_photos", e.target.value)} className="pe-input" style={{ width: "100%", padding: "10px 14px" }} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="dash-btn dash-btn-dark"
          style={{ width: "100%", padding: "16px", fontSize: 14 }}
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
        </button>

      </div>
    </div>
  );
}
