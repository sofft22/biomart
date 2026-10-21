import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  // Store Info State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(store?.name ?? "");
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  // Banner State
  const [bannerUrl, setBannerUrl] = useState<string>((store as any)?.cover_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name ?? "");
    setTagline((store as any).tagline ?? "");
    setAddress((store as any).address ?? "");
    setWhatsapp(store.whatsapp ?? "");
    setInstagram(store.instagram ?? "");
    setTiktok(store.tiktok ?? "");
    setBannerUrl((store as any).cover_url ?? "");
  }, [store]);

  if (!store) return null;

  const handleSaveStore = async () => {
    if (!name.trim()) return toast.show("Store name is required");
    setSaving(true);
    try {
      await storeApi.update({
        name: name.trim(),
        tagline: tagline.trim() || null,
        address: address.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
      } as any);
      await refresh(true);
      setIsEditing(false);
      toast.show("Store info saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save");
    }
    setSaving(false);
  };

  const handleUploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const url = await uploadImage(file);
      setBannerUrl(url);
      await storeApi.update({ cover_url: url } as any);
      await refresh(true);
      toast.show("Banner updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingBanner(false);
  };

  const handleRemoveBanner = async () => {
    setBannerUrl("");
    try {
      await storeApi.update({ cover_url: null } as any);
      await refresh(true);
      toast.show("Banner removed");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not remove");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) return toast.show("Please enter your current password.");
    if (!newPassword || newPassword.length < 8) return toast.show("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return toast.show("New passwords do not match.");
    
    setChangingPw(true);
    try {
    const res = await fetch("/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.show("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.show(err.message || "Failed to update password");
    }
    setChangingPw(false);
  };

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="dash-head-eyebrow">Settings</p>
          <h1 className="dash-title">Your <em>store</em>.</h1>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="dash-btn dash-btn-dark">
            Edit Store Info
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 32 }}>
        
        {/* STORE INFO */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Store Information</h2>
          
          {!isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Store Name</span><p style={{ fontSize: 16, fontWeight: 600, margin: "4px 0 0" }}>{name || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Tagline</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{tagline || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>WhatsApp</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{whatsapp || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Instagram</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{instagram ? `@${instagram}` : "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>TikTok</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{tiktok ? `@${tiktok}` : "—"}</p></div>
              <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Address</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{address || "—"}</p></div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Store Name</label><input className="pe-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tagline</label><input className="pe-input" value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>WhatsApp Number</label><input className="pe-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Instagram Handle</label><input className="pe-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>TikTok Handle</label><input className="pe-input" value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
                <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Physical Address</label><input className="pe-input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={handleSaveStore} disabled={saving} className="dash-btn dash-btn-dark">{saving ? "Saving…" : "Save Changes"}</button>
                <button onClick={() => setIsEditing(false)} className="dash-btn dash-btn-line">Cancel</button>
              </div>
            </>
          )}
        </section>

        {/* STORE BANNER */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Store Banner</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>This appears at the top of your storefront.</p>
            </div>
            {store.plan === "free" && (
              <span style={{ background: "var(--soft)", color: "var(--muted)", padding: "6px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>PRO FEATURE</span>
            )}
          </div>
          
          <div style={{ position: "relative", width: "100%", height: 180, background: "var(--soft)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
            {bannerUrl ? (
              <img src={bannerUrl} alt="Store banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14 }}>
                No banner uploaded
              </div>
            )}
            
            <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 8 }}>
              <label style={{ background: "rgba(255,255,255,0.9)", border: 0, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                {uploadingBanner ? "Uploading..." : "Change"}
                <input type="file" accept="image/*" hidden disabled={uploadingBanner || store.plan === "free"} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBanner(f); e.target.value = ""; }} />
              </label>
              {bannerUrl && (
                <button onClick={handleRemoveBanner} style={{ background: "#fff", border: 0, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--danger)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  Remove
                </button>
              )}
            </div>
          </div>
          
          {store.plan === "free" && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16, textAlign: "center" }}>
              <Link to="/plan" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "underline" }}>Upgrade to Starter</Link> to upload a custom banner and remove the Biomart ad.
            </p>
          )}
        </section>

        {/* 🟢 SECURITY (Now with Current Password) */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Security</h2>
          
          <div style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Current Password</label>
              <input className="pe-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New Password</label>
              <input className="pe-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Confirm New Password</label>
              <input className="pe-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-type new password" />
            </div>
            <button 
              onClick={handleChangePassword} 
              disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
              className="dash-btn dash-btn-dark"
              style={{ marginTop: 8 }}
            >
              {changingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Danger Zone</h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Delete store</p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Removes every product and cancels your plan. This cannot be undone.</p>
            </div>
            <button type="button" onClick={() => toast.show("Contact support on WhatsApp to delete")} style={{ background: "var(--danger-soft)", color: "var(--danger)", border: 0, padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Delete Store
            </button>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
