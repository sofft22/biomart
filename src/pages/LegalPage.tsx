import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "October 19, 2026",
    content: [
      {
        heading: "1. Introduction and Scope",
        text: "This Privacy Policy applies to Biomart (referred to as 'we', 'us', or 'our'), a software-as-a-service platform that allows merchants ('Store Owners') to create a digital catalogue and facilitate sales via WhatsApp. This policy outlines how we collect, process, store, and protect your personal and business data when you access our website, create an account, or operate a storefront. By using Biomart, you consent to the data practices described in this policy."
      },
      {
        heading: "2. Information We Collect from Store Owners",
        text: "To provide the Service, we collect the following categories of information: (a) Account Information: your email address, password, and store name. (b) Contact Information: your WhatsApp phone number, Instagram handle, and TikTok handle, which are displayed publicly on your storefront. (c) Business Data: the products, prices, descriptions, and images you upload. (d) Transactional Data: your chosen subscription plan and payment history. We do not collect or store payment card details, as all payments are processed via manual bank transfer."
      },
      {
        heading: "3. Information We Collect from Customers (Buyers)",
        text: "Biomart is designed to protect the privacy of your customers. When a customer visits your storefront, we do not require them to create an account or provide personal details. We do not store their names, phone numbers, or email addresses. When a customer clicks 'Order', they are redirected to WhatsApp to message you directly. Biomart does not intercept, read, or store these WhatsApp messages."
      },
      {
        heading: "4. How We Use Your Information",
        text: "We use the information we collect strictly to operate and improve the Service. This includes: (a) generating your unique storefront link; (b) verifying your identity when you request support; (c) calculating your product limits based on your subscription tier; and (d) sending you essential service updates (such as changes to this policy or system maintenance). We do not use your data for third-party marketing."
      },
      {
        heading: "5. Data Storage, Security, and Retention",
        text: "Your data is stored securely on Cloudflare D1 Databases and Object Storage. We implement industry-standard security measures, including HTTPS encryption and HttpOnly cookies for session management, to protect against unauthorized access. We retain your data for as long as your account is active. If you delete your store via the Settings page, your product data, images, and store details are permanently deleted from our active databases. Backups may retain this data for up to 30 days."
      },
      {
        heading: "6. Third-Party Service Providers",
        text: "We do not sell your data. However, we share necessary data with trusted third-party providers to operate the platform: (a) Cloudflare (hosting, database, and security); (b) Image hosting services (to display your product photos). These providers are contractually obligated to protect your data and only use it to provide services to Biomart."
      },
      {
        heading: "7. Your Rights",
        text: "Depending on your jurisdiction (such as under the NDPR in Nigeria), you have the right to: (a) request access to the personal data we hold about you; (b) request correction of inaccurate data; (c) request deletion of your data (via account deletion); and (d) object to the processing of your data. To exercise these rights, contact us via the support WhatsApp number."
      }
    ]
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "October 19, 2026",
    content: [
      {
        heading: "1. Acceptance of Terms",
        text: "By creating a Biomart account, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. Biomart reserves the right to update these terms at any time. Continued use of the platform after updates constitutes acceptance of the new terms."
      },
      {
        heading: "2. The Nature of the Service",
        text: "Biomart is a software provider. We offer a platform for you to host a digital catalogue. We are NOT a marketplace, a payment processor, or a delivery service. We do not handle the financial transaction between you and your customer. We are not responsible for the quality, safety, or legality of the products you sell. You are solely responsible for fulfilling your customer's orders."
      },
      {
        heading: "3. Acceptable Use Policy",
        text: "You agree not to use Biomart to sell or promote: (a) illegal goods or services; (b) counterfeit or stolen goods; (c) drugs, weapons, or adult content; (d) products that infringe on intellectual property rights. We reserve the right to suspend or permanently delete any store that violates these rules, without prior notice or refund."
      },
      {
        heading: "4. Subscription Plans and Limits",
        text: "Biomart offers Free, Starter, and Pro tiers. Your use of the platform is limited by the features of your tier (e.g., number of products, photos per product, and access to variants). If you exceed these limits, the system may block you from uploading more data. You agree to upgrade your plan if you require more capacity. Subscriptions are billed monthly or quarterly."
      },
      {
        heading: "5. Manual Payments and Downgrades",
        text: "All subscription payments are processed manually via bank transfer. Your plan will be upgraded only after we confirm receipt of the funds. If your subscription expires, you will be given a grace period. After the grace period, your store will automatically downgrade to the Free tier, and you may lose access to premium features and ad-free storefronts."
      },
      {
        heading: "6. Taxes and Legal Compliance",
        text: "You are solely responsible for calculating, collecting, and remitting any taxes (such as VAT) associated with the sale of your products. Biomart does not calculate or collect taxes on your behalf. You agree to comply with all local laws, including consumer protection laws and data protection regulations."
      },
      {
        heading: "7. Limitation of Liability and Indemnification",
        text: "To the maximum extent permitted by law, Biomart shall not be liable for any indirect, incidental, or consequential damages, including lost profits or lost sales, arising from your use of the platform. You agree to indemnify and hold Biomart harmless from any claims, damages, or legal fees arising from a dispute between you and your customers."
      },
      {
        heading: "8. Termination",
        text: "You may terminate your account at any time by deleting your store. We may terminate or suspend your access to the platform immediately, without prior notice, if we believe you have breached these Terms or engaged in fraudulent activity."
      }
    ]
  },
  refunds: {
    title: "Refund Policy",
    lastUpdated: "October 19, 2026",
    content: [
      {
        heading: "1. Free Plan",
        text: "The Biomart Free plan is provided at no cost. You will never be charged for using the Free tier. If you choose to stay on the Free plan, you are bound by its feature limits (e.g., 5 products, 1 photo per product)."
      },
      {
        heading: "2. Paid Subscription Refunds",
        text: "All payments for the Starter and Pro tiers are non-refundable once the billing cycle has begun. Because we offer a completely free tier for you to test the platform's functionality before upgrading, we do not offer refunds for buyers' remorse or lack of usage."
      },
      {
        heading: "3. Downgrades and Cancellations",
        text: "If you cancel your subscription, you will retain access to your paid features until the end of your current billing cycle (Monthly or Quarterly). You will not receive a prorated refund for the unused days. After your cycle ends, your store will downgrade to the Free tier."
      },
      {
        heading: "4. Account Deletion",
        text: "If you choose to delete your store, your access to the platform ends immediately. You forfeit any remaining days on your paid subscription, and no refunds will be issued for the unused portion of the cycle."
      },
      {
        heading: "5. Billing Errors and Disputes",
        text: "If you believe you have been charged in error (e.g., charged twice for the same cycle), please contact support via WhatsApp within 7 days of the transaction. We will investigate the issue. If a legitimate billing error occurred on our end, we will process a refund or credit to your account at our discretion."
      }
    ]
  }
};

