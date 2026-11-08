import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { products as productsApi, uploadImage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { naira } from "../lib/format";
import type { Product } from "../types";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { store: currentStore, products: cachedProducts, refresh } = useAuth();

  // 🟢 Find the product instantly from cache, no fetch needed!
  const product = id ? cachedProducts.find((p) => p.id === id) ?? null : null;
  const loadingProduct = !!id && !product && !cachedProducts.length; // Only true if cache is still loading

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [wasPrice, setWasPrice] = useState("");
  const [category, setCategory] = useState("");

  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const plan = currentStore?.plan || "free";
  const isPro = plan === "pro" || plan === "lifetime";
  
  const photoLimit = isPro ? 10 : plan === "starter" ? 3 : 1;

  const availableCategories = (currentStore as any)?.categories 
    ? (currentStore as any).categories.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];

  // 🟢 Populate form when product is found in cache
  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setWasPrice(
      product.compare_at_price && product.compare_at_price > product.price
        ? String(product.compare_at_price)
        : ""
    );
    setCategory((product as any).category || "");
    setInStock((product as any).inStock ?? product.in_stock ?? true);
    setImages(product.images ?? []);
  }, [product]);

  const handleImageUpload = async (file: File) => {
    if (images.length >= photoLimit) { setError(`Max ${photoLimit} photos.`); return; }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImages([...images, url]);
    } catch (err) {
      setError("Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));
  const makeMain = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    const [picked] = next.splice(i, 1);
    next.unshift(picked);
    setImages(next);
  };

  const numericPrice = Number(price) || 0;
  const numericWas = Number(wasPrice) || 0;
  const hasValidWas = numericWas > numericPrice && numericPrice > 0;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Add a name");
    if (!price || Number(price) <= 0) return setError("Add a price");
    if (images.length === 0) return setError("Add a photo");

    if (wasPrice && numericWas <= numericPrice) {
      return setError("Compare-at price must be higher than price");
    }

    setSaving(true);
    const [imageUrl, ...imageUrls] = images;

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_at_price: hasValidWas ? numericWas : null,
      category: category.trim() || null,
      in_stock: inStock,
      inStock: inStock,
      image_url: imageUrl,
      image_urls: imageUrls,
    };

    try {
      if (product) await productsApi.update(product.id, payload);
      else await productsApi.create(payload);
      
      await refresh(true); 
      nav("/dashboard/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await productsApi.remove(product.id);
      await refresh(true); 
      nav("/dashboard/products");
    } catch (err) {
      setError("Could not delete");
    }
  };

  if (loadingProduct) {
    return <DashboardLayout><div className="dash-loading-inline"><div className="dash-spinner" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 899px) {
          .pe-actions { position: static !important; background: transparent !important; backdrop-filter: none !important; border-top: none !important; padding: 0 !important; margin-top: 24px !important; }
          .dash-main { padding-bottom: 120px !important; }
        }
      `}</style>

      <button onClick={() => nav("/dashboard/products")} className="pe-back">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Products
      </button>

      <h1 className="pe-title">{product ? "Edit product" : "New product"}</h1>

      <div className="pe-form">
        <section className="pe-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="pe-label">Photos</label>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{images.length} / {photoLimit} used</span>
          </div>
          <div className="pe-photos">
            {images.map((url, i) => (
              <div key={i} className={`pe-photo ${i === 0 ? "main" : ""}`}>
                <img src={url} alt="" />
                <button type="button" className="pe-photo-x" onClick={() => removeImage(i)} aria-label="Remove photo">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                {i === 0 ? <span className="pe-photo-tag">Main</span> : <button type="button" className="pe-photo-move" onClick={() => makeMain(i)}>Set main</button>}
              </div>
            ))}
            {images.length < photoLimit ? (
              <label className="pe-photo pe-photo-add">
                {uploading ? <div className="dash-spinner" /> : <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
              </label>
            ) : (
              <Link to="/plan" className="pe-photo-add" style={{ borderStyle: "solid", background: "var(--green-soft)", borderColor: "rgba(15,122,74,0.3)" }}><span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: "var(--green)" }}>Upgrade<br/>for more</span></Link>
            )}
          </div>
        </section>

        <section className="pe-section">
          <label className="pe-label" htmlFor="pe-name">Name</label>
          <input id="pe-name" className="pe-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ankara tote bag" />
        </section>

        <section className="pe-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="pe-label">Category</label>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Optional</span>
          </div>
          {availableCategories.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" onClick={() => setCategory("")} style={{ padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: "1px solid", borderColor: !category ? "var(--ink)" : "var(--line)", background: !category ? "var(--ink)" : "transparent", color: !category ? "var(--bg)" : "var(--muted)", cursor: "pointer" }}>None (Shop all)</button>
              {availableCategories.map((cat: string) => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} style={{ padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: "1px solid", borderColor: category === cat ? "var(--ink)" : "var(--line)", background: category === cat ? "var(--ink)" : "transparent", color: category === cat ? "var(--bg)" : "var(--muted)", cursor: "pointer" }}>{cat}</button>
              ))}
            </div>
          ) : (
            <div style={{ background: "var(--soft)", padding: 16, borderRadius: 10, border: "1px solid var(--line)" }}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Add categories in <Link to="/dashboard/settings" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline" }}>Settings</Link>.</p>
            </div>
          )}
        </section>

        <section className="pe-section">
          <label className="pe-label" htmlFor="pe-desc">Description</label>
          <textarea id="pe-desc" className="pe-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Handcrafted leather tote" rows={3} />
        </section>

        <section className="pe-section">
          <div className="pe-grid-2">
            <div><label className="pe-label" htmlFor="pe-price">Price</label><input id="pe-price" className="pe-input" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="20000" /></div>
            <div><label className="pe-label" htmlFor="pe-was">Compare at</label><input id="pe-was" className="pe-input" type="number" inputMode="numeric" value={wasPrice} onChange={(e) => setWasPrice(e.target.value)} placeholder="27000" /></div>
          </div>
          {hasValidWas && (
            <div className="pe-price-note">
              <span className="pe-price-old">{naira(numericWas)}</span><span className="pe-price-arrow">→</span><span className="pe-price-new">{naira(numericPrice)}</span>
            </div>
          )}
        </section>

        <section className="pe-section pe-toggle-row">
          <span className="pe-label" style={{ margin: 0 }}>In stock</span>
          <button type="button" onClick={() => setInStock(!inStock)} className={`pd-toggle ${inStock ? "on" : ""}`} aria-label="Toggle stock"><span /></button>
        </section>

        {error && <p className="pe-error">{error}</p>}
      </div>

      <div className="pe-actions">
        {product && <button type="button" onClick={handleDelete} className="pe-delete">Delete</button>}
        <button type="button" onClick={handleSave} disabled={saving || uploading} className="pe-save">{saving ? "Saving…" : product ? "Save changes" : "Add product"}</button>
      </div>
    </DashboardLayout>
  );
}
