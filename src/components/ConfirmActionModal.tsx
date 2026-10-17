import { useState } from "react";
import { adminApi, type AdminStoreRow } from "../lib/adminApi";
import { PLAN_PRICES } from "../lib/plans";

interface Props {
  stores: AdminStoreRow[];
  onClose: () => void;
  onDone: () => void;
}

const PLANS = ["free", "starter", "pro", "lifetime"] as const;

export default function RecordPaymentModal({ stores, onClose, onDone }: Props) {
  const [storeId, setStoreId] = useState("");
  const [plan, setPlan] = useState<"free" | "starter" | "pro" | "lifetime">("starter");
  const [amount, setAmount] = useState<string>(String(PLAN_PRICES.starter));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handlePlanChange = (p: typeof plan) => {
    setPlan(p);
    setAmount(String(PLAN_PRICES[p]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return setError("Pick a store.");
    setBusy(true);
    setError("");
    try {
      await adminApi.recordPayment(storeId, plan, Number(amount), note);
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal">
        <button onClick={onClose} aria-label="Close" className="admin-modal-close">×</button>
        
        <h3 className="admin-modal-title">Record payment</h3>
        <p className="admin-modal-sub">Log a payment to upgrade the store's plan instantly.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
          
          <div className="admin-field">
            <label className="admin-label">Store</label>
            <select 
              className="admin-input" 
              value={storeId} 
              onChange={(e) => setStoreId(e.target.value)}
              required
            >
              <option value="" disabled>Select a store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-label">Plan</label>
            <div className="admin-plan-picker" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {PLANS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlanChange(p)}
                  className={`admin-plan-pick ${plan === p ? "on" : ""}`}
                  style={{ padding: "10px 4px", fontSize: 10 }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Amount (₦)</label>
            <input
              type="number"
              className="admin-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Note (optional)</label>
            <input
              type="text"
              className="admin-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. GTB transfer ref 1234"
            />
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="admin-modal-actions" style={{ marginTop: 8 }}>
            <button type="button" onClick={onClose} className="admin-modal-btn ghost">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="admin-modal-btn primary">
              {busy ? "Saving…" : "Save payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}