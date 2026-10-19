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
  
  // STATE FOR LOGGING PAYMENT
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
      await fetch(`/api/admin/stores/${storeId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: Number(logAmount), plan: logPlan, note: "Manual Admin Upgrade" })
      });
      setShowLog(false);
      setLogAmount("");
      load();
    } catch (e) {
      alert("Failed to log payment");
    }
    setLogging(false);
  };

  return (
    <>
      <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="admin-store-modal" style={{ maxWidth: 600 }}>
          <button onClick={onClose} aria-label="Close" className="admin-modal-close" style={{ zIndex: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="16" height="16">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="admin-store-body" ref={bodyRef} style={{ paddingBottom: 0 }}>
            {loading && <p className="admin-modal-sub" style={{ padding: 26 }}>Loading…</p>}
            {error && <p className="admin-modal-sub" style={{ padding: 26, color: "var(--danger)" }}>{error}</p>}

            {data && (
              <>
                {/* 🟢 HERO BANNER & HEADER */}
                <div style={{ position: "relative" }}>
                  {data.cover_url ? (
                    <div style={{ height: 140, width: "100%", background: "var(--line)" }}>
                      <img src={data.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ height: 80, width: "100%", background: "var(--soft)" }} />
                  )}
                  
                  <div style={{ padding: "0 26px", marginTop: data.cover_url ? -30 : 20, position: "relative", display: "flex", alignItems: "flex-end", gap: 16 }}>
                    <div className="admin-store-avatar-lg" style={{ width: 64, height: 64, fontSize: 24, border: "4px solid var(--bg)", background: "var(--ink)", color: "#fff" }}>
                      {(data.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ paddingBottom: 6 }}>
                      <h3 className="admin-store-title" style={{ fontSize: 20, margin: 0 }}>{data.name}</h3>
                      <p className="admin-store-sub" style={{ fontSize: 13, margin: 0 }}>/{data.slug}</p>
                    </div>
                  </div>
                </div>

                {/* 🟢 STATS GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "24px 26px" }}>
                  <div style={{ background: "var(--soft)", padding: 16, borderRadius: 12 }}>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Products</span>
                    <span style={{ display: "block", fontSize: 20, fontWeight: 600, marginTop: 4 }}>{data.productCount}</span>
                  </div>
                  <div style={{ background: "var(--soft)", padding: 16, borderRadius: 12 }}>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plan</span>
                    <span style={{ display: "block", fontSize: 20, fontWeight: 600, marginTop: 4, textTransform: "capitalize" }}>{data.plan}</span>
                  </div>
                  <div style={{ background: "var(--soft)", padding: 16, borderRadius: 12 }}>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expires</span>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600, marginTop: 6 }}>
                      {data.paid_until ? formatDate(data.paid_until) : "Never"}
                    </span>
                  </div>
                </div>

                {/* 🟢 BILLING & PAYMENTS */}
                <div style={{ padding: "0 26px 24px" }}>
                  <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
                    
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--soft)" }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Total Paid</p>
                        <p style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>
                          ₦{(data.totalPaid || 0).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowLog(!showLog)} 
                        className={showLog ? "admin-modal-btn ghost" : "admin-btn-primary"}
                        style={{ padding: "8px 16px", fontSize: 12 }}
                      >
                        {showLog ? "Cancel" : "+ Log Payment"}
                      </button>
                    </div>

                    {/* Log Form */}
                    {showLog && (
                      <div style={{ padding: 20, borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Record manual payment</p>
                        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                          <input 
                            type="number" 
                            placeholder="Amount (₦)" 
                            value={logAmount}
                            onChange={(e) => setLogAmount(e.target.value)}
                            className="pe-input"
                            style={{ flex: 1, minWidth: 120, padding: "10px 14px" }}
                          />
                          <select 
                            value={logPlan}
                            onChange={(e) => setLogPlan(e.target.value)}
                            className="pe-input"
                            style={{ width: 130, padding: "10px 14px" }}
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
                          style={{ width: "100%", padding: "12px" }}
                        >
                          {logging ? "Saving..." : "Save & Upgrade Store"}
                        </button>
                      </div>
                    )}

                    {/* History List */}
                    <div style={{ padding: "16px 20px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Payment History</p>
                      {(!data.payments || data.payments.length === 0) ? (
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>No payments recorded yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {data.payments.map((p: any) => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>₦{p.amount.toLocaleString()}</p>
                                <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{formatDate(p.paid_at)} · {p.plan}</p>
                              </div>
                              <span style={{ fontSize: 11, background: "var(--soft)", padding: "4px 8px", borderRadius: 6, fontWeight: 600, color: "var(--green)" }}>{p.note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* 🟢 STORE DETAILS */}
                <div style={{ padding: "0 26px 26px" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 12 }}>Store Information</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <div><span className="admin-store-dt">Owner Email</span><span className="admin-store-dd">{data.email}</span></div>
                    {data.whatsapp && <div><span className="admin-store-dt">WhatsApp</span><a className="admin-store-dd admin-store-link" href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">{data.whatsapp}</a></div>}
                    {data.instagram && <div><span className="admin-store-dt">Instagram</span><a className="admin-store-dd admin-store-link" href={`https://instagram.com/${data.instagram}`} target="_blank" rel="noopener">@{data.instagram}</a></div>}
                    {data.tiktok && <div><span className="admin-store-dt">TikTok</span><a className="admin-store-dd admin-store-link" href={`https://tiktok.com/@${data.tiktok}`} target="_blank" rel="noopener">@{data.tiktok}</a></div>}
                    {data.tagline && <div style={{ gridColumn: "1 / -1" }}><span className="admin-store-dt">Tagline</span><span className="admin-store-dd">{data.tagline}</span></div>}
                    {data.address && <div style={{ gridColumn: "1 / -1" }}><span className="admin-store-dt">Address</span><span className="admin-store-dd">{data.address}</span></div>}
                    <div><span className="admin-store-dt">Joined Date</span><span className="admin-store-dd">{formatDate(data.created_at)}</span></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 🟢 FOOTER */}
          {data && (
            <div className="admin-store-modal-footer" style={{ padding: "16px 26px", background: "var(--soft)", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <a href={`/store/${data.slug}`} target="_blank" rel="noopener" className="admin-modal-btn ghost" style={{ flex: 1, textAlign: "center" }}>Visit Store</a>
                <button onClick={() => setShowReset(true)} className="admin-modal-btn ghost" style={{ flex: 1 }}>Reset Password</button>
              </div>
              <button onClick={() => setShowDelete(true)} className="admin-modal-btn danger" style={{ width: "100%", background: "#B3261E", color: "#fff", border: 0 }}>
                Delete Store Permanently
              </button>
            </div>
          )}
        </div>
      </div>

      {showReset && data && <ResetPasswordModal storeId={data.id} storeName={data.name} whatsapp={data.whatsapp} onClose={() => setShowReset(false)} onDone={() => {}} />}
      {showDelete && data && <ConfirmActionModal title={`Delete "${data.name}"?`} sub="This wipes the store, its products, its visits, its payment history, and the owner's login. This cannot be undone." confirmLabel="Delete forever" danger onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />}
    </>
  );
}
