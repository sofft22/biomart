import { useCart } from "../context/CartContext";
import { useStoreContext } from "../context/StoreContext";
import { naira } from "../lib/format";
import { buildCartOrderLink } from "../lib/whatsapp";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, total, changeQty, remove, clear } = useCart();
  const { store } = useStoreContext();

  const sendOrder = () => {
    if (!store || !items || items.length === 0) return;
    try {
      const url = buildCartOrderLink(store, items);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error building WhatsApp link:", error);
    }
  };

  if (!store) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(10,10,10,0.6)", backdropFilter: "blur(4px)" }}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[100] w-full sm:max-w-[440px] flex flex-col transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--bg)",
          color: "var(--ink)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          boxShadow: "-20px 0 60px -20px rgba(0,0,0,0.3)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-center justify-between"
          style={{
            height: 64,
            paddingLeft: 24,
            paddingRight: 20,
            borderBottom: "1px solid var(--line)",
          }}
        >
          {/* Mobile Drag Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-black/10 sm:hidden" />
          
          <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
            Your Bag ({items.length})
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ width: 36, height: 36, borderRadius: "50%", color: "var(--ink)", background: "transparent", border: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 18, height: 18 }}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full" style={{ padding: "0 32px" }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "var(--mat)",
                  marginBottom: 24,
                  color: "var(--muted)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                Your bag is empty
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
                Looks like you haven't added anything yet.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: 32,
                  padding: "16px 32px",
                  border: 0,
                  borderRadius: 12,
                  background: "var(--ink)",
                  color: "var(--bg)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  width: "100%",
                  maxWidth: 240
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div>
              {items.map((it, i) => (
                <div
                  key={it.key || i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "24px 20px",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {/* Thumb */}
                  <div
                    style={{
                      width: 84,
                      height: 104,
                      backgroundColor: "var(--mat)",
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            color: "var(--ink)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textTransform: "capitalize",
                          }}
                        >
                          {it.name}
                        </p>
                        {it.variant && (
                          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, marginBottom: 0, textTransform: "capitalize" }}>
                            {it.variant}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => remove(i)}
                        aria-label="Remove item"
                        className="transition-colors hover:text-red-600"
                        style={{
                          background: "transparent",
                          border: 0,
                          padding: 4,
                          color: "var(--muted)",
                          cursor: "pointer",
                          display: "flex",
                          flexShrink: 0
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}>
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>

                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--ink)",
                        marginTop: 8,
                        marginBottom: 0,
                      }}
                    >
                      {naira(it.unitPrice * it.qty)}
                    </p>

                    {/* Qty Stepper */}
                    <div style={{ marginTop: "auto", paddingTop: 16 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid var(--line)",
                          borderRadius: 100, // Pill shape
                          padding: 2,
                        }}
                      >
                        <button
                          onClick={() => changeQty(i, -1)}
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "transparent",
                            border: 0,
                            borderRadius: "50%",
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M5 12h14" /></svg>
                        </button>
                        <span
                          style={{
                            width: 32,
                            textAlign: "center",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--ink)",
                          }}
                        >
                          {it.qty}
                        </span>
                        <button
                          onClick={() => changeQty(i, 1)}
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "transparent",
                            border: 0,
                            borderRadius: "50%",
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear bag */}
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <button
                  onClick={clear}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 4
                  }}
                >
                  Clear entire bag
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--line)",
              padding: "24px 20px",
              paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
              backgroundColor: "var(--bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                Subtotal
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {naira(total)}
              </span>
            </div>

            <button
              onClick={sendOrder}
              className="transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "18px 24px",
                border: 0,
                borderRadius: 12,
                backgroundColor: "#0F7A4A",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.05em",
                cursor: "pointer",
                boxShadow: "0 10px 20px -10px rgba(15,122,74,0.4)"
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
              </svg>
              Checkout on WhatsApp
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
