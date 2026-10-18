import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { products as productsApi, uploadImage, store as storeApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { naira } from "../lib/format";
import type { Product } from "../types";

interface Variant {
  label: string;
  priceDelta: number;
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { store: currentStore, limits, refresh } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [wasPrice, setWasPrice] = useState("");
  
  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const photoLimit = limits?.images ?? 1;

  // Fetch product data if editing
  useEffect(() => {
    if (!id || !currentStore?.slug) { 
      setLoadingProduct(false); 
      return; 
    }
    
    (async () => {
      setLoadingProduct(true);
      try {
        const data = await storeApi.public(currentStore.slug);
        const found = (data.products as Product[] | undefined)?.find((x) => x.id === id) ?? null;
        setProduct(found);
      } catch {
        setProduct(null);
      }
      setLoadingProduct(false);
    })();
  }, [id, currentStore?.slug]);

  // Populate form
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
    setInStock((product as any).inStock ?? product.in_stock ?? true);
    setImages(product.images ?? []);
    setVariants(product.variants?.suggested ?? []);
  }, [product]);

  const handleImageUpload = async (file: File) => {
    if (images.length >= photoLimit) {
      setError(`Your plan allows ${photoLimit} photos per product.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImages([...images, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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

  const addVariant = () => setVariants((v) => [...v, { label: "", priceDelta: 0 }]);
  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const numericPrice = Number(price) || 0;
  const numericWas = Number(wasPrice) || 0;
  const hasValidWas = numericWas > numericPrice && numericPrice > 0;
  const discountPercent = hasValidWas
    ? Math.round(((numericWas - numericPrice) / numericWas) * 100)
    : 0;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Add a name");
    if (!price || Number(price) <= 0) return setError("Add a price");
    if (images.length === 0) return setError("Add at least one photo");
    
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
      category_id: "", // 🟢 Hardcoded to empty since categories are gone
      in_stock: inStock,
      inStock: inStock,
      image_url: imageUrl,
      image_urls: imageUrls,
      variants: variants.length > 0 ? { suggested: variants } : undefined,
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
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  if (loadingProduct) {
    return (
      <DashboardLayout>
        <div className="dash-loading-inline"><div className="dash-spinner" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <button onClick={() => nav("/dashboard/products")} className="pe-back">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Products
      </button>

      <h1 className="pe-title">{product ? "Edit product" : "New product"}</h1>

      <div className="pe-form">
        {/* PHOTOS */}
        <section className="pe-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="pe-label">Photos</label>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {images.length} / {photoLimit} used
            </span>
          </div>
          <div className="pe-photos">
            {images.map((url, i) => (
              <div key={i} className={`pe-photo ${i === 0 ? "main" : ""}`}>
                <img src={url} alt="" />
                <button type="button" className="pe-photo-x" onClick={() => removeImage(i)} aria-label="Remove photo">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                {i === 0 ? (
                  <span className="pe-photo-tag">Main</span>
                ) : (
                  <button type="button" className="pe-photo-move" onClick={() => makeMain(i)}>
                    Set main
                  </button>
                )}
              </div>
            ))}

            {images.length < photoLimit ? (
              <label className="pe-photo pe-photo-add">
                {uploading ? (
                  <div className="dash-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <Link to="/plan" className="pe-photo-add" style={{ borderStyle: "solid", background: "var(--green-soft)", borderColor: "rgba(15,122,74,0.3)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", color: "var(--green)" }}>
                  Upgrade<br/>for more
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* NAME */}
        <section className="pe-section">
          <label className="pe-label" htmlFor="pe-name">Name</label>
          <input
            id="pe-name"
            className="pe-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ankara tote bag"
          />
        </section>

        {/* DESCRIPTION */}
        <section className="pe-section">
          <label className="pe-label" htmlFor="pe-desc">Description</label>
          <textarea
            id="pe-desc"
            className="pe-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Handcrafted leather tote"
            rows={3}
          />
        </section>

        {/* PRICE */}
        <section className="pe-section">
          <div className="pe-grid-2">
            <div>
              <label className="pe-label" htmlFor="pe-price">Price</label>
              <input
                id="pe-price"
                className="pe-input"
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="20000"
              />
            </div>
            <div>
              <label className="pe-label" htmlFor="pe-was">Compare at</label>
              <input
                id="pe-was"
                className="pe-input"
                type="number"
                inputMode="numeric"
                value={wasPrice}
                onChange={(e) => setWasPrice(e.target.value)}
                placeholder="27000"
              />
            </div>
          </div>

          {hasValidWas && (
            <div className="pe-price-note">
              <span className="pe-price-old">{naira(numericWas)}</span>
              <span className="pe-price-arrow">→</span>
              <span className="pe-price-new">{naira(numericPrice)}</span>
              <span className="pe-price-pill">{discountPercent}% off</span>
            </div>
          )}
        </section>

        {/* IN STOCK */}
        <section className="pe-section pe-toggle-row">
          <span className="pe-label" style={{ margin: 0 }}>In stock</span>
          <button
            type="button"
            onClick={() => setInStock(!inStock)}
            className={`pd-toggle ${inStock ? "on" : ""}`}
            aria-label="Toggle stock"
          >
            <span />
          </button>
        </section>

        {/* VARIANTS */}
        <section className="pe-section">
          <div className="pe-section-head">
            <label className="pe-label" style={{ margin: 0 }}>Variants</label>
            <button type="button" onClick={addVariant} className="pe-add-variant">
              + Add
            </button>
          </div>

          {variants.length > 0 && (
            <div className="pe-variants">
              {variants.map((v, i) => {
                const finalPrice = numericPrice + (v.priceDelta || 0);
                const hasExtra = (v.priceDelta || 0) > 0;
                return (
                  <div key={i} className="pe-variant">
                    <div className="pe-variant-main">
                      <input
                        className="pe-input"
                        value={v.label}
                        onChange={(e) => updateVariant(i, { label: e.target.value })}
                        placeholder="Size M"
                      />
                      <div className="pe-variant-extra">
                        <span className="pe-variant-plus">+</span>
                        <input
                          className="pe-input"
                          type="number"
                          inputMode="numeric"
                          value={v.priceDelta || ""}
                          onChange={(e) =>
                            updateVariant(i, { priceDelta: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="pe-variant-x"
                        aria-label="Remove variant"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                    <p className="pe-variant-hint">
                      {hasExtra
                        ? `${v.label.trim() || "Variant"} · ${naira(finalPrice)}`
                        : `${v.label.trim() || "Variant"} · same price`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {error && <p className="pe-error">{error}</p>}
      </div>

      <div className="pe-actions">
        {product && (
          <button type="button" onClick={handleDelete} className="pe-delete">
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="pe-save"
        >
          {saving ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
      </div>
    </DashboardLayout>
  );
}
