import { useCart } from "../context/CartContext";
import { useStoreContext } from "../context/StoreContext";
import { naira } from "../lib/format";
import { buildCartOrderLink } from "../lib/whatsapp";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CREAM = "#FBF9F5";
const CREAM_DARK = "#EDE8E0";
const CHARCOAL = "#1A1A1A";
const BRAND_GREEN = "#0F7A4A";
const MUTED = "rgba(26,26,26,0.5)";

export default function CartDrawer({ open, onClose }: Props) {
  const { items, total, changeQty, remove, clear } = useCart();
  const { store } = useStoreContext();

  const sendOrder = () => {
    if (!store || !items.length) return;
    const url = buildCartOrderLink(store, items);
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(10,10,10,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[100] w-full max-w-[440px] flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: CREAM,
          color: CHARCOAL,
          paddingTop: "env(safe-area-inset-top, 0px)",
          boxShadow: "-20px 0 60px -20px rgba(0,0,0,0.3)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            height: 64,
            paddingLeft: 24,
            paddingRight: 20,
            borderBottom: `1px solid ${CREAM_DARK}`,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
            Bag
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition-colors"
            style={{ width: 36, height: 36, borderRadius: 10, color: CHARCOAL, background: "transparent", border: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_GREEN)}
            onMouseLeave={(e) => (e.currentTarget.style.color = CHARCOAL)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 16, height: 16 }}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: "120px 32px" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: CREAM_DARK,
                  marginBottom: 20,
                  color: MUTED,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: CHARCOAL, margin: 0 }}>
                Your bag is empty
              </p>
              <p style={{ fontSize: 13, color: MUTED, marginTop: 6, marginBottom: 0 }}>
                Add something you love.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: 24,
                  padding: "14px 24px",
                  border: 0,
                  borderRadius: 10,
                  background: CHARCOAL,
                  color: CREAM,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Keep shopping
              </button>
            </div>
          ) : (
            <div>
              {items.map((it, i) => (
                <div
                  key={it.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    gap: 16,
                    padding: "20px 24px",
                    borderBottom: `1px solid ${CREAM_DARK}`,
                  }}
                >
                  {/* Thumb */}
                  <div
                    style={{
                      width: 80,
                      height: 100,
                      backgroundColor: CREAM_DARK,
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
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                        color: CHARCOAL,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.name}
                    </p>

                    {it.variant && (
                      <p style={{ fontSize: 12, color: MUTED, marginTop: 4, marginBottom: 0 }}>
                        {it.variant}
                      </p>
                    )}

                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: CHARCOAL,
                        marginTop: 6,
                        marginBottom: 0,
                      }}
                    >
                      {naira(it.unitPrice)}
                    </p>

                    {/* Qty + remove */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      {/* Qty stepper — outlined, rounded, matching ProductModal */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "stretch",
                          border: `1px solid ${CREAM_DARK}`,
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <button
                          onClick={() => changeQty(i, -1)}
                          aria-label="Decrease"
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "transparent",
                            border: 0,
                            color: CHARCOAL,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 600,
                            color: CHARCOAL,
                            borderLeft: `1px solid ${CREAM_DARK}`,
                            borderRight: `1px solid ${CREAM_DARK}`,
                          }}
                        >
                          {it.qty}
                        </span>
                        <button
                          onClick={() => changeQty(i, 1)}
                          aria-label="Increase"
                          style={{
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "transparent",
                            border: 0,
                            color: CHARCOAL,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => remove(i)}
                        style={{
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: MUTED,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#B3261E")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear bag */}
              <div style={{ padding: "16px 24px" }}>
                <button
                  onClick={clear}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: MUTED,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#B3261E")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                >
                  Clear bag
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: `1px solid ${CREAM_DARK}`,
              padding: "20px 24px",
              paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
              backgroundColor: CREAM,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: CHARCOAL,
                }}
              >
                {naira(total)}
              </span>
            </div>

            {/* CTA — matches ProductModal "Order" button exactly */}
            <button
              onClick={sendOrder}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 24px",
                border: 0,
                borderRadius: 10,
                backgroundColor: BRAND_GREEN,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0A5D38")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
              </svg>
              Order
            </button>
          </div>
        )}
      </aside>
    </>
  );
}