import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { adminApi, type AdminStoreRow, type AdminBillingRow } from "../../lib/adminApi";
import RecordPaymentModal from "../../components/RecordPaymentModal";

type Tab = "renewals" | "ledger";

export default function AdminBilling() {
  const [payments, setPayments] = useState<AdminBillingRow[]>([]);
  const [stores, setStores] = useState<AdminStoreRow[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // NEW: State to control which tab is showing
  const [activeTab, setActiveTab] = useState<Tab>("renewals");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.billing(), 
      adminApi.stores(),
      adminApi.expiringStores() 
    ])
      .then(([billingRes, storesRes, expiringRes]) => {
        setPayments(billingRes.payments ?? []);
        setStores(storesRes.stores ?? []);
        setExpiring(expiringRes.stores ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="admin-page">Loading…</div>;
  if (error) return <div className="admin-page admin-err">{error}</div>;

  const payingStores = stores.filter(s => s.plan !== "free" && s.plan !== "Free").length;
  const expiredCount = expiring.filter(s => s.paid_until && s.paid_until < Date.now()).length;
  const expiringSoonCount = expiring.length - expiredCount;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-page-eyebrow">Subscriptions</p>
          <h1 className="admin-page-title">Plans & <em>expiries</em>.</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="admin-btn-primary">
          + Log payment
        </button>
      </div>

      {/* 3 stats */}
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 24 }}>
        <div className="admin-stat">
          <p className="admin-stat-label">Active paid plans</p>
          <p className="admin-stat-value">{payingStores}</p>
        </div>
        <div className={`admin-stat ${expiringSoonCount > 0 ? "is-warn" : ""}`}>
          <p className="admin-stat-label">Expiring soon</p>
          <p className="admin-stat-value">{expiringSoonCount}</p>
        </div>
        <div className={`admin-stat ${expiredCount > 0 ? "is-danger" : ""}`}>
          <p className="admin-stat-label">Expired</p>
          <p className="admin-stat-value">{expiredCount}</p>
        </div>
      </div>

      {/* NEW: TABS */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "renewals" ? "on" : ""}`}
          onClick={() => setActiveTab("renewals")}
        >
          Needs Renewal ({expiring.length})
        </button>
        <button
          className={`admin-tab ${activeTab === "ledger" ? "on" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          Payment Ledger ({payments.length})
        </button>
      </div>

      {/* TAB CONTENT: RENEWALS */}
      {activeTab === "renewals" && (
        <div className="admin-block" style={{ marginTop: 0, paddingTop: 20 }}>
          {expiring.length === 0 ? (
            <p className="admin-empty">All paid plans are healthy.</p>
          ) : (
            <ul className="admin-feed">
              {expiring.map((s) => {
                const isExpired = s.paid_until && s.paid_until < Date.now();
                return (
                  <li key={s.id} className="admin-feed-row">
                    <div className="admin-feed-main">
                      <p className="admin-feed-name">{s.name}</p>
                      <p className="admin-feed-email">
                        {s.paid_until 
                          ? `${isExpired ? "Expired" : "Expires"}: ${new Date(s.paid_until).toLocaleDateString()}` 
                          : "No expiry set"}
                      </p>
                    </div>
                    <span className={`admin-pill plan-${s.plan}`}>{s.plan}</span>
                    <button 
                      className="admin-modal-btn primary" 
                      style={{ padding: "8px 12px", fontSize: 10 }}
                      onClick={() => setModalOpen(true)}
                    >
                      Renew
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* TAB CONTENT: LEDGER */}
      {activeTab === "ledger" && (
        <div className="admin-block" style={{ marginTop: 0, paddingTop: 20 }}>
          {payments.length === 0 ? (
            <p className="admin-empty">No payments recorded yet.</p>
          ) : (
            <ul className="admin-feed">
              {payments.map((p) => (
                <li key={p.id} className="admin-feed-row">
                  <div className="admin-feed-main">
                    <p className="admin-feed-name">{p.store_name ?? "Unknown Store"}</p>
                    <p className="admin-feed-email">
                      {new Date(p.paid_at).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric"
                      })} {p.note ? `· ${p.note}` : ""}
                    </p>
                  </div>
                  <span className={`admin-pill plan-${p.plan}`}>{p.plan}</span>
                  <span className="admin-feed-value">₦{p.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modalOpen && createPortal(
        <RecordPaymentModal
          stores={stores}
          onClose={() => setModalOpen(false)}
          onDone={loadData}
        />,
        document.body
      )}
    </div>
  );
}