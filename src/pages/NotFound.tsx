import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { store } = useAuth();
  
  // If they are on a storefront, send them to the store. Otherwise, home.
  const homeLink = store?.slug ? `/${store.slug}` : "/";

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        background: "var(--bg)", 
        padding: "24px",
        fontFamily: "var(--font)"
      }}
    >
      <div 
        style={{ 
          maxWidth: 480, 
          width: "100%", 
          textAlign: "center",
          animation: "sf-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both"
        }}
      >
        {/* Minimal Icon */}
        <div 
          style={{ 
            width: 64, 
            height: 64, 
            margin: "0 auto 24px", 
            borderRadius: "50%", 
            background: "var(--soft)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "var(--muted)"
          }}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </div>

        {/* 404 Text */}
        <h1 
          style={{ 
            fontFamily: "var(--serif)", 
            fontSize: "clamp(4rem, 10vw, 6rem)", 
            fontWeight: 400, 
            letterSpacing: "-0.04em",
            lineHeight: 1,
            margin: "0 0 16px",
            color: "var(--ink)"
          }}
        >
          404.
        </h1>

        <h2 
          style={{ 
            fontSize: "clamp(1.2rem, 3vw, 1.5rem)", 
            fontWeight: 600, 
            margin: "0 0 12px", 
            color: "var(--ink)" 
          }}
        >
          Page not found
        </h2>
        
        <p 
          style={{ 
            fontSize: 15, 
            lineHeight: 1.6, 
            color: "var(--muted)", 
            margin: "0 0 32px",
            maxWidth: 340,
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "row", 
            gap: 12, 
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <Link 
            to={homeLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 24px",
              background: "var(--ink)",
              color: "var(--bg)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "opacity 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            Back to home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 24px",
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--soft)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            Go back
          </button>
        </div>

      </div>
    </div>
  );
}
