import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const GUIDES = [
  {
    id: "overview",
    category: "Overview",
    title: "Understanding your Dashboard",
    steps: [
      "The Overview page is your business hub.",
      "The top green card shows your Catalogue Value (the total price of all your products combined).",
      "The next two cards show your Products Live (how many items you have) and Total Photos.",
      "The Plan Card acts as a countdown timer showing exactly how many days you have left until your subscription expires."
    ]
  },
  {
    id: "add-product",
    category: "Products",
    title: "How to add a new product",
    steps: [
      "Go to the 'Products' tab in the sidebar.",
      "Click the '+ Add' button at the top right.",
      "Upload at least 1 photo (your plan determines how many photos you can add).",
      "Add a name, a price, and optionally a 'Compare At' price if you want to show a discount.",
      "Click 'Add product'. It will instantly appear on your live storefront."
    ]
  },
  {
    id: "variants",
    category: "Products",
    title: "How to add sizes or colors (Variants)",
    steps: [
      "This is a Pro feature. Free and Starter users will see a locked box.",
      "If you are on Pro, go to the 'Products' tab and click 'Edit' on any product.",
      "Scroll down to the 'Variants' section.",
      "Click '+ Add Variant'.",
      "Type the size (e.g., 'Size M') or color (e.g., 'Red').",
      "If this variant costs a different price, type it in the price box. Otherwise, leave it blank to use the base price."
    ]
  },
  {
    id: "photos",
    category: "Products",
    title: "Why can't I upload more photos?",
    steps: [
      "Your photo limit depends on your plan.",
      "Free allows 1 photo per product.",
      "Starter allows 3 photos per product.",
      "Pro allows 10 photos per product.",
      "If you try to upload more, the system will block it. Go to the 'Plan' tab to upgrade and unlock more photos."
    ]
  },
  {
    id: "upgrade",
    category: "Plans",
    title: "How to upgrade your plan",
    steps: [
      "Go to the 'Plan' tab in the sidebar.",
      "Choose between Monthly and Quarterly billing.",
      "Click 'Upgrade' on the plan you want.",
      "Because we handle payments manually, clicking upgrade will open WhatsApp.",
      "Send the message, make the bank transfer, and we will manually upgrade your account within minutes."
    ]
  },
  {
    id: "expiry",
    category: "Plans",
    title: "What happens when my plan expires?",
    steps: [
      "If your Starter or Pro plan expires, you get a 7-day grace period.",
      "During this time, your store stays live, but you cannot add new products.",
      "After 7 days, your store automatically downgrades to the Free plan (limited to 5 products).",
      "Your store link will never break, and you can upgrade again at any time."
    ]
  },
  {
    id: "settings",
    category: "Settings",
    title: "Editing your Store Settings",
    steps: [
      "Go to the 'Settings' tab.",
      "You can change your Store Name, Tagline, WhatsApp number, Instagram handle, and physical address.",
      "You can also upload a Cover Banner.",
      "If you are on a Free or Starter plan, the Biomart ad will show in your footer.",
      "Upgrading to Pro removes the ad and shows a clean footer."
    ]
  },
  {
    id: "storefront",
    category: "Storefront",
    title: "How the customer Storefront works",
    steps: [
      "This is what your customers see when they click your link.",
      "They can browse your products, search for items, and sort by price.",
      "When they click a product, a modal opens with the description and photos.",
      "If they click 'Order', it opens WhatsApp with a message detailing exactly what they want to buy.",
      "They don't need an account to buy, making it frictionless."
    ]
  },
  {
    id: "share",
    category: "Storefront",
    title: "How to share your store",
    steps: [
      "Your store link is located on the 'Overview' page.",
      "It looks like: biomart.com/store/your-name",
      "Click 'Copy' to copy the link.",
      "Click 'QR' to generate a QR code for your shop.",
      "Put this link in your Instagram bio, TikTok bio, or send it directly to customers on WhatsApp."
    ]
  }
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: "#ffe58f",
              color: "inherit",
              padding: "0 2px",
              borderRadius: 2,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return GUIDES;
    const q = search.toLowerCase();
    return GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.steps.some((s) => s.toLowerCase().includes(q)) ||
        g.category.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    setCurrentMatch(0);
    if (!search.trim()) {
      setTotalMatches(0);
      return;
    }
    let count = 0;
    const q = search.toLowerCase();
    filteredGuides.forEach((g) => {
      if (g.title.toLowerCase().includes(q)) count++;
      g.steps.forEach((s) => {
        if (s.toLowerCase().includes(q)) count++;
      });
    });
    setTotalMatches(count);
  }, [search, filteredGuides]);

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatch((prev) => (prev + 1) % totalMatches);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatch((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  useEffect(() => {
    if (!containerRef.current || totalMatches === 0) return;
    let currentCount = 0;
    const q = search.toLowerCase();
    for (let i = 0; i < filteredGuides.length; i++) {
      const g = filteredGuides[i];
      const hasTitle = g.title.toLowerCase().includes(q);
      const stepMatches = g.steps.filter((s) => s.toLowerCase().includes(q)).length;
      const matchesInGuide = (hasTitle ? 1 : 0) + stepMatches;

      if (currentMatch >= currentCount && currentMatch < currentCount + matchesInGuide) {
        const el = document.getElementById(`guide-${g.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
      currentCount += matchesInGuide;
    }
  }, [currentMatch, totalMatches, filteredGuides, search]);

  const ui = (
    <>
      {/* 🟢 FLOATING ACTION BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
        style={{
          position: "fixed",
          bottom: "calc(100px + env(safe-area-inset-bottom))",
          right: 16,
          width: 56,
          height: 56,
          background: "var(--ink)",
          color: "var(--bg)",
          border: "none",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          cursor: "pointer",
          zIndex: 90,
        }}
        aria-label="Help"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* 🟢 FULL-SCREEN MODAL ON MOBILE, CENTERED CARD ON DESKTOP */}
      {isOpen && (
        <div
          className="fixed inset-0 flex items-stretch justify-center bg-black/50 sm:items-center"
          style={{ backdropFilter: "blur(4px)", zIndex: 100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="relative flex h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[80vh] sm:max-w-[540px] sm:rounded-[20px]"
            style={{
              background: "var(--bg)",
              boxShadow: "0 24px 64px -12px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div
              className="shrink-0"
              style={{
                padding: "16px 16px 12px",
                borderBottom: "1px solid var(--line)",
                background: "var(--bg)",
                zIndex: 10,
              }}
            >
              <div style={{ position: "relative" }}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="text"
                  placeholder="Search guides..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 100px 10px 40px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--soft)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />

                {search.trim() && (
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "var(--bg)",
                      borderRadius: 6,
                      padding: "2px 4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 600,
                        marginRight: 4,
                      }}
                    >
                      {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : "0/0"}
                    </span>
                    <button
                      onClick={handlePrevMatch}
                      disabled={totalMatches === 0}
                      style={{
                        background: "none",
                        border: 0,
                        cursor: totalMatches > 0 ? "pointer" : "default",
                        color: totalMatches > 0 ? "var(--ink)" : "var(--line)",
                        display: "grid",
                        placeItems: "center",
                        padding: 2,
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={totalMatches === 0}
                      style={{
                        background: "none",
                        border: 0,
                        cursor: totalMatches > 0 ? "pointer" : "default",
                        color: totalMatches > 0 ? "var(--ink)" : "var(--line)",
                        display: "grid",
                        placeItems: "center",
                        padding: 2,
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Guide List */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto"
              style={{ padding: "16px 24px" }}
            >
              {filteredGuides.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                  <p>No results found for "{search}".</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {filteredGuides.map((g) => (
                    <div key={g.id} id={`guide-${g.id}`} style={{ scrollMarginTop: 20 }}>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--green)",
                          margin: "0 0 4px",
                        }}
                      >
                        {g.category}
                      </p>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          margin: "0 0 12px",
                          color: "var(--ink)",
                        }}
                      >
                        <Highlight text={g.title} query={search} />
                      </h3>
                      <ul
                        style={{
                          paddingLeft: 20,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {g.steps.map((step, idx) => (
                          <li
                            key={idx}
                            style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}
                          >
                            <Highlight text={step} query={search} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* 🟢 SUPPORT LINK */}
                  <div
                    style={{
                      padding: "32px 0 16px",
                      textAlign: "center",
                      borderTop: "1px dashed var(--line)",
                      marginTop: 16,
                    }}
                  >
                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                      Still stuck?
                    </p>
                    <a
                      href="https://wa.me/2347072789513?text=Hi Biomart,%20I%20need%20help%20with%20my%20store."
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                        textDecoration: "none",
                        padding: "10px 20px",
                        background: "var(--soft)",
                        borderRadius: 99,
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--soft)")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="currentColor"
                        style={{ color: "var(--green)" }}
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                      </svg>
                      Chat with Support
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // 🟢 Portal to document.body so `.dash-shell > div:last-child { ... !important }`
  // from DashboardLayout can never shift/override the FAB or modal.
  if (typeof document === "undefined") return ui;
  return createPortal(ui, document.body);
}
