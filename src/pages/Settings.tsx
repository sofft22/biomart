import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { store as storeApi, uploadImage } from "../lib/api";

export default function Settings() {
  const { store, refresh } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState((store as any)?.slug ?? ""); // 🟢 Store Slug State
  const [tagline, setTagline] = useState((store as any)?.tagline ?? "");
  const [heroTitle, setHeroTitle] = useState((store as any)?.hero_title ?? "");
  const [categories, setCategories] = useState((store as any)?.categories ?? "");
  const [address, setAddress] = useState((store as any)?.address ?? "");
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store?.instagram ?? "");
  const [tiktok, setTiktok] = useState(store?.tiktok ?? "");
  const [saving, setSaving] = useState(false);

  // 🟢 Banner State (Array of up to 4 URLs)
  const [banners, setBanners] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (!store) return;
    setName(store.name ?? "");
    setSlug((store as any).slug ?? "");
    setTagline((store as any).tagline ?? "");
    setHeroTitle((store as any).hero_title ?? "");
    setCategories((store as any).categories ?? "");
    setAddress((store as any).address ?? "");
    setWhatsapp(store.whatsapp ?? "");
    setInstagram(store.instagram ?? "");
    setTiktok(store.tiktok ?? "");
    
    let loadedBanners = [];
    if ((store as any).cover_url) {
      loadedBanners.push((store as any).cover_url);
    }
    try {
      const extras = JSON.parse((store as any).extra_banners || "[]");
      if (Array.isArray(extras)) {
        loadedBanners = [...loadedBanners, ...extras];
      }
    } catch (e) {}
    
    setBanners(loadedBanners.slice(0, 4));
  }, [store]);

  if (!store) return null;

  // 🟢 Auto-generate slug from name
  const generateSlug = () => {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSlug(baseSlug);
  };

  const handleSaveStore = async () => {
    if (!name.trim()) return toast.show("Store name is required");
    setSaving(true);
    try {
      // 🟢 If the slug contains random numbers like "soft-3273", we generate a clean one
      let finalSlug = slug;
      if (!finalSlug || /-\d{4}$/.test(finalSlug)) {
        finalSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }

      await storeApi.update({
        name: name.trim(),
        slug: finalSlug.trim(), // 🟢 Save the clean slug
        tagline: tagline.trim() || null,
        hero_title: heroTitle.trim() || null,
        categories: categories.trim() || null,
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

  const handleUploadBanner = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const url = await uploadImage(file);
      
      const newBanners = [...banners];
      newBanners[index] = url;
      
      const cleanBanners = newBanners.filter(Boolean);
      setBanners(cleanBanners);

      const cover_url = cleanBanners[0] || null;
      const extra_banners = cleanBanners.length > 1 ? JSON.stringify(cleanBanners.slice(1)) : null;
      
      await storeApi.update({ cover_url, extra_banners } as any);
      await refresh(true);
      toast.show(`Banner ${index + 1} updated`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingIndex(null);
  };

  const removeBanner = async (index: number) => {
    const newBanners = [...banners];
    newBanners.splice(index, 1);
    setBanners(newBanners);

    const cover_url = newBanners[0] || null;
    const extra_banners = newBanners.length > 1 ? JSON.stringify(newBanners.slice(1)) : null;

    try {
      await storeApi.update({ cover_url, extra_banners } as any);
      await refresh(true);
      toast.show("Banner removed");
    } catch (err) {
      toast.show("Could not remove");
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

      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 32 }}>
        
        {/* STORE INFO */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Store Information</h2>
          
          {!isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Store Name</span><p style={{ fontSize: 16, fontWeight: 600, margin: "4px 0 0" }}>{name || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Store Link</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>biomart.pages.dev/{slug || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Tagline</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{tagline || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Hero Title</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{heroTitle || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Categories</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{categories || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>WhatsApp</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{whatsapp || "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Instagram</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{instagram ? `@${instagram}` : "—"}</p></div>
              <div><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>TikTok</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{tiktok ? `@${tiktok}` : "—"}</p></div>
              <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Address</span><p style={{ fontSize: 15, margin: "4px 0 0" }}>{address || "—"}</p></div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Store Name (Max 22 chars)</label>
                  <input className="pe-input" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} onBlur={generateSlug} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Store Link</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ padding: "10px 12px", background: "var(--soft)", border: "1px solid var(--line)", borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                      biomart.pages.dev/
                    </span>
                    <input 
                      className="pe-input" 
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} 
                      style={{ borderRadius: "0 8px 8px 0", flex: 1 }} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Hero Title (Max 20 chars)</label>
                  <input className="pe-input" value={heroTitle} maxLength={20} placeholder="e.g. Sips & Treats." onChange={(e) => setHeroTitle(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tagline (Max 50 chars)</label>
                  <input className="pe-input" value={tagline} maxLength={50} onChange={(e) => setTagline(e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Categories (Comma separated)</label>
                  <input className="pe-input" value={categories} placeholder="e.g. Banana Bread, Puff Puffs" onChange={(e) => setCategories(e.target.value)} />
                </div>
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

        {/* STORE BANNERS */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Store Banners</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>Upload up to 4 images. They will automatically slide on your storefront.</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[0, 1, 2, 3].map((index) => {
              const url = banners[index];
              if (index > 0 && banners.length < index) return null;

              return (
                <div key={index} style={{ position: "relative", width: "100%", height: 180, background: "var(--soft)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
                  {url ? (
                    <img src={url} alt={`Banner ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 8, alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                      Banner {index + 1}
                    </div>
                  )}
                  
                  <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => fileInputRefs[index].current?.click()}
                      style={{ background: "rgba(255,255,255,0.9)", border: 0, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    >
                      {uploadingIndex === index ? "Uploading..." : url ? "Change" : "Upload"}
                    </button>
                    {url && (
                      <button onClick={() => removeBanner(index)} style={{ background: "#fff", border: 0, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "var(--danger)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    ref={fileInputRefs[index]}
                    disabled={uploadingIndex === index} 
                    onChange={(e) => { 
                      const f = e.target.files?.[0]; 
                      if (f) handleUploadBanner(f, index); 
                      e.target.value = ""; 
                    }} 
                  />
                </div>
              );
            })}
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
