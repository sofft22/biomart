import { useEffect, useRef, useState } from "react";
import { adminApi, type AdminStoreDetail } from "../lib/adminApi";
import ResetPasswordModal from "./ResetPasswordModal";
import { PLAN_PRICES_MONTHLY, PLAN_PRICES_QUARTERLY } from "../lib/plans";

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
  
  // STATE FOR LOGGING PAYMENT
  const [showLog, setShowLog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter"); // default
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

  const handleLogPayment = async () => {
    setLogging(true);
    
    // 🟢 AUTO-CALCULATE PRICE FROM PLANS.TS
    let amount = 0;
    if (selectedPlan === "starter") amount = PLAN_PRICES_MONTHLY.starter;
    else if (selectedPlan === "starter_quarterly") amount = PLAN_PRICES_QUARTERLY.starter;
    else if (selectedPlan === "pro") amount = PLAN_PRICES_MONTHLY.pro;
    else if (selectedPlan === "pro_quarterly") amount = PLAN_PRICES_QUARTERLY.pro;

    try {
      await fetch(`/api/admin/stores/${storeId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan, amount, note: "Manual Upgrade" })
      });
      setShowLog(false);
      load();
    } catch (e) {
      alert("Failed to log payment");
    }
    setLogging(false);
  };

  return (
    <>
      <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="admin-store-modal" style={{ maxWidth: 560, maxHeight: "90vh", borderRadius: 20 }}>
          <button onClick={onClose} aria-label="Close" className="admin-modal-close" style={{ zIndex: 10, top: 16, right: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="admin-store-body" ref={bodyRef} style={{ paddingBottom: 32 }}>
            {loading && <p className="admin-modal-sub" style={{ padding: 32, textAlign: "center" }}>Loading…</p>}
            {error && <p className="admin-modal-sub" style={{ padding: 32, color: "var(--danger)", textAlign: "center" }}>{error}</p>}

            {data && (
              <>
                {/* 1. HEADER */}
                <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 24, background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700, margin: "0 auto 16px" }}>
                    {(data.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.2 }}>{data.name}</h3>
                  <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>/{data.slug}</p>
                </div>

                {/* 2. STATS GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "0 24px 24px" }}>
                  <div style={{ background: "var(--soft)", padding: "16px 12px", borderRadius: 12, textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Products</span>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 600, marginTop: 6 }}>{data.productCount}</span>
                  </div>
                  <div style={{ background: "var(--soft)", padding: "16px 12px", borderRadius: 12, textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Plan</span>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 600, marginTop: 6, textTransform: "capitalize" }}>{data.plan}</span>
                  </div>
                  <div style={{ background: "var(--soft)", padding: "16px 12px", borderRadius: 12, textAlign: "center" }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Expires</span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                      {data.paid_until ? formatDate(data.paid_until) : "Never"}
                    </span>
                  </div>
                </div>

                {/* 3. BILLING SECTION */}
                <div style={{ padding: "0 24px 24px" }}>
                  <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid var(--line)", background: "var(--soft)" }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", margin: 0 }}>Total Paid</p>
                        <p style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0" }}>
                          ₦{(data.totalPaid || 0).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowLog(!showLog)} 
                        className={showLog ? "admin-modal-btn ghost" : "admin-btn-primary"}
                        style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
                      >
                        {showLog ? "Cancel" : "+ Log Payment"}
                      </button>
                    </div>

                    {showLog && (
                      <div style={{ padding: 20, borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
                        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Select Plan</p>
                        <div style={{ marginBottom: 16 }}>
                          {/* 🟢 ONLY DROPDOWN, NO PRICE INPUT */}
                          <select 
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="pe-input"
                            style={{ width: "100%", padding: "12px 16px" }}
                          >
                            <option value="starter">Starter (Monthly) - ₦{PLAN_PRICES_MONTHLY.starter.toLocaleString()}</option>
                            <option value="starter_quarterly">Starter (Quarterly) - ₦{PLAN_PRICES_QUARTERLY.starter.toLocaleString()}</option>
                            <option value="pro">Pro (Monthly) - ₦{PLAN_PRICES_MONTHLY.pro.toLocaleString()}</option>
                            <option value="pro_quarterly">Pro (Quarterly) - ₦{PLAN_PRICES_QUARTERLY.pro.toLocaleString()}</option>
                          </select>
                        </div>
                        <button 
                          onClick={handleLogPayment} 
                          disabled={logging}
                          className="dash-btn dash-btn-dark" 
                          style={{ width: "100%", padding: "14px", borderRadius: 10 }}
                        >
                          {logging ? "Saving..." : "Save & Upgrade Store"}
                        </button>
                      </div>
                    )}

                    <div style={{ padding: "20px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 16 }}>Payment History</p>
                      {(!data.payments || data.payments.length === 0) ? (
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>No payments recorded yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {data.payments.map((p: any) => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>₦{p.amount.toLocaleString()}</p>
                                <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{formatDate(p.paid_at)} · {p.plan}</p>
                              </div>
                              <span style={{ fontSize: 10, background: "var(--soft)", padding: "6px 10px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase", color: "var(--green)" }}>{p.note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* 4. STORE INFO */}
                <div style={{ padding: "0 24px" }}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 16 }}>Store Information</h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Owner Email</span>
                      <span style={{ fontSize: 13, fontWeight: 500, wordBreak: "break-all", textAlign: "right", marginLeft: 16 }}>{data.email}</span>
                    </div>
                    
                    {data.whatsapp && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>WhatsApp</span>
                        <a className="admin-store-link" href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 500 }}>{data.whatsapp}</a>
                      </div>
                    )}
                    
                    {data.address && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>Address</span>
                        <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", marginLeft: 16 }}>{data.address}</span>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Joined Date</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(data.created_at)}</span>
                    </div>
                  </div>

                  {/* ACTIONS AT THE END */}
                  <div style={{ display: "flex", gap: 12, marginTop: 32, paddingBottom: 16 }}>
                    <a href={`/store/${data.slug}`} target="_blank" rel="noopener" className="admin-modal-btn ghost" style={{ flex: 1, textAlign: "center", padding: "14px" }}>
                      Visit Store ↗
                    </a>
                    <button onClick={() => setShowReset(true)} className="admin-modal-btn ghost" style={{ flex: 1, padding: "14px" }}>
                      Reset Password
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showReset && data && <ResetPasswordModal storeId={data.id} storeName={data.name} whatsapp={data.whatsapp} onClose={() => setShowReset(false)} onDone={() => {}} />}
    </>
  );
}

