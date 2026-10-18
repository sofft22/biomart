import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";
import {
  getCategoriesWithImages,
  addCategory,
  updateCategory,
  removeCategory,
  setCategoryImage,
} from "../lib/storeData";
import type { Category } from "../types";

type CatWithImg = Category & { image?: string };

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

  // Categories
  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);

  const refreshCategories = () => {
    if (!store?.slug) return;
    setCategories(getCategoriesWithImages(store.slug));
  };

  useEffect(() => {
    refreshCategories();
  }, [store?.slug]);

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

  const handleAddCategorySubmit = async () => {
    if (!newCatName.trim()) return toast.show("Name is required");
    setIsSavingCat(true);
    try {
      const result = addCategory(store.slug, newCatName);
      if (!result.ok) throw new Error(result.error);
      
      if (newCatImage && result.category) {
        const url = await uploadImage(newCatImage);
        setCategoryImage(store.slug, result.category.id, url);
      }
      
      setNewCatName("");
      setNewCatImage(null);
      setIsCatModalOpen(false);
      refreshCategories();
      toast.show("Category added");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed to add");
    }
    setIsSavingCat(false);
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    removeCategory(store.slug, id);
    refreshCategories();
    toast.show("Category deleted");
  };

  const handleCatImageUpload = async (id: string, file: File) => {
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refreshCategories();
      toast.show("Category image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
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

      {/* STORE INFO (Read Only / Edit) */}
      <section className="set-section" style={{ paddingTop: 0 }}>
        {!isEditing ? (
          <div style={{ display: "grid", gap: "24px", marginTop: "24px" }}>
            <div><span className="set-label">Store Name</span><p style={{ fontSize: "18px", fontWeight: 600, margin: "8px 0 0" }}>{name || "—"}</p></div>
            <div><span className="set-label">Tagline</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{tagline || "—"}</p></div>
            <div><span className="set-label">Address</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{address || "—"}</p></div>
            <div><span className="set-label">WhatsApp</span><p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{whatsapp || "—"}</p></div>
          </div>
        ) : (
          <>
            <div className="set-fields">
              <div className="set-field"><label className="set-label">Store name</label><input className="set-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">Tagline</label><input className="set-input" value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">Address</label><input className="set-input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="set-field"><label className="set-label">WhatsApp</label><input className="set-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={handleSaveStore} disabled={saving} className="dash-btn dash-btn-dark">{saving ? "Saving…" : "Save Changes"}</button>
              <button onClick={() => setIsEditing(false)} className="dash-btn dash-btn-line">Cancel</button>
            </div>
          </>
        )}
      </section>

      {/* SINGLE BANNER */}
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

      {/* CATEGORIES */}
      <section className="set-section">
        <h2 className="set-title">Categories</h2>
        
        {/* Simple Add Row */}
        <div className="set-cat-add">
          <input className="set-cat-add-input" placeholder="New category" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          <button className="set-cat-add-btn" type="button" onClick={() => {
            if (!newCatName.trim()) return;
            setIsCatModalOpen(true);
          }}>+ Add</button>
        </div>

        {/* Category Grid */}
        {categories.length === 0 ? (
          <p className="set-empty">No categories yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "24px" }}>
            {categories.map((c) => (
              <div key={c.id} style={{ position: "relative", aspectRatio: "4/3", background: "var(--bg)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line)" }}>
                {c.image ? (
                  <img src={c.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "var(--mat)", display: "grid", placeItems: "center", color: "var(--faint)", fontSize: "12px" }}>No Image</div>
                )}
                
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
                
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: "8px", zIndex: 10 }}>
                  <label style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", border: 0 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCatImageUpload(c.id, f); e.target.value = ""; }} />
                  </label>
                  <button onClick={() => handleDeleteCategory(c.id, c.label)} style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", border: 0, color: "var(--danger)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                  </button>
                </div>

                <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                  <span style={{ fontFamily: "var(--serif)", fontSize: "18px", color: "#fff" }}>{c.label}</span>
                  <span style={{ color: "#fff", fontSize: "14px" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CATEGORY MODAL */}
      {isCatModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--card)", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>Add "{newCatName}"</h3>
            <label style={{ display: "block", width: "100%", height: "120px", border: "1px dashed var(--line)", borderRadius: "12px", background: "var(--bg)", display: "grid", placeItems: "center", cursor: "pointer", marginBottom: "16px", overflow: "hidden" }}>
              {newCatImage ? (
                <img src={URL.createObjectURL(newCatImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--faint)" }}>Click to upload image</span>
              )}
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setNewCatImage(f); e.target.value = ""; }} />
            </label>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setIsCatModalOpen(false)} className="dash-btn dash-btn-line">Cancel</button>
              <button onClick={handleAddCategorySubmit} disabled={isSavingCat} className="dash-btn dash-btn-dark">{isSavingCat ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
