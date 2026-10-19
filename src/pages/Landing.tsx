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
  whatsapp: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" /></svg>,
  instagram: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
  tiktok: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09" /></svg>,
  box: <svg className="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  link: <svg className="ic" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
  wallet: <svg className="ic" viewBox="0 0 24 24"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M21 10h-6a2 2 0 0 0 0 4h6v-4z"/></svg>,
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
  const phoneRef = useRef<HTMLDivElement>(null);

  useReveal();
  useTilt(phoneRef);
  const navHidden = useNavHide();

  const wa = (msg: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  const audience = ["Hair", "Fashion", "Skincare", "Food", "Shoes", "Boutiques", "Thrift", "Accessories"];

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

        {/* 🟢 HOW IT WORKS (3 STEPS) */}
        <section className="sec bg-soft" id="how">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">How it works</span>
              <h2 className="h-section">From zero to live in 2 minutes.</h2>
            </div>
            
            <div className="steps">
              <div className="step reveal">
                <div className="step-icon">{I.box}</div>
                <h3>Build your catalogue</h3>
                <p>Upload your products, add photos, set prices, and add sizes or colors. Your storefront is generated automatically.</p>
              </div>

              <div className="step reveal">
                <div className="step-icon">{I.link}</div>
                <h3>Share your link</h3>
                <p>Copy your Biomart link. Put it in your Instagram bio, TikTok, or send it to customers on WhatsApp.</p>
              </div>

              <div className="step reveal">
                <div className="step-icon">{I.whatsapp}</div>
                <h3>Order & Get Paid</h3>
                <p>Customers tap 'Order', and WhatsApp opens with the items ready to send. They pay you directly. No middleman fees.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🟢 PRICING */}
        <section className="sec" id="pricing">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Pricing</span>
              <h2 className="h-section">Start free. Upgrade when you're ready.</h2>
            </div>

            <div className="switch-wrap reveal" style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
              <div style={{ display: "inline-flex", background: "var(--soft)", padding: 4, borderRadius: 99, border: "1px solid var(--line)" }}>
                <button type="button" onClick={() => setBilling("m")} style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: billing === "m" ? "var(--bg)" : "transparent", color: billing === "m" ? "var(--ink)" : "var(--muted)", boxShadow: billing === "m" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s ease" }}>
                  Monthly
                </button>
                <button type="button" onClick={() => setBilling("q")} style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: billing === "q" ? "var(--bg)" : "transparent", color: billing === "q" ? "var(--ink)" : "var(--muted)", boxShadow: billing === "q" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 8 }}>
                  Quarterly <span style={{ background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 99, fontSize: 10 }}>Save 8%</span>
                </button>
              </div>
            </div>

            <div className="plans">
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
                  <li>Product variants</li>
                  <li>No Biomart ad</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn">Get Pro</Link>
              </div>
            </div>

            {/* 🟢 CUSTOM PLAN (STRETCHED) */}
            <div className="custom-plan-wrapper reveal">
              <div className="plan custom-plan">
                <div>
                  <h3>Custom E-commerce</h3>
                  <p className="desc">A full online store with your own domain and Paystack integration.</p>
                  <div className="p" style={{ fontSize: 20 }}>Custom Quote</div>
                </div>
                <a href={wa("Hi Biomart, I'd like a quote for a custom e-commerce website.")} target="_blank" rel="noopener noreferrer" className="btn">
                  Contact Sales {I.arrow}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="sec bg-soft" id="faq">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Questions</span>
              <h2 className="h-section">Everything you need to know.</h2>
            </div>
            <div className="faqgrid">
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
            {/* BRAND & SOCIALS */}
            <div className="fbrand">
              <a href="#top" className="logo">
                <span className="text-green">{I.logoBag}</span>
                Biomart
              </a>
              <p className="tag">Your bio link, but it sells.</p>
              
              <div className="fsocials">
                <a href={wa("Hi Biomart")} target="_blank" rel="noopener noreferrer">{I.whatsapp}</a>
                <a href="https://instagram.com/biomart" target="_blank" rel="noopener noreferrer">{I.instagram}</a>
                <a href="https://tiktok.com/@biomart" target="_blank" rel="noopener noreferrer">{I.tiktok}</a>
              </div>
            </div>
            
            {/* PRODUCT */}
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">Questions</a></li>
              </ul>
            </div>
            
            {/* LEGAL */}
            <div>
              <h4>Legal</h4>
              <ul>
                <li><Link to="/legal/privacy">Privacy</Link></li>
                <li><Link to="/legal/terms">Terms</Link></li>
                <li><Link to="/legal/refunds">Refunds</Link></li>
              </ul>
            </div>
          </div>
          
          {/* COPYRIGHT */}
          <div className="fbot">
            <span>© 2026 Biomart</span>
          </div>
        </div>
      </footer>
    </>
  );
}
