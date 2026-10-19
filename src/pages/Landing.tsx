        {/* 🟢 PRICING */}
        <section className="sec" id="pricing">
          <div className="wrap">
            <div className="sh reveal">
              <span className="eyebrow">Pricing</span>
              <h2 className="h-section">Start free. Upgrade when you're ready.</h2>
            </div>

            <div className="switch-wrap reveal" style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
              <div style={{ display: "inline-flex", background: "var(--soft)", padding: 4, borderRadius: 99, border: "1px solid var(--line)" }}>
                <button type="button" onClick={() => setBilling("m")} style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: billing === "m" ? "var(--bg)" : "transparent", color: billing === "m" ? "var(--ink)" : "var(--muted)" }}>
                  Monthly
                </button>
                <button type="button" onClick={() => setBilling("q")} style={{ padding: "10px 24px", borderRadius: 99, fontSize: 13, fontWeight: 600, border: 0, cursor: "pointer", background: billing === "q" ? "var(--bg)" : "transparent", color: billing === "q" ? "var(--ink)" : "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  Quarterly <span style={{ background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 99, fontSize: 10 }}>Save 8%</span>
                </button>
              </div>
            </div>

            <div className="plans">
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

            {/* 🟢 CUSTOM STRETCHED CARD */}
            <div className="custom-plan-wrapper reveal">
              <div className="plan custom-plan">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>Custom E-commerce</h3>
                  <p className="desc">Get a full online store with your own domain, shopping cart, and automated Paystack checkout.</p>
                  <div className="p" style={{ fontSize: 20 }}>Custom Quote</div>
                </div>
                <a href={wa("Hi Biomart, I'd like a quote for a custom e-commerce website.")} target="_blank" rel="noopener noreferrer" className="btn">
                  Contact Sales {I.arrow}
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* 🟢 FAQ SECTION (Added .sec for padding) */}
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

      {/* 🟢 FULL REWRITTEN FOOTER */}
      <footer>
        <div className="wrap">
          
          {/* Top Section: Brand & Socials (Centered on mobile, Left on desktop) */}
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

          {/* Middle Section: Product and Legal Links */}
          <div className="fgrid">
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">Questions</a></li>
              </ul>
            </div>
            
            <div>
              <h4>Legal</h4>
              <ul>
                <li><Link to="/legal/privacy">Privacy</Link></li>
                <li><Link to="/legal/terms">Terms</Link></li>
                <li><Link to="/legal/refunds">Refunds</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Copyright */}
          <div className="fbot">
            <span>© 2026 Biomart</span>
          </div>
        </div>
      </footer>
    </>
  );
}
