import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setBusy(true);
    try {
      await auth.signup({ storeName, whatsapp, email, password });
      await refresh();
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  // 🟢 Reusable Input Style for consistent UI
  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(26,26,26,0.15)", // Slightly darker border
    background: "rgba(255,255,255,0.6)", // Subtle off-white background
    fontSize: 15,
    color: "var(--ink)",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--muted)",
    marginBottom: 8,
  };

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="auth-wrap auth-header-inner">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark">
              <svg viewBox="0 0 60 64" width="20" height="22" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
            </span>
            Biomart
          </Link>
          <Link to="/login" className="auth-header-link">
            Log in
          </Link>
        </div>
      </header>

      <section className="auth-hero">
        <div className="auth-wrap">
          <h1 className="auth-hero-title">Open your store.</h1>
          <p className="auth-hero-lead">Free to start. Live in 60 seconds.</p>
        </div>
      </section>

      <main className="auth-main">
        <div className={`auth-form-wrap ${mounted ? "in" : ""}`}>
          <form onSubmit={onSubmit} className="auth-form" style={{ maxWidth: 440, margin: "0 auto" }}>
            
            {/* STORE NAME */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle} htmlFor="signup-store">Store Name</label>
              <input
                id="signup-store"
                type="text"
                maxLength={60}
                placeholder="e.g. Adaeze's Closet"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.15)"}
              />
            </div>

            {/* WHATSAPP */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle} htmlFor="signup-wa">WhatsApp Number</label>
              <input
                id="signup-wa"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 08012345678"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.15)"}
              />
            </div>

            {/* EMAIL */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle} htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.15)"}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle} htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(26,26,26,0.15)"}
              />
            </div>

            {/* TERMS & CONDITIONS CHECKBOX */}
            <div 
              onClick={() => setAgreed(!agreed)}
              style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: 12, 
                marginBottom: 24,
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              {/* Custom Checkbox */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  borderRadius: 6,
                  border: `1.5px solid ${agreed ? "var(--green)" : "rgba(26,26,26,0.2)"}`,
                  background: agreed ? "var(--green)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  marginTop: 2
                }}
              >
                {agreed && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </div>

              {/* Text */}
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--muted)" }}>
                I agree to the{" "}
                <Link 
                  to="/legal/terms" 
                  target="_blank" 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link 
                  to="/legal/privacy" 
                  target="_blank" 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}
                >
                  Privacy Policy
                </Link>.
              </span>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
                {error}
              </div>
            )}

            <div className="auth-submit">
              <button type="submit" disabled={busy || !agreed} style={{ height: 54, borderRadius: 12 }}>
                {busy ? "Creating store…" : "Create store"}
              </button>
            </div>
          </form>

          <p className="auth-foot" style={{ marginTop: 24 }}>
            Already have an account?{" "}
            <Link to="/login" className="auth-foot-link">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
