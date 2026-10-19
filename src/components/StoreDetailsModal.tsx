import { useEffect, useRef, useState } from "react";
import { adminApi, type AdminStoreDetail } from "../lib/adminApi";
import ResetPasswordModal from "./ResetPasswordModal";
import ConfirmActionModal from "./ConfirmActionModal";

interface Props {
  storeId: string;
  onClose: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function StoreDetailsModal({ storeId, onClose }: Props) {
  const [data, setData] = useState<AdminStoreDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  
  // 🟢 STATE FOR LOGGING PAYMENT
  const [showLog, setShowLog] = useState(false);
  const [logAmount, setLogAmount] = useState("");
  const [logPlan, setLogPlan] = useState("starter");
  const [logging, setLogging] = useState(false);

  const bodyRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .storeDetail(storeId)
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [storeId]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [data]);

  const handleDelete = async () => {
    await adminApi.deleteStore(storeId);
    setShowDelete(false);
    onClose();
  };

  const handleLogPayment = async () => {
    if (!logAmount || isNaN(Number(logAmount))) return;
    setLogging(true);
    try {
      // 🟢 CALL THE NEW API ENDPOINT
      await fetch(`/api/admin/stores/${storeId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: Number(logAmount), plan: logPlan, note: "Manual Admin Upgrade" })
      });
      setShowLog(false);
      setLogAmount("");
      load(); // Reload the modal data
    } catch (e) {
      alert("Failed to log payment");
    }
    setLogging(false);
  };

  return (
    <>
      <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="admin-store-modal">
          <button onClick={onClose} aria-label="Close" className="admin-modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="16" height="16">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="admin-store-body" ref={bodyRef}>
            {loading && <p className="admin-modal-sub" style={{ padding: 26 }}>Loading…</p>}
            {error && <p className="admin-modal-sub" style={{ padding: 26, color: "var(--danger)" }}>{error}</p>}

            {data && (
              <>
                {data.cover_url && (
                  <div className="admin-store-banner">
                    <img src={data.cover_url} alt="" />
                  </div>
                )}

                <div className="admin-store-head">
                  <div className="admin-store-avatar-lg">{(data.name || "?").charAt(0).toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="admin-store-title">{data.name}</h3>
                    <p className="admin-store-sub">/{data.slug}</p>
                  </div>
                </div>

                {/* 🟢 STATS SECTION */}
                <div className="admin-store-stats">
                  <div className="admin-store-stat">
                    <span className="admin-store-stat-value">{data.productCount}</span>
                    <span className="admin-store-stat-label">Products</span>
                  </div>
                  <div className="admin-store-stat">
                    <span className="admin-store-stat-value">{data.plan}</span>
                    <span className="admin-store-stat-label">Current Plan</span>
                  </div>
                  <div className="admin-store-stat">
                    <span className="admin-store-stat-value">
                      {data.paid_until ? formatDate(data.paid_until) : "Never"}
                    </span>
                    <span className="admin-store-stat-label">Expires</span>
                  </div>
                </div>

                {/* 🟢 BILLING SECTION */}
                <div style={{ padding: "0 26px 26px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                    <div>
                      <p className="admin-store-dt">Total Paid</p>
                      <p style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0" }}>
                        ₦{(data.totalPaid || 0).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowLog(!showLog)} 
                      className="admin-btn-primary"
                      style={{ padding: "8px 16px", fontSize: 12 }}
                    >
                      {showLog ? "Cancel" : "+ Log Payment"}
                    </button>
                  </div>

                  {/* Mini Form to Log Payment */}
                  {showLog && (
                    <div style={{ background: "var(--soft)", padding: 16, borderRadius: 12, marginBottom: 24 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Record manual payment</p>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <input 
                          type="number" 
                          placeholder="Amount (₦)" 
                          value={logAmount}
                          onChange={(e) => setLogAmount(e.target.value)}
                          className="pe-input"
                          style={{ flex: 1, padding: "8px 12px" }}
                        />
                        <select 
                          value={logPlan}
                          onChange={(e) => setLogPlan(e.target.value)}
                          className="pe-input"
                          style={{ width: 120, padding: "8px 12px" }}
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="lifetime">Lifetime</option>
                        </select>
                      </div>
                      <button 
                        onClick={handleLogPayment} 
                        disabled={logging || !logAmount}
                        className="dash-btn dash-btn-dark" 
                        style={{ width: "100%", padding: "10px" }}
                      >
                        {logging ? "Saving..." : "Save & Upgrade Store"}
                      </button>
                    </div>
                  )}

                  {/* Payment History List */}
                  <p className="admin-store-dt" style={{ marginTop: 8 }}>Payment History</p>
                  {(!data.payments || data.payments.length === 0) ? (
                    <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>No payments recorded yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                      {data.payments.map((p: any) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>₦{p.amount.toLocaleString()}</p>
                            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{formatDate(p.paid_at)} · {p.plan}</p>
                          </div>
                          <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>{p.note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-store-fields">
                  <div><span className="admin-store-dt">Owner</span><span className="admin-store-dd">{data.email}</span></div>
                  {data.whatsapp && <div><span className="admin-store-dt">WhatsApp</span><a className="admin-store-dd admin-store-link" href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">{data.whatsapp}</a></div>}
                  {data.instagram && <div><span className="admin-store-dt">Instagram</span><a className="admin-store-dd admin-store-link" href={`https://instagram.com/${data.instagram}`} target="_blank" rel="noopener">@{data.instagram}</a></div>}
                  {data.tiktok && <div><span className="admin-store-dt">TikTok</span><a className="admin-store-dd admin-store-link" href={`https://tiktok.com/@${data.tiktok}`} target="_blank" rel="noopener">@{data.tiktok}</a></div>}
                  {data.tagline && <div><span className="admin-store-dt">Tagline</span><span className="admin-store-dd">{data.tagline}</span></div>}
                  {data.address && <div><span className="admin-store-dt">Address</span><span className="admin-store-dd">{data.address}</span></div>}
                  <div><span className="admin-store-dt">Joined</span><span className="admin-store-dd">{formatDate(data.created_at)}</span></div>
                </div>
              </>
            )}
          </div>

          {data && (
            <div className="admin-store-modal-footer">
              <div className="admin-store-modal-actions">
                <a href={`/store/${data.slug}`} target="_blank" rel="noopener" className="admin-modal-btn ghost">Visit store</a>
                <button onClick={() => setShowReset(true)} className="admin-modal-btn ghost">Reset pw</button>
              </div>
              <button onClick={() => setShowDelete(true)} className="admin-modal-btn danger" style={{ width: "100%" }}>Delete store</button>
            </div>
          )}
        </div>
      </div>

      {showReset && data && <ResetPasswordModal storeId={data.id} storeName={data.name} whatsapp={data.whatsapp} onClose={() => setShowReset(false)} onDone={() => {}} />}
      {showDelete && data && <ConfirmActionModal title={`Delete "${data.name}"?`} sub="This wipes the store, its products, its visits, its payment history, and the owner's login. This cannot be undone." confirmLabel="Delete forever" danger onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />}
    </>
  );
}
