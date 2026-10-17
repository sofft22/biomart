import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";
import {
  getCategoriesWithImages,
  addCategory,
  updateCategory,
  removeCategory,
  reorderCategories,
  setCategoryImage,
  removeCategoryImage,
} from "../lib/storeData";
import type { Category } from "../types";

type CatWithImg = Category & { image?: string };

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85&auto=format&fit=crop";

const LONG_PRESS_MS = 500;

function titleCase(s: string): string {
  return (s || "").replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(store?.name ?? "");
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  const [bannerUrl, setBannerUrl] = useState<string>((store as any)?.cover_url ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [categories, setCategories] = useState<CatWithImg[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

  /* Drag state */
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedOverId, setPickedOverId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const listRef = useRef<HTMLUListElement | null>(null);

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
      await refresh();
      toast.show("Saved");
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
      await refresh();
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
      await refresh();
      toast.show("Banner removed");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not remove");
    }
  };

  const handleAddCategory = async () => {
    const result = addCategory(store.slug, newCatName);
    if (!result.ok) return toast.show(result.error);
    if (newCatImage && result.category) {
      try {
        const url = await uploadImage(dataUrlToBlob(newCatImage));
        setCategoryImage(store.slug, result.category.id, url);
      } catch {}
    }
    setNewCatName("");
    setNewCatImage(null);
    refreshCategories();
    toast.show("Category added");
  };

  const handleRename = (id: string) => {
    const result = updateCategory(store.slug, id, editingName);
    if (!result.ok) return toast.show(result.error);
    setEditingId(null);
    setEditingName("");
    refreshCategories();
    toast.show("Renamed");
  };

  const handleDeleteCategory = () => {
    if (!confirmDelete) return;
    removeCategory(store.slug, confirmDelete.id);
    refreshCategories();
    setConfirmDelete(null);
    toast.show("Category deleted");
  };

  const handleCategoryImage = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await uploadImage(file);
      setCategoryImage(store.slug, id, url);
      refreshCategories();
      toast.show("Image saved");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingId(null);
  };

  const handleRemoveCategoryImage = (id: string) => {
    removeCategoryImage(store.slug, id);
    refreshCategories();
    toast.show("Image removed");
  };

  /* Drag reorder */
  const persistOrder = (list: CatWithImg[]) => {
    reorderCategories(store.slug, list.map((c, i) => ({ ...c, sort_order: i })));
    refreshCategories();
  };

  const applyMove = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const list = [...categories];
    const fromIdx = list.findIndex((c) => c.id === fromId);
    const toIdx = list.findIndex((c) => c.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setCategories(list);
    persistOrder(list);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (editingId) return;
    touchStartY.current = e.touches[0].clientY;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setPickedId(id);
      setPickedOverId(id);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current && !pickedId) {
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 5) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (!pickedId) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const rows = listRef.current?.querySelectorAll("[data-cat-id]");
    if (!rows) return;
    let targetId: string | null = null;
    rows.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        targetId = (el as HTMLElement).dataset.catId ?? null;
      }
    });
    if (targetId && targetId !== pickedOverId) setPickedOverId(targetId);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pickedId && pickedOverId && pickedId !== pickedOverId) {
      applyMove(pickedId, pickedOverId);
    }
    setPickedId(null);
    setPickedOverId(null);
  };

  const displayBanner = bannerUrl || DEFAULT_BANNER;

  return (
    <DashboardLayout>
      <div className="dash-head" style={{ padding: 0 }}>
        <p className="dash-head-eyebrow">Settings</p>
        <h1 className="dash-title">
          Your <em>store</em>.
        </h1>
      </div>

      {/* ═══════ STORE ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Store</h2>

        <div className="set-banner">
          <img src={displayBanner} alt="Store banner" />
          <div className="set-banner-actions">
            <label className="set-banner-btn">
              {uploadingBanner ? (
                <div className="dash-spinner dash-spinner-sm" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  Change
                </>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploadingBanner}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadBanner(f);
                  e.target.value = "";
                }}
              />
            </label>
            {bannerUrl && (
              <button type="button" onClick={handleRemoveBanner} className="set-banner-btn danger">
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="set-fields">
          <div className="set-field">
            <label className="set-label">Store name</label>
            <input
              className="set-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adaeze's Closet"
              maxLength={60}
            />
          </div>

          <div className="set-field">
            <label className="set-label">Tagline</label>
            <input
              className="set-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Where Lagos style meets everyday luxury"
              maxLength={100}
            />
          </div>

          <div className="set-field">
            <label className="set-label">Address</label>
            <input
              className="set-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Admiralty Way, Lekki, Lagos"
            />
          </div>

          <div className="set-field">
            <label className="set-label">WhatsApp</label>
            <input
              className="set-input"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08012345678"
              inputMode="tel"
            />
          </div>

          <div className="set-field">
            <label className="set-label">Instagram</label>
            <div className="set-input-prefixed">
              <span className="set-prefix">@</span>
              <input
                className="set-input"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                placeholder="adaezescloset"
              />
            </div>
          </div>

          <div className="set-field">
            <label className="set-label">TikTok</label>
            <div className="set-input-prefixed">
              <span className="set-prefix">@</span>
              <input
                className="set-input"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
                placeholder="adaezescloset"
              />
            </div>
          </div>
        </div>

        <button onClick={handleSaveStore} disabled={saving} className="set-save">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Categories</h2>

        <div className="set-cat-add">
          <label className="set-cat-add-photo">
            {newCatImage ? (
              <img src={newCatImage} alt="" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setNewCatImage(String(r.result));
                r.readAsDataURL(f);
                e.target.value = "";
              }}
            />
          </label>
          <input
            className="set-cat-add-input"
            placeholder="New category"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
            maxLength={30}
          />
          <button
            className="set-cat-add-btn"
            type="button"
            disabled={!newCatName.trim()}
            onClick={handleAddCategory}
          >
            Add
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="set-empty">No categories yet.</p>
        ) : (
          <ul ref={listRef} className="set-cat-list">
            {categories.map((c) => {
              const isEditing = editingId === c.id;
              const busy = uploadingId === c.id;
              const isPicked = pickedId === c.id;
              const isPickedOver = pickedOverId === c.id && pickedId && pickedId !== c.id;

              return (
                <li
                  key={c.id}
                  data-cat-id={c.id}
                  onTouchStart={(e) => handleTouchStart(e, c.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`set-cat-row ${isPicked ? "picked" : ""} ${isPickedOver ? "over" : ""}`}
                >
                  <div className="set-cat-row-img">
                    {c.image ? (
                      <>
                        <img src={c.image} alt={c.label} />
                        <button
                          type="button"
                          className="set-cat-row-img-x"
                          onClick={() => handleRemoveCategoryImage(c.id)}
                          aria-label="Remove image"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <label className="set-cat-row-img-add">
                        {busy ? (
                          <div className="dash-spinner dash-spinner-sm" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          disabled={busy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCategoryImage(c.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="set-cat-row-name">
                    {isEditing ? (
                      <input
                        className="set-cat-row-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(c.id);
                          if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="set-cat-row-label">{titleCase(c.label)}</span>
                    )}
                  </div>

                  <div className="set-cat-row-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="set-cat-act primary"
                          onClick={() => handleRename(c.id)}
                          aria-label="Save"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="set-cat-act"
                          onClick={() => { setEditingId(null); setEditingName(""); }}
                          aria-label="Cancel"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="set-cat-act"
                          onClick={() => { setEditingId(c.id); setEditingName(c.label); }}
                          aria-label="Rename"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="set-cat-act danger"
                          onClick={() => setConfirmDelete({ id: c.id, label: c.label })}
                          aria-label="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ═══════ DANGER ═══════ */}
      <section className="set-section">
        <h2 className="set-title">Danger zone</h2>
        <div className="set-danger-row">
          <div>
            <p className="set-danger-title">Delete store</p>
            <p className="set-danger-sub">Removes every product and cancels your plan.</p>
          </div>
          <button
            type="button"
            className="set-danger-btn"
            onClick={() => toast.show("Contact support to delete")}
          >
            Delete
          </button>
        </div>
      </section>

      {confirmDelete && (
        <div
          className="set-confirm-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="set-confirm">
            <h3 className="set-confirm-title">Delete "{titleCase(confirmDelete.label)}"?</h3>
            <p className="set-confirm-sub">Products in this category won't be deleted.</p>
            <div className="set-confirm-actions">
              <button className="set-confirm-btn ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="set-confirm-btn danger" onClick={handleDeleteCategory}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}