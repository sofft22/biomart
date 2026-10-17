import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const I = {
  logoBag: (
    <svg viewBox="0 0 60 64" width="22" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
      <path d="M20 26V14A10 10 0 0 1 40 14V26" />
    </svg>
  ),
  bag: <svg className="ic" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>,
  jar: <svg className="ic" viewBox="0 0 24 24"><path d="M7 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z"/><path d="M6 5.5h12V9H6z"/></svg>,
  hat: <svg className="ic" viewBox="0 0 24 24"><path d="M3 15h18"/><path d="M6 15c0-5 2-8 6-8s6 3 6 8"/></svg>,
  shoe: <svg className="ic" viewBox="0 0 24 24"><path d="M3 16c0-3 2-4 4-4l3 2 4-4 3 5c2 0 4 1 4 3v1H3v-3z"/></svg>,
  wave: <svg className="ic" viewBox="0 0 24 24"><path d="M3 9c3-5 6 5 9 0s6 5 9 0"/><path d="M3 15c3-5 6 5 9 0s6 5 9 0"/></svg>,
  bowl: <svg className="ic" viewBox="0 0 24 24"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1-1.5 1-3"/><path d="M14 7c0-1.5 1-1.5 1-3"/></svg>,
  sliders: <svg className="ic" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M13 5v4M4 17h3M11 17h9M7 15v4"/></svg>,
  tag: <svg className="ic" viewBox="0 0 24 24"><path d="M3 12V4h8l9 9-8 8-9-9z"/><path d="M7.5 8.5h.01"/></svg>,
  grid: <svg className="ic" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>,
  chat: <svg className="ic" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5z"/></svg>,
  bolt: <svg className="ic" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  x: <svg className="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  tick: <svg className="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>,
  arrow: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowSm: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  dress: <svg className="ic" viewBox="0 0 24 24"><path d="M9 3h6l-1 4 3 14H7L10 7 9 3z"/></svg>,
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

  const audience = [
    { icon: I.wave, label: "Hair" },
    { icon: I.bag, label: "Fashion" },
    { icon: I.jar, label: "Skincare" },
    { icon: I.bowl, label: "Food" },
    { icon: I.shoe, label: "Shoes" },
    { icon: I.dress, label: "Boutiques" },
    { icon: I.sliders, label: "Thrift" },
    { icon: I.hat, label: "Accessories" },
  ];

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
        <div className="stat-num"><CountUp to={10000} suffix="+" /></div>
        <div className="stat-label">Products listed</div>
      </div>
      <div className="stat stat-hide-mobile">
        <div className="stat-num"><CountUp to={50000} suffix="+" /></div>
        <div className="stat-label">Monthly WhatsApp orders</div>
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
              <div key={i} className="serve-item">
                {a.icon}
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="sec">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Why Biomart</span>
              <h2 className="h-section">Still selling from your DMs?</h2>
              <p className="lead-lg"></p>
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

        <section className="sec bg-soft" id="how">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">How it works</span>
              <h2 className="h-section">Live in two minutes.</h2>
            </div>
            <div className="steps">
              <div className="step reveal">
                <span className="n">1</span>
                <h3>Add products</h3>
                <p>Photo, name, price.</p>
              </div>
              <div className="step reveal">
                <span className="n">2</span>
                <h3>Share the link</h3>
                <p>Drop it in your bio.</p>
              </div>
              <div className="step reveal">
                <span className="n">3</span>
                <h3>Get orders</h3>
                <p>WhatsApp opens, message written.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="features">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Features</span>
              <h2 className="h-section">Everything a catalogue needs.</h2>
            </div>
            <div className="feat3">
              <div className="feat reveal">
                <div className="iconbox">{I.sliders}</div>
                <h3>Sizes and options</h3>
                <p>Every variant priced automatically.</p>
              </div>
              <div className="feat reveal">
                <div className="iconbox">{I.tag}</div>
                <h3>Discount tag</h3>
                <p>Cross out the old price.</p>
              </div>
              <div className="feat reveal">
                <div className="iconbox">{I.grid}</div>
                <h3>Categories</h3>
                <p>Group products. Find fast.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec bg-soft" id="pricing">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Pricing</span>
              <h2 className="h-section">Start free.</h2>
            </div>

            <div className="switch-wrap reveal">
              <div className="switch" role="group" aria-label="Billing">
                <button type="button" aria-pressed={billing === "m"} onClick={() => setBilling("m")}>
                  Monthly
                </button>
                <button type="button" aria-pressed={billing === "q"} onClick={() => setBilling("q")}>
                  Quarterly
                </button>
              </div>
            </div>

            <div className="plans">
              <div className="plan reveal">
                <h3>Free</h3>
                <p className="desc">Try it.</p>
                <div className="p"><span>₦0</span></div>
                <ul>
                  <li>5 products</li>
                  <li>1 photo each</li>
                  <li>WhatsApp orders</li>
                  <li className="no">Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Start free</Link>
              </div>

              <div className="plan reveal">
                <h3>Starter</h3>
                <p className="desc">Getting going.</p>
                <div className="p">
                  <span>{billing === "m" ? "₦2,000" : "₦5,500"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/quarter"}</span>
                </div>
                <ul>
                  <li>15 products</li>
                  <li>2 photos each</li>
                  <li>WhatsApp orders</li>
                  <li className="no">Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Get Starter</Link>
              </div>

              <div className="plan pop reveal">
                <span className="badge">Popular</span>
                <h3>Pro</h3>
                <p className="desc">Full catalogue.</p>
                <div className="p">
                  <span>{billing === "m" ? "₦4,000" : "₦11,000"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/quarter"}</span>
                </div>
                <ul>
                  <li>50 products</li>
                  <li>5 photos each</li>
                  <li>WhatsApp orders</li>
                  <li>Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn">Get Pro</Link>
              </div>

              <div className="plan life reveal">
                <span className="badge alt">Founding</span>
                <h3>Lifetime</h3>
                <p className="desc">Pay once.</p>
                <div className="p">
                  <span>₦40,000</span><span className="per">once</span>
                </div>
                <ul>
                  <li>Unlimited products</li>
                  <li>10 photos each</li>
                  <li>WhatsApp orders</li>
                  <li>Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Get Lifetime</Link>
              </div>

              <div className="plan custom-plan reveal">
                <h3>Custom</h3>
                <p className="desc">Full online store.</p>
                <div className="p">
                  <span>₦100,000</span><span className="per">from</span>
                </div>
                <ul>
                  <li>Cart and checkout</li>
                  <li>Payment integration</li>
                  <li>Your own domain</li>
                  <li>Priority support</li>
                </ul>
                <a
                  href={wa("Hi Biomart, I'd like a quote for a custom online store.")}
                  className="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Talk to us {I.arrow}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Questions</span>
              <h2 className="h-section">Everything you're wondering.</h2>
            </div>
            <div className="faqgrid reveal">
              <details>
                <summary>Do customers need an account?</summary>
                <p>No. Open link, browse, message.</p>
              </details>
              <details>
                <summary>Do I need a website?</summary>
                <p>No. Your link is your store.</p>
              </details>
              <details>
                <summary>How do I get paid?</summary>
                <p>Bank transfer, cash, POS.</p>
              </details>
              <details>
                <summary>Can I try free?</summary>
                <p>Yes. 5 products. No card.</p>
              </details>
              <details>
                <summary>What is Lifetime?</summary>
                <p>₦40,000 once. Unlimited forever.</p>
              </details>
              <details>
                <summary>Full online store?</summary>
                <p>Yes. From ₦100,000.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="final">
          <div className="panel reveal">
            <h2 className="h-section">Open your store.</h2>
            <p className="panel-lead">Free. Two minutes. Live.</p>
            <div className="panel-cta">
              <Link to={SIGNUP_URL} className="btn btn--lg panel-btn">
                start free {I.arrow}
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
              onClrick={() => setLegalOpen(null)}
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