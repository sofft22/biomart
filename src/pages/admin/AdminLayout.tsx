import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/api";

const I = {
  home: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  store: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  ),
  card: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  gear: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  logout: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const NAV = [
  { to: "/admin", label: "Overview", icon: I.home, end: true },
  { to: "/admin/stores", label: "Stores", icon: I.store, end: true },
  { to: "/admin/billing", label: "Billing", icon: I.card, end: true },
  { to: "/admin/settings", label: "Settings", icon: I.gear, end: true },
];

export default function AdminLayout() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [hidden, setHidden] = useState(false);

  async function onLogout() {
    try {
      await auth.logout();
    } catch {}
    await refresh();
    nav("/login");
  }

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) > 6) {
          if (delta > 0 && y > 80) setHidden(true);
          else if (delta < 0) setHidden(false);
          lastY = y;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="dash-shell">
      <style>{`
        .dash-topbar {
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .dash-topbar.is-hidden { transform: translateY(-110%); }

        @media (max-width: 899px) {
          .dash-tabbar {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            align-items: center !important;
            justify-items: stretch !important;
            position: fixed;
            left: 0; right: 0; bottom: 0;
            z-index: 50;
            background: rgba(251, 249, 245, 0.96);
            backdrop-filter: blur(18px) saturate(1.4);
            -webkit-backdrop-filter: blur(18px) saturate(1.4);
            border-top: 1px solid var(--line);
            padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
            gap: 4px;
            height: auto;
          }
          .dash-tab {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px;
            padding: 8px 4px !important;
            margin: 0 !important;
            height: 52px;
            line-height: 1 !important;
            font: 700 10px/1 var(--font) !important;
            letter-spacing: 0.01em;
            color: var(--muted);
            text-decoration: none;
            border-radius: 12px;
            box-sizing: border-box;
          }
          .dash-tab .ic {
            width: 22px !important;
            height: 22px !important;
            flex: none;
            display: block;
          }
          .dash-tab.active {
            color: var(--ink);
            background: rgba(15, 122, 74, 0.07);
          }
          .dash-tab.active .ic { color: var(--green); }
          .dash-body { padding-bottom: 92px !important; }
          .dash-aside { display: none !important; }
        }
        @media (min-width: 900px) {
          .dash-tabbar { display: none !important; }
        }
      `}</style>

      <div className="dash-blobs" aria-hidden="true">
        <div className="dash-blob g" />
      </div>

      <header className={`dash-topbar ${hidden ? "is-hidden" : ""}`}>
        <div className="dash-wrap dash-topbar-inner">
          <Link to="/admin" className="auth-brand">
            <span className="auth-brand-mark">
              <svg viewBox="0 0 60 64" width="20" height="22" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
            </span>
            Biomart <em style={{ fontStyle: "normal", opacity: 0.45, marginLeft: 2 }}>Admin</em>
          </Link>

          <div className="dash-topbar-right">
            <button onClick={onLogout} className="dash-logout" aria-label="Log out">
              {I.logout}
              <span className="dash-logout-label">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-wrap">
          <div className="dash-grid">
            <aside className="dash-aside">
              <nav className="dash-nav" aria-label="Admin">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <main className="dash-main">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <nav className="dash-tabbar" aria-label="Admin mobile navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `dash-tab ${isActive ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}