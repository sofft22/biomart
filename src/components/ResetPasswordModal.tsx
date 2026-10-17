import { useState } from "react";
import { adminApi } from "../lib/adminApi";

interface Props {
  storeId: string;
  storeName: string;
  whatsapp: string;
  onClose: () => void;
  onDone: () => void;
}

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function ResetPasswordModal({
  storeId,
  storeName,
  whatsapp,
  onClose,
  onDone,
}: Props) {
  const [pw] = useState(generatePassword());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setBusy(true);
    setError("");
    try {
      await adminApi.resetPassword(storeId, pw);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleWhatsApp = () => {
    const num = whatsapp.replace(/\D/g, "");
    const text = `Hi ${storeName}, your Biomart password has been reset.\n\nNew password: ${pw}\n\nLog in and change it in Settings after you're in.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pw);
    } catch {}
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal">
        <h3 className="admin-modal-title">
          {done ? "Password reset" : "Reset password"}
        </h3>
        <p className="admin-modal-sub">
          {done
            ? `Give ${storeName}'s owner this new password. It won't be shown again.`
            : `A new password will be generated for ${storeName}. You'll hand it to the owner.`}
        </p>

        <div className="admin-password-box">
          <code>{pw}</code>
          <button onClick={copy} className="admin-password-copy" aria-label="Copy">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: "0 0 12px" }}>
            {error}
          </p>
        )}

        {done ? (
          <>
            <button
              onClick={handleWhatsApp}
              className="admin-modal-btn primary"
              style={{ width: "100%", marginBottom: 10 }}
            >
              Message owner on WhatsApp
            </button>
            <button
              onClick={() => {
                onDone();
                onClose();
              }}
              className="admin-modal-btn ghost"
              style={{ width: "100%" }}
            >
              Done
            </button>
          </>
        ) : (
          <div className="admin-modal-actions">
            <button onClick={onClose} className="admin-modal-btn ghost">
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={busy}
              className="admin-modal-btn primary"
            >
              {busy ? "Resetting…" : "Reset now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}