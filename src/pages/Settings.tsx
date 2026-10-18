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
  removeCategoryImage,
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

  // 🟢 4 IMAGE GALLERY STATE
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);

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
    
    // Load gallery
    let loadedGallery = [];
    try { loadedGallery = JSON.parse((store as any).gallery_urls || "[]"); } catch {}
    setGallery(loadedGallery);
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
      toast.show("Saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not save");
    }
    setSaving(false);
  };

  const handleUploadGalleryImage = async (file: File, index: number) => {
    setUploadingSlot(index);
    try {
      const url = await uploadImage(file);
      const newGallery = [...gallery];
      newGallery[index] = url;
      setGallery(newGallery);
      await storeApi.update({ gallery_urls: newGallery } as any);
      await refresh(true);
      toast.show("Banner updated");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingSlot(null);
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const newGallery = [...gallery];
    newGallery.splice(index, 1);
    setGallery(newGallery);
    try {
      await storeApi.update({ gallery_urls: newGallery } as any);
      await refresh(true);
      toast.show("Banner removed");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not remove");
    }
  };

  const handleAddCategory = async () => {
    const result = addCategory(store.slug, newCatName);
    if (!result.ok) return toast.show(result.error);
    setNewCatName("");
    refreshCategories();
    toast.show("Category added");
  };

  const handleRenameCategory = (id: string) => {
    const result = updateCategory(store.slug, id, editingCatName);
    if (!result.ok) return toast.show(result.error);
    setEditingCatId(null);
    refreshCategories();
    toast.show("Renamed");
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    removeCategory(store.slug, id);
    refreshCategories();
    toast.show("Category deleted");
  };

  const handleCatImage = async (id: string, file: File) => {
    setUploadingCatId(id);
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refreshCategories();
      toast.show("Image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingCatId(null);
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
            <div>
              <span className="set-label">Store Name</span>
              <p style={{ fontSize: "18px", fontWeight: 600, margin: "8px 0 0" }}>{name || "—"}</p>
            </div>
            <div>
              <span className="set-label">Tagline</span>
              <p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{tagline || "—"}</p>
            </div>
            <div>
              <span className="set-label">Address</span>
              <p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{address || "—"}</p>
            </div>
            <div>
              <span className="set-label">WhatsApp</span>
              <p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{whatsapp || "—"}</p>
            </div>
            <div>
              <span className="set-label">Instagram</span>
              <p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{instagram ? `@${instagram}` : "—"}</p>
            </div>
            <div>
              <span className="set-label">TikTok</span>
              <p style={{ fontSize: "16px", margin: "8px 0 0", color: "var(--muted)" }}>{tiktok ? `@${tiktok}` : "—"}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="set-fields">
              <div className="set-field">
                <label className="set-label">Store name</label>
                <input className="set-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze's Closet" maxLength={60} />
              </div>
              <div className="set-field">
                <label className="set-label">Tagline</label>
                <input className="set-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Where Lagos style meets everyday luxury" maxLength={100} />
              </div>
              <div className="set-field">
                <label className="set-label">Address</label>
                <input className="set-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Admiralty Way, Lekki, Lagos" />
              </div>
              <div className="set-field">
                <label className="set-label">WhatsApp</label>
                <input className="set-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08012345678" inputMode="tel" />
              </div>
              <div className="set-field">
                <label className="set-label">Instagram</label>
                <div className="set-input-prefixed">
                  <span className="set-prefix">@</span>
                  <input className="set-input" value={instagram} onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))} placeholder="adaezescloset" />
                </div>
              </div>
              <div className="set-field">
                <label className="set-label">TikTok</label>
                <div className="set-input-prefixed">
                  <span className="set-prefix">@</span>
                  <input className="set-input" value={tiktok} onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))} placeholder="adaezescloset" />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={handleSaveStore} disabled={saving} className="dash-btn dash-btn-dark">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setIsEditing(false)} className="dash-btn dash-btn-line">
                Cancel
              </button>
            </div>
          </>
        )}
      </section>

      {/* ═══════ SLIDER BANNERS (4 Boxes) ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Slider Banners</h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Upload up to 4 images. If you only upload 1, it won't slide.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {[0, 1, 2, 3].map((index) => {
            const img = gallery[index];
            const isUploading = uploadingSlot === index;
            return (
              <div key={index} style={{ position: "relative", aspectRatio: "4/3", background: "var(--soft)", borderRadius: "12px", overflow: "hidden", border: "1px dashed var(--line)", display: "grid", placeItems: "center" }}>
                {img ? (
                  <>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => handleRemoveGalleryImage(index)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: 0, width: 24, height: 24, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="red" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </>
                ) : (
                  <label style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--faint)" }}>
                    {isUploading ? <div className="dash-spinner" /> : <span>+ Add Image</span>}
                    <input type="file" accept="image/*" hidden disabled={isUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadGalleryImage(f, index); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Categories</h2>
        
        <div className="set-cat-add">
          <input className="set-cat-add-input" placeholder="New category" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }} maxLength={30} />
          <button className="set-cat-add-btn" type="button" disabled={!newCatName.trim()} onClick={handleAddCategory}>Add</button>
        </div>

        {categories.length === 0 ? (
          <p className="set-empty">No categories yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
            {categories.map((c) => {
              const isEditing = editingCatId === c.id;
              const busy = uploadingCatId === c.id;
              
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", background: "var(--card)", border: "1px solid var(--line)", padding: "6px 12px 6px 6px", borderRadius: "99px", gap: "10px" }}>
                  
                  {/* Small Circular Image Upload */}
                  <label style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", background: "var(--soft)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, position: "relative", border: "1px dashed var(--line)" }}>
                    {c.image ? (
                      <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    )}
                    {busy && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "grid", placeItems: "center" }}><div className="dash-spinner dash-spinner-sm" /></div>}
                    <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCatImage(c.id, f); e.target.value = ""; }} />
                  </label>

                  {/* Editable Text */}
                  {isEditing ? (
                    <input 
                      autoFocus
                      value={editingCatName} 
                      onChange={(e) => setEditingCatName(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === "Enter") handleRenameCategory(c.id); if (e.key === "Escape") setEditingCatId(null); }}
                      onBlur={() => handleRenameCategory(c.id)}
                      style={{ background: "transparent", border: "none", outline: "none", fontSize: "14px", fontWeight: 600, width: "80px" }}
                    />
                  ) : (
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{c.label}</span>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.label); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                    </button>
                    <button onClick={() => handleDeleteCategory(c.id, c.label)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
