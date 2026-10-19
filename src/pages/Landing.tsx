import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const I = {
  logoBag: (
    <svg viewBox="0 0 60 64" width="22" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
      <path d="M20 26V14A10 10 0 0 1 40 14V26" />
    </svg>
  ),
  x: <svg className="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  tick: <svg className="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>,
  arrow: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowSm: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  sliders: <svg className="ic" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M13 5v4M4 17h3M11 17h9M7 15v4"/></svg>,
  tag: <svg className="ic" viewBox="0 0 24 24"><path d="M3 12V4h8l9 9-8 8-9-9z"/><path d="M7.5 8.5h.01"/></svg>,
  bolt: <svg className="ic" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

const SIGNUP_URL = "/signup";
const WHATSAPP = "2347072789513";

const IMG = {
  tote:     "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&q=85&auto=format&fit=crop",
  sneakers: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=85&auto=format&fit=crop",
  shea:     "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=85&auto=format&fit=crop",
  hat:      "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500&q=85&auto=format&fit=crop",
  perfume:  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=85&auto=format&fit=crop",
  bag2:     "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=85&auto=format&fit=crop",
  banner:   "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=85&auto=format&fit=crop",
};

function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      items.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function useNavHide() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY;
      if (y < 20) setHidden(false);
      else if (diff > 6 && y > 200) setHidden(true);
      else if (diff < -6) setHidden(false);
      lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      tx = (mx - 0.5) * 22;
      ty = (my - 0.5) * -22;
      hovering = true;
    };
    const onLeave = () => {
      tx = 0; ty = 0; hovering = false;
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--tx", `${cy}deg`);
      el.style.setProperty("--ty", `${cx}deg`);
      el.style.setProperty("--lift", hovering ? "10px" : "0px");
      raf = requestAnimationFrame(loop);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

function CountUp({ to, suffix = "", duration = 1200 }: { to: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{Math.round(n).toLocaleString()}{suffix}</span>;
}

function StorefrontMock() {
  const products = [
    { img: IMG.tote,     name: "Ankara tote",  price: "₦20,500" },
    { img: IMG.sneakers, name: "Sneakers",     price: "₦32,000" },
    { img: IMG.shea,     name: "Shea butter",  price: "₦6,500" },
    { img: IMG.hat,      name: "Sun hat",      price: "₦9,800" },
    { img: IMG.perfume,  name: "Perfume",      price: "₦14,000" },
    { img: IMG.bag2,     name: "Leather bag",  price: "₦45,000" },
  ];

  return (
    <div className="sf-mock">
      <div className="sf-mock-head">
        <span className="sf-mock-brand">
          <span className="text-green">{I.logoBag}</span>
          Soft Closet
        </span>
        <span className="sf-mock-icons">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        </span>
      </div>
      <div className="sf-mock-banner" style={{ backgroundImage: `url(${IMG.banner})` }}>
        <span>Where Lagos style meets luxury</span>
      </div>
      <div className="sf-mock-section">
        <span className="sf-mock-title">New arrivals</span>
        <span className="sf-mock-seeall">SEE ALL →</span>
      </div>
      <div className="sf-mock-grid-5">
        {products.map((p, i) => (
          <div key={i} className="sf-mock-card">
            <div className="sf-mock-media">
              <img src={p.img} alt={p.name} loading="lazy" />
            </div>
            <b>{p.name}</b>
            <span>{p.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [billing, setBilling] = useState<"m" | "q">("m");
  const [legalOpen, setLegalOpen] = useState<null | "privacy" | "terms" | "refunds">(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useReveal();
  useTilt(phoneRef);
  const navHidden = useNavHide();

  const wa = (msg: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  // 🟢 TEXT-ONLY TICKER
  const audience = ["Hair", "Fashion", "Skincare", "Food", "Shoes", "Boutiques", "Thrift", "Accessories"];

  const legalContent = {
    privacy: {
      title: "Privacy Policy",
      body: "We collect only what's needed to run your store: your email, store details, and product data. We never sell your data. Payments are handled by third parties. You can delete your account and all data at any time from Settings.",
    },
    terms: {
      title: "Terms of Service",
      body: "Biomart gives you a storefront link to sell products via WhatsApp. You are responsible for the products you sell and the accuracy of your listings. We provide the platform as-is and may suspend accounts that violate our acceptable use policy.",
    },
    refunds: {
      title: "Refund Policy",
      body: "Free plan: no charge. Paid plans: cancel anytime, no refunds for partial periods. Lifetime: one-time payment, non-refundable once activated. If you believe you were charged in error, contact support within 14 days.",
    },
  };

  return (
    <>
      <nav className={`nav ${navHidden ? "nav-hidden" : ""}`}>
        <div className="wrap nav-inner">
          <a href="#top" className="nav-brand">
            <span className="text-green">{I.logoBag}</span>
            Biomart
          </a>
          <div className="nav-links">
            <a href="#how" className="nav-link">How it works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">Questions</a>
          </div>
          <Link to={SIGNUP_URL} className="nav-cta">
            Create your store {I.arrowSm}
          </Link>
        </div>
      </nav>

      <main id="top">
        <header className="hero">
          <div className="wrap hero-grid">
            <div className="hero-head">
              <span className="eyebrow">Storefront for sellers</span>
              <h1 className="h-hero">Your bio link, but it sells.</h1>
              
              <div className="hero-ctas">
                <Link to={SIGNUP_URL} className="btn btn--lg">
                  Create your store {I.arrow}
                </Link>
                <a href="#how" className="link">See how it works</a>
              </div>
            </div>

            <div className="hero-visual">
              <div className="phone-3d" ref={phoneRef}>
                <div className="phone-notch" />
                <StorefrontMock />
              </div>
            </div>
          </div>

          <div className="wrap">
            <div className="hero-stats reveal">
              <div className="stat">
                <div className="stat-num"><CountUp to={250} suffix="+" /></div>
                <div className="stat-label">Stores live</div>
              </div>
              <div className="stat">
                <div className="stat-num"><CountUp to={5000} suffix="+" /></div>
                <div className="stat-label">Products listed</div>
              </div>
              <div className="stat stat-hide-mobile">
                <div className="stat-num"><CountUp to={100} suffix="%" /></div>
                <div className="stat-label">WhatsApp native</div>
              </div>
              <div className="stat">
                <div className="stat-num"><CountUp to={60} suffix=" sec" /></div>
                <div className="stat-label">To setup</div>
              </div>
            </div>
          </div>
        </header>

        {/* 🟢 TEXT-ONLY TICKER */}
        <div className="serve-strip">
          <div className="marquee-track">
            {[...audience, ...audience, ...audience].map((a, i) => (
              <div key={i} className="serve-item" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>{a}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--line)" }} />
              </div>
            ))}
          </div>
        </div>

        <section className="sec">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Why Biomart</span>
              <h2 className="h-section">Still selling from your DMs?</h2>
            </div>
            <div className="ba">
              <div className="ba-card no reveal">
                <h3>Without Biomart</h3>
                <ul>
                  <li>{I.x}Price list screenshots in every chat</li>
                  <li>{I.x}"How much?" forty times a day</li>
                  <li>{I.x}Orders buried in your inbox</li>
                  <li>{I.x}No way to show what's sold out</li>
                </ul>
              </div>
              <div className="ba-card yes reveal">
                <h3>With Biomart</h3>
                <ul>
                  <li>{I.tick}One link with your full catalogue</li>
                  <li>{I.tick}Photos, sizes and prices together</li>
                  <li>{I.tick}Orders arrive pre-filled on WhatsApp</li>
                  <li>{I.tick}Mark sold out in one tap</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 🟢 "HOW IT WORKS" EXACTLY AS SCREENSHOT */}
        <section className="sec bg-soft" id="how">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">How it works</span>
              <h2 className="h-section">From zero to live in 2 minutes.</h2>
            </div>
            <div className="steps">
              <div className="step reveal">
                <span className="n">1</span>
                <h3>Build your catalogue</h3>
                <p>Add your products, upload photos, set your prices, and organize them effortlessly.</p>
              </div>
              <div className="step reveal">
                <span className="n">2</span>
                <h3>Share your link</h3>
                <p>Put your unique Biomart link in your Instagram bio, TikTok, or send it directly to customers.</p>
              </div>
              <div className="step reveal">
                <span className="n">3</span>
                <h3>Close the sale</h3>
                <p>Customers browse your store, tap "Order", and it opens WhatsApp with the exact items pre-filled.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="features">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Features</span>
              <h2 className="h-section">Built for modern sellers.</h2>
            </div>
            <div className="feat3">
              <div className="feat reveal">
                <div className="iconbox">{I.sliders}</div>
                <h3>Sizes & Variants</h3>
                <p>Add different sizes or colors. Customers pick exactly what they want, and the price adjusts automatically.</p>
              </div>
              <div className="feat reveal">
                <div className="iconbox">{I.tag}</div>
                <h3>Discount Pricing</h3>
                <p>Show a "Compare At" price to display discounts. Cross out the old price and highlight the deal.</p>
              </div>
              <div className="feat reveal">
                <div className="iconbox">{I.bolt}</div>
                <h3>WhatsApp Native</h3>
                <p>No complicated checkout. Customers tap "Order" and their WhatsApp opens with the item and total ready to send.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🟢 FIXED PRICING PAGE (Exactly like app) */}
        <section className="sec bg-soft" id="pricing">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Pricing</span>
              <h2 className="h-section">Start free. Upgrade when you're ready.</h2>
            </div>

            <div className="switch-wrap reveal">
              <div className="switch" role="group" aria-label="Billing">
                <button type="button" aria-pressed={billing === "m"} onClick={() => setBilling("m")}>
                  Monthly
                </button>
                <button type="button" aria-pressed={billing === "q"} onClick={() => setBilling("q")}>
                  Quarterly <span style={{ fontSize: 10, background: "var(--green)", color: "#fff", padding: "2px 6px", borderRadius: 99, marginLeft: 6 }}>Save 8%</span>
                </button>
              </div>
            </div>

            <div className="plans" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              
              {/* FREE */}
              <div className="plan reveal">
                <h3>Free</h3>
                <p className="desc">Test the waters.</p>
                <div className="p"><span>₦0</span></div>
                <ul>
                  <li>5 products</li>
                  <li>1 photo per product</li>
                  <li>WhatsApp orders</li>
                  <li className="no">No variants</li>
                  <li className="no">Biomart ad on storefront</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Start free</Link>
              </div>

              {/* STARTER */}
              <div className="plan reveal">
                <h3>Starter</h3>
                <p className="desc">For the casual seller.</p>
                <div className="p">
                  <span>{billing === "m" ? "₦2,000" : "₦5,500"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/quarter"}</span>
                </div>
                <ul>
                  <li>15 products</li>
                  <li>3 photos per product</li>
                  <li>WhatsApp orders</li>
                  <li className="no">No variants</li>
                  <li className="no">Biomart ad on storefront</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Get Starter</Link>
              </div>

              {/* PRO */}
              <div className="plan pop reveal">
                <span className="badge">Most Popular</span>
                <h3>Pro</h3>
                <p className="desc">For serious brands.</p>
                <div className="p">
                  <span>{billing === "m" ? "₦5,000" : "₦13,500"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/quarter"}</span>
                </div>
                <ul>
                  <li>Unlimited products</li>
                  <li>10 photos per product</li>
                  <li>WhatsApp orders</li>
                  <li className="tick">Product variants (Sizes/Colors)</li>
                  <li className="tick">No Biomart ad</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn">Get Pro</Link>
              </div>

              {/* CUSTOM */}
              <div className="plan custom-plan reveal" style={{ borderStyle: "dashed", background: "var(--soft)" }}>
                <h3>Custom E-commerce</h3>
                <p className="desc">A full online store.</p>
                <div className="p">
                  <span style={{ fontSize: 20 }}>Custom Quote</span>
                </div>
                <ul>
                  <li>Your own domain</li>
                  <li>Full cart & checkout</li>
                  <li>Paystack / Card payments</li>
                  <li>Priority support</li>
                </ul>
                <a
                  href={wa("Hi Biomart, I'd like a quote for a custom e-commerce website.")}
                  className="btn line"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact Sales {I.arrow}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Questions</span>
              <h2 className="h-section">Everything you need to know.</h2>
            </div>
            <div className="faqgrid reveal">
              <details>
                <summary>Do my customers need an account to buy?</summary>
                <p>No. Your customers simply tap your link, browse your products, and tap "Order". It opens their WhatsApp with the order details pre-filled. They never have to create an account or download an app.</p>
              </details>
              <details>
                <summary>Do I need to build a website?</summary>
                <p>Not at all. Biomart is your website. We give you a clean, professional storefront link (like <code>biomart.com/store/your-name</code>) that you can put in your Instagram bio, TikTok, or send directly to customers.</p>
              </details>
              <details>
                <summary>How do I collect payments?</summary>
                <p>Exactly how you do now. The customer messages you on WhatsApp, and you arrange payment via bank transfer, cash, or POS. We don't touch your money, so there are no transaction fees or delays.</p>
              </details>
              <details>
                <summary>Can I try it for free?</summary>
                <p>Yes. The Free plan lets you add up to 5 products with 1 photo each. You don't need a credit card to start. Upgrade only when you need more space.</p>
              </details>
              <details>
                <summary>What is the difference between Starter and Pro?</summary>
                <p>Starter is for casual sellers with up to 15 products. Pro is for serious brands: you get unlimited products, 10 photos per product, and you can add Variants (like Sizes and Colors). Pro also removes all Biomart ads from your storefront.</p>
              </details>
              <details>
                <summary>What is the Custom E-commerce plan?</summary>
                <p>If you want a traditional website with a shopping cart, a custom domain, and automated card payments (via Paystack), we build it for you from scratch. Click "Contact Sales" to get a quote.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="final">
          <div className="panel reveal">
            <h2 className="h-section">Ready to sell?</h2>
            <p className="panel-lead">Free. 2 minutes. No card required.</p>
            <div className="panel-cta">
              <Link to={SIGNUP_URL} className="btn btn--lg panel-btn">
                Start for free {I.arrow}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <a href="#top" className="logo">
                <span className="text-green">{I.logoBag}</span>
                Biomart
              </a>
              <p className="tag">Your bio link, but it sells.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="#faq">Questions</a></li>
                <li><a href={wa("Hi Biomart, I have a question.")} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><Link to={SIGNUP_URL}>Create store</Link></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><button type="button" onClick={() => setLegalOpen("privacy")}>Privacy</button></li>
                <li><button type="button" onClick={() => setLegalOpen("terms")}>Terms</button></li>
                <li><button type="button" onClick={() => setLegalOpen("refunds")}>Refunds</button></li>
              </ul>
            </div>
          </div>
          <div className="fbot">
            <span>© 2026 Biomart</span>
            <span>Made in Nigeria</span>
          </div>
        </div>
      </footer>

      {legalOpen && (
        <div
          className="legal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLegalOpen(null);
          }}
        >
          <div className="legal-modal">
            <button
              className="legal-close"
              onClick={() => setLegalOpen(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="legal-title">{legalContent[legalOpen].title}</h2>
            <p className="legal-body">{legalContent[legalOpen].body}</p>
          </div>
        </div>
      )}
    </>
  );
}
