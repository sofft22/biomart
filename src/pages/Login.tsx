import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await auth.login(email, password);
      await refresh();
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  // 🟢 WHATSAPP SUPPORT LINK
  const whatsappUrl = `https://wa.me/2347072789513?text=${encodeURIComponent(
    `Hi Biomart, I forgot my password for ${email || "[my email]"}. Please help me reset it.`
  )}`;

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
          <Link to="/signup" className="auth-header-link">
            Create store
          </Link>
        </div>
      </header>

      <section className="auth-hero">
        <div className="auth-wrap">
          <h1 className="auth-hero-title">Welcome back.</h1>
          <p className="auth-hero-lead">Log in to manage your store.</p>
        </div>
      </section>

      <main className="auth-main">
        <div className={`auth-form-wrap ${mounted ? "in" : ""}`}>
          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* 🟢 FORGOT PASSWORD WHATSAPP LINK */}
              <a 
                href={whatsappUrl}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <div className="auth-submit">
              <button type="submit" disabled={busy}>
                {busy ? "Logging in…" : "Log in"}
              </button>
            </div>
          </form>

          <p className="auth-foot">
            Don't have a store?{" "}
            <Link to="/signup" className="auth-foot-link">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
