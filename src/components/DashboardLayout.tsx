import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../lib/api";
import HelpWidget from "../components/HelpWidget";

const I = {
  grid: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  box: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  ),
  gear: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  bolt: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  logout: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </svg>
  ),
};

const NAV = [
  { to: "/dashboard", label: "Home", icon: I.grid, end: true },
  { to: "/dashboard/products", label: "Products", icon: I.box, end: true },
  { to: "/settings", label: "Settings", icon: I.gear, end: false },
  { to: "/plan", label: "Plan", icon: I.bolt, end: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { store, refresh } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    try {
      await auth.logout();
    } catch {
      /* ignore */
    }
    await refresh();
    nav("/login");
  }

  return (
    <div className="dash-shell">
      <style>{`
        /* 🟢 Normal scrolling header */
        .dash-topbar {
          background: rgba(251, 249, 245, 0.85);
          backdrop-filter: blur(18px) saturate(1.4);
          -webkit-backdrop-filter: blur(18px) saturate(1.4);
          border-bottom: 1px solid var(--line);
        }

        /* 🟢 Sticky Sidebar */
        @media (min-width: 900px) {
          .dash-aside {
            position: sticky;
            top: 40px; /* Adjust based on how far from the top you want it */
            height: calc(100vh - 80px);
            overflow-y: auto;
          }
        }

        /* 🟢 Glassmorphism Mobile Tab Bar */
        @media (max-width: 899px) {
          .dash-tabbar {
            display: flex !important;
            align-items: center !important;
            justify-content: space-around !important;
            
            position: fixed;
            left: 16px;
            right: 16px;
            bottom: 20px;
            z-index: 50;
            
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            border: 1px solid rgba(255,255,255,0.6);
            border-radius: 99px;
            
            padding: 8px 12px;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
          }
          
          .dash-tab {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 4px;
            padding: 8px 16px !important;
            margin: 0 !important;
            height: auto;
            line-height: 1 !important;
            font: 700 10px/1 var(--font) !important;
            letter-spacing: 0.02em;
            color: var(--muted);
            text-decoration: none;
            border-radius: 99px;
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            box-sizing: border-box;
          }
          
          .dash-tab .ic {
            width: 22px !important;
            height: 22px !important;
            flex: none;
            margin: 0 !important;
            display: block;
            transition: transform 0.3s ease;
          }
          
          .dash-tab > span {
            display: block;
            margin: 0 !important;
            line-height: 1 !important;
            transform: translateY(0);
            opacity: 0; /* Hide label by default for clean pill */
            max-height: 0;
            transition: all 0.3s ease;
          }
          
          .dash-tab.active {
            color: var(--green);
            background: rgba(15, 122, 74, 0.1);
            padding: 8px 20px !important;
          }
          .dash-tab.active .ic {
            transform: scale(1.1);
          }
          .dash-tab.active > span {
            opacity: 1;
            max-height: 20px;
            margin-top: 2px !important;
          }
          
          .dash-body { padding-bottom: 110px !important; }
          .dash-aside { display: none !important; }
          
          .dash-store-slug { display: none !important; }
          .dash-store-link { padding: 8px !important; }

          /* Push HelpWidget up */
          .dash-shell > div:last-child {
            bottom: 95px !important;
            right: 20px !important;
          }
        }
        
        @media (min-width: 900px) {
          .dash-tabbar { display: none !important; }
        }
      `}</style>

      <div className="dash-blobs" aria-hidden="true">
        <div className="dash-blob g" />
      </div>

      {/* NORMAL SCROLLING HEADER */}
      <header className="dash-topbar">
        <div className="dash-wrap dash-topbar-inner">
          <Link to="/dashboard" className="auth-brand">
            <span className="auth-brand-mark">
              <svg
                viewBox="0 0 60 64"
                width="20"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
            </span>
            Biomart
          </Link>

          <div className="dash-topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {store && (
              <a
                href={`/${store.slug}`}
                target="_blank"
                rel="noopener"
                className="dash-store-link"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                title="Visit Store"
              >
                <span className="dash-store-dot" />
                <span className="dash-store-slug" style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                  /{store.slug}
                </span>
                <span style={{ color: "var(--muted)" }}>
                  {I.external}
                </span>
              </a>
            )}
            <button 
              onClick={onLogout} 
              className="dash-logout" 
              aria-label="Log out"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {I.logout}
              <span className="dash-logout-label">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-wrap">
          <div className="dash-grid">
            
            {/* STICKY SIDEBAR */}
            <aside className="dash-aside">
              <nav className="dash-nav" aria-label="Dashboard">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `dash-nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <main className="dash-main">{children}</main>
          </div>
        </div>
      </div>

      {/* FLOATING GLASSMORPHISM MOBILE TAB BAR */}
      <nav className="dash-tabbar" aria-label="Mobile navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `dash-tab ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <HelpWidget />
    </div>
  );
}