export default function LegalPage() {
  const location = useLocation();
  const nav = useNavigate();
  
  // Extract the type from the URL (e.g., "/legal/privacy" -> "privacy")
  const path = location.pathname.split("/").pop() || "privacy";
  const content = LEGAL_CONTENT[path as keyof typeof LEGAL_CONTENT] || LEGAL_CONTENT.privacy;

  // Scroll to top when the page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font)" }}>
      
      {/* Header */}
      <header style={{ padding: "24px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--green)", textDecoration: "none", fontWeight: 800 }}>
            <svg viewBox="0 0 60 64" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
              <path d="M20 26V14A10 10 0 0 1 40 14V26" />
            </svg>
            Biomart
          </Link>
          <button onClick={() => nav(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
            Go back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 120px" }}>
        
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Legal
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            {content.title}
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Last updated: {content.lastUpdated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {content.content.map((section, idx) => (
            <div key={idx}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", color: "var(--ink)" }}>
                {section.heading}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(26,26,26,0.8)", margin: 0 }}>
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation between legal pages */}
        <div style={{ marginTop: 80, paddingTop: 32, borderTop: "1px solid var(--line)", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Switch to:</span>
          <Link to="/legal/privacy" style={{ fontSize: 14, fontWeight: 600, color: path === "privacy" ? "var(--ink)" : "var(--green)", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/legal/terms" style={{ fontSize: 14, fontWeight: 600, color: path === "terms" ? "var(--ink)" : "var(--green)", textDecoration: "none" }}>Terms of Service</Link>
          <Link to="/legal/refunds" style={{ fontSize: 14, fontWeight: 600, color: path === "refunds" ? "var(--ink)" : "var(--green)", textDecoration: "none" }}>Refund Policy</Link>
        </div>

      </main>
    </div>
  );
}
