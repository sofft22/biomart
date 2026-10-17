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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
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
          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-store">Store name</label>
              <input
                id="signup-store"
                type="text"
                maxLength={60}
                placeholder="Adaeze's Closet"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-wa">WhatsApp number</label>
              <input
                id="signup-wa"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08012345678"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
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
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <div className="auth-submit">
              <button type="submit" disabled={busy}>
                {busy ? "Creating store…" : "Create store"}
              </button>
            </div>
          </form>

          <p className="auth-foot">
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