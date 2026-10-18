import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(store?.name ?? "");
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  // Single Banner
  const [bannerUrl, setBannerUrl] = useState<string>((store as any)?.cover_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

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

      {/* ═══════ STORE INFO ═══════ */}
      <section className="set-section" style={{ paddingTop: 0 }}>
        {!isEditing ? (
          <div style={{ display: "grid", gap: "24px", marginTop: "24px" }}>
            <div><span className="set-label">Store Name</span><p style={{ fontSize: "18px", fontWeight: 600, margin: "8px 0 0" }}>{name || "—"}</p></div>
            <div><span className="set-label">Tagline</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{tagline || "—"}</p></div>
            <div><span className="set-label">Address</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{address || "—"}</p></div>
            <div><span className="set-label">WhatsApp</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{whatsapp || "—"}</p></div>
            <div><span className="set-label">Instagram</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{instagram ? `@${instagram}` : "—"}</p></div>
            <div><span className="set-label">TikTok</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{tiktok ? `@${tiktok}` : "—"}</p></div>
          </div>
        ) : (
          <>
            <div className="set-fields">
              <div className="set-field"><label className="set-label">Store name</label><input className="set-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">Tagline</label><input className="set-input" value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">Address</label><input className="set-input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">WhatsApp</label><input className="set-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">Instagram</label><input className="set-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">TikTok</label><input className="set-input" value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={handleSaveStore} disabled={saving} className="dash-btn dash-btn-dark">{saving ? "Saving…" : "Save Changes"}</button>
              <button onClick={() => setIsEditing(false)} className="dash-btn dash-btn-line">Cancel</button>
            </div>
          </>
        )}
      </section>

      {/* ═══════ SINGLE BANNER ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Store Banner</h2>
        <div className="set-banner" style={{ maxHeight: "240px" }}>
          {bannerUrl ? (
            <img src={bannerUrl} alt="Store banner" style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "12px" }} />
          ) : (
            <div style={{ width: "100%", height: "200px", background: "var(--soft)", borderRadius: "12px", display: "grid", placeItems: "center", color: "var(--muted)" }}>No banner uploaded</div>
          )}
          <div className="set-banner-actions">
            <label className="set-banner-btn">
              {uploadingBanner ? <div className="dash-spinner dash-spinner-sm" /> : "Change"}
              <input type="file" accept="image/*" hidden disabled={uploadingBanner} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBanner(f); e.target.value = ""; }} />
            </label>
            {bannerUrl && <button type="button" onClick={handleRemoveBanner} className="set-banner-btn danger">Remove</button>}
          </div>
        </div>
      </section>

      {/* ═══════ DANGER ZONE ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Danger zone</h2>
        <div className="set-danger-row">
          <div>
            <p className="set-danger-title">Delete store</p>
            <p className="set-danger-sub">Removes every product and cancels your plan.</p>
          </div>
          <button type="button" className="set-danger-btn" onClick={() => toast.show("Contact support to delete")}>
            Delete
          </button>
        </div>
      </section>

    </DashboardLayout>
  );
}
