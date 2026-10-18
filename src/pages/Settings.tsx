import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage, products as productsApi } from "../lib/api";
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
  const { store, refresh, products = [] } = useAuth();
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
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [uploadingNewCat, setUploadingNewCat] = useState(false);
  
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  // 🟢 DELETE & MOVE MODAL STATE
  const [catToDelete, setCatToDelete] = useState<{ id: string; label: string; productCount: number } | null>(null);
  const [moveToCatId, setMoveToCatId] = useState<string>("");
  const [newMoveCategoryName, setNewMoveCategoryName] = useState(""); 
  const [deletingCat, setDeletingCat] = useState(false);

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

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setUploadingNewCat(true);
    
    try {
      const result = addCategory(store.slug, newCatName);
      if (!result.ok) {
        toast.show(result.error);
        setUploadingNewCat(false);
        return;
      }

      const updatedCategories = getCategoriesWithImages(store.slug);
      const newCategory = updatedCategories.find(c => c.label === newCatName.trim());
      
      if (newCategory && newCatImage) {
        const imageUrl = await uploadImage(newCatImage);
        setCategoryImage(store.slug, newCategory.id, imageUrl);
      }

      setNewCatName("");
      setNewCatImage(null);
      setIsAddingCat(false);
      refreshCategories();
      toast.show("Category added");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not add category");
    } finally {
      setUploadingNewCat(false);
    }
  };

  const handleRenameCategory = (id: string) => {
    if (!editingCatName.trim()) {
      setEditingCatId(null);
      return;
    }
    const result = updateCategory(store.slug, id, editingCatName);
    if (!result.ok) return toast.show(result.error);
    setEditingCatId(null);
    refreshCategories();
    toast.show("Category renamed");
  };

  const handleDeleteCategory = (id: string, label: string) => {
    const count = products.filter((p) => p.category_id === id).length;
    if (count === 0) {
      if (!confirm(`Delete "${label}"?`)) return;
      removeCategory(store.slug, id);
      refreshCategories();
      toast.show("Category deleted");
    } else {
      setCatToDelete({ id, label, productCount: count });
      
      const otherCats = categories.filter((c) => c.id !== id);
      if (otherCats.length > 0) {
        setMoveToCatId(otherCats[0].id);
      } else {
        setMoveToCatId("new");
      }
      setNewMoveCategoryName("");
    }
  };

  const confirmDeleteWithMove = async () => {
    if (!catToDelete) return;
    setDeletingCat(true);
    
    try {
      let finalMoveToId = moveToCatId;

      // 🟢 Handle creating a NEW category if the input field was used
      if (newMoveCategoryName.trim().length > 0) {
        const newCatResult = addCategory(store.slug, newMoveCategoryName);
        if (!newCatResult.ok) {
          toast.show(newCatResult.error);
          setDeletingCat(false);
          return;
        }
        const updatedCats = getCategoriesWithImages(store.slug);
        const createdCat = updatedCats.find(c => c.label.toLowerCase() === newMoveCategoryName.trim().toLowerCase());
        if (!createdCat) {
          toast.show("Could not create new category");
          setDeletingCat(false);
          return;
        }
        finalMoveToId = createdCat.id;
      }

      // Move all products
      const productsToMove = products.filter((p) => p.category_id === catToDelete.id);
      await Promise.all(
        productsToMove.map((p) => productsApi.update(p.id, { category_id: finalMoveToId }))
      );
      
      // Delete old category
      removeCategory(store.slug, catToDelete.id);
      
      refreshCategories();
      if (typeof refresh === "function") await refresh(true);
      
      toast.show("Category deleted and products moved");
      setCatToDelete(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not delete category");
    }
    setDeletingCat(false);
  };

  const handleCatImageUpload = async (id: string, file: File) => {
    setUploadingCatId(id);
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refreshCategories();
      toast.show("Category image saved");
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

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="set-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="set-title" style={{ margin: 0 }}>Categories</h2>
          {!isAddingCat && (
            <button 
              onClick={() => setIsAddingCat(true)} 
              className="dash-btn dash-btn-dark" 
              style={{ padding: "8px 16px", fontSize: "14px" }}
            >
              + Add Category
            </button>
          )}
        </div>

        {/* Add Category Form */}
        {isAddingCat && (
          <div style={{ background: "var(--soft)", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input 
              className="set-cat-add-input" 
              placeholder="Category Name" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              style={{ flex: 1, minWidth: "150px" }}
              autoFocus
            />
            
            <label style={{ 
              background: "var(--bg)", 
              border: "1px solid var(--line)", 
              borderRadius: "8px", 
              padding: "8px 12px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              fontSize: "14px"
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {newCatImage ? newCatImage.name.substring(0, 15) + "..." : "Upload Image"}
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setNewCatImage(f);
                  e.target.value = "";
                }} 
              />
            </label>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={handleAddCategory} 
                disabled={uploadingNewCat || !newCatName.trim()} 
                className="dash-btn dash-btn-dark"
                style={{ padding: "8px 16px", fontSize: "14px" }}
              >
                {uploadingNewCat ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={() => { setIsAddingCat(false); setNewCatName(""); setNewCatImage(null); }} 
                className="dash-btn dash-btn-line"
                style={{ padding: "8px 16px", fontSize: "14px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="set-empty">No categories yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "12px" }}>
            {categories.map((c) => (
              <div key={c.id} style={{ position: "relative", aspectRatio: "1/1", background: "var(--bg)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line)" }}>
                {c.image ? (
                  <img src={c.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "var(--mat)", display: "grid", placeItems: "center", color: "var(--faint)", fontSize: "12px" }}>No Image</div>
                )}
                
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
                
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: "8px", zIndex: 10 }}>
                  <label style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", border: 0 }}>
                    {uploadingCatId === c.id ? <div className="dash-spinner dash-spinner-sm" /> : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>}
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCatImageUpload(c.id, f); e.target.value = ""; }} />
                  </label>
                  <button onClick={() => handleDeleteCategory(c.id, c.label)} style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", border: 0, color: "var(--danger)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                  </button>
                </div>

                <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                  {editingCatId === c.id ? (
                    <input 
                      autoFocus
                      value={editingCatName} 
                      onChange={(e) => setEditingCatName(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === "Enter") handleRenameCategory(c.id); if (e.key === "Escape") setEditingCatId(null); }}
                      onBlur={() => handleRenameCategory(c.id)}
                      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #fff", color: "#fff", padding: "4px", borderRadius: "4px", fontSize: "14px", width: "100%" }} 
                    />
                  ) : (
                    <span onClick={() => { setEditingCatId(c.id); setEditingCatName(c.label); }} style={{ fontFamily: "var(--serif)", fontSize: "16px", color: "#fff", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>{c.label}</span>
                  )}
                  <span style={{ color: "#fff", fontSize: "14px" }}>→</span>
                </div>
              </div>
            ))}
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

      {/* ═══════ DELETE CATEGORY MODAL ═══════ */}
      {catToDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "24px" }}>
          <div style={{ background: "var(--bg)", width: "100%", maxWidth: "420px", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 60px -20px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "22px", margin: "0 0 8px" }}>
              Delete "{catToDelete.label}"?
            </h3>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.5 }}>
              You have <strong>{catToDelete.productCount} product(s)</strong> in this category. Where would you like to move them?
            </p>

            {/* OPTION 1: Dropdown (Only shows if there are other categories) */}
            {categories.filter((c) => c.id !== catToDelete.id).length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <label className="set-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Move to existing category:</label>
                <select 
                  className="set-input" 
                  value={moveToCatId} 
                  onChange={(e) => {
                    setMoveToCatId(e.target.value);
                    setNewMoveCategoryName(""); // Clear input if they pick from dropdown
                  }}
                  style={{ 
                    width: "100%", 
                    height: "48px", // 🟢 Force height so it doesn't clip
                    padding: "0 16px", 
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--bg)",
                    fontSize: "14px"
                  }}
                >
                  {categories.filter((c) => c.id !== catToDelete.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* OPTION 2: Create New (Always visible) */}
            <div style={{ marginBottom: "24px" }}>
              <label className="set-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Or create a new category:</label>
              <input 
                className="set-input" 
                placeholder="Type new category name here..." 
                value={newMoveCategoryName}
                onChange={(e) => {
                  setNewMoveCategoryName(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setMoveToCatId("new"); // Override dropdown selection if they type
                  } else if (categories.filter((c) => c.id !== catToDelete.id).length > 0) {
                    // If they clear the input, revert to the first dropdown option
                    setMoveToCatId(categories.filter((c) => c.id !== catToDelete.id)[0].id);
                  }
                }}
                style={{ 
                  width: "100%", 
                  height: "48px", // 🟢 Force height
                  padding: "0 16px", 
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setCatToDelete(null)} 
                className="dash-btn dash-btn-line"
                disabled={deletingCat}
                style={{ padding: "10px 20px", borderRadius: "8px" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteWithMove} 
                className="dash-btn" 
                style={{ background: "#B3261E", color: "#fff", padding: "10px 20px", borderRadius: "8px" }}
                disabled={deletingCat || (moveToCatId === "new" && !newMoveCategoryName.trim())}
              >
                {deletingCat ? "Moving..." : "Move & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
