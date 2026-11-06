import { useState, useRef, useMemo, useEffect } from 'react';
import { naira } from '../lib/format';
import type { Product, Store } from '../types';

interface Props {
  product: Product;
  products: Product[];
  store: Store;
  onClose: () => void;
  onAddToCart: (
    qty: number,
    variant?: string,
    variantPriceDelta?: number,
    opts?: { silent?: boolean }
  ) => void;
  onOpenProduct: (p: Product) => void;
}

const CHARCOAL = '#1A1A1A';
const BRAND_GREEN = '#0F7A4A';
const ASH_GREY = '#6B6B6B';
const MUTED = 'rgba(26,26,26,0.5)';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 🟢 SMART WHATSAPP FORMATTER
function formatWhatsApp(phone: string) {
  let clean = (phone || "").replace(/\D/g, "");
  if (clean.startsWith("0")) clean = "234" + clean.substring(1);
  return clean;
}

export function ProductModal({
  product,
  products,
  store,
  onClose,
  onAddToCart,
  onOpenProduct,
}: Props) {
  const [qty, setQty] = useState(1);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImgLoaded, setMainImgLoaded] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const images = [product.image_url, ...(product.image_urls ?? [])]
    .filter((u): u is string => !!u)
    .slice(0, 6);
  const currentImage = images[activeImage] ?? product.image_url;

  const mainAlt = `${product.name} — biomart`;

  const variants = product.variants?.suggested ?? [];
  const hasVariants = variants.length > 0;

  const selectedVariant = variants.find((v) => v.label === selectedVariantLabel);
  
  // The base price + selected variant price
  const displayPrice = selectedVariant ? selectedVariant.priceDelta : product.price;
  
  // Total price for the button
  const totalPrice = displayPrice * qty;
  
  const displayCompare = !selectedVariant && product.compare_at_price != null 
    ? product.compare_at_price 
    : null;

  const canAdd = !hasVariants || selectedVariantLabel !== null;

  const pairs = useMemo(() => {
    if (!products || products.length === 0) return [];
    const others = products.filter((p) => p.id !== product.id);
    const shuffled = shuffle(others);
    return shuffled.slice(0, 4);
  }, [products, product.id]);

  useEffect(() => {
    if (isZoomed) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isZoomed]);

  const goToImage = (i: number) => {
    if (i === activeImage) return;
    setMainImgLoaded(false);
    setActiveImage(i);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeImage < images.length - 1) goToImage(activeImage + 1);
      else if (deltaX > 0 && activeImage > 0) goToImage(activeImage - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(qty, selectedVariantLabel ?? undefined, displayPrice, { silent: true });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1400);
  };

  const handleOrder = () => {
    if (!canAdd) return;
    onAddToCart(qty, selectedVariantLabel ?? undefined, displayPrice, { silent: true });
    
    const phone = formatWhatsApp(store.whatsapp);
    
    const formattedLineTotal = naira(totalPrice);
    
    const text = `Hello ${store.name},
    
I want to order:
    
${product.name} ${selectedVariantLabel ? `(${selectedVariantLabel})` : ''} x ${qty} = ${formattedLineTotal}
    
Total: ${formattedLineTotal}
    
How do I proceed with the payment and delivery process?`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    onClose();
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out ${product.name}`;
    const phone = formatWhatsApp(store.whatsapp);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`${text} — ${url}`)}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 sm:items-center"
        onClick={onClose}
      >
        <div
          ref={modalScrollRef}
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-full w-full flex-col overflow-y-auto sm:h-auto sm:max-h-[92vh] sm:max-w-5xl"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors duration-300"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)', color: CHARCOAL }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_GREEN)}
            onMouseLeave={(e) => (e.currentTarget.style.color = CHARCOAL)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            
            {/* IMAGE COLUMN */}
            <div style={{ backgroundColor: 'var(--bg)' }}>
              <div
                className="relative block aspect-[4/5] w-full overflow-hidden cursor-zoom-in"
                style={{ backgroundColor: 'var(--bg)' }}
                onClick={() => setIsZoomed(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {!mainImgLoaded && (
                  <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--bg)' }} />
                )}
                {currentImage && (
                  <img
                    key={currentImage}
                    src={currentImage}
                    alt={mainAlt}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={() => setMainImgLoaded(true)}
                    draggable={false}
                    className={`h-full w-full object-cover transition-opacity duration-500 ${
                      mainImgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeImage ? 'w-5 bg-charcoal' : 'w-1.5 bg-charcoal/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="hidden gap-2 p-4 sm:flex">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goToImage(i); }}
                      className="aspect-square w-16 overflow-hidden transition-colors"
                      style={{
                        border: i === activeImage ? `1px solid ${CHARCOAL}` : `1px solid var(--line)`,
                      }}
                    >
                      <img src={src} alt="thumbnail" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CONTENT COLUMN */}
            <div className="flex flex-col p-6 sm:p-10" style={{ backgroundColor: 'var(--bg)' }}>
              
              <h2
                className="text-[26px] leading-[1.15] tracking-[-0.02em] sm:text-[32px]"
                style={{ color: CHARCOAL, fontWeight: 600, textTransform: 'capitalize' }}
              >
                {product.name}
              </h2>

              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-[20px] font-semibold tracking-tight" style={{ color: ASH_GREY }}>
                  {naira(displayPrice)}
                </p>
                {displayCompare && (
                  <p className="text-[14px] line-through opacity-40" style={{ color: ASH_GREY }}>
                    {naira(displayCompare)}
                  </p>
                )}
              </div>

              {product.description && (
                <p className="mt-6 text-[15px] leading-[1.7] opacity-70" style={{ color: CHARCOAL, textTransform: 'capitalize' }}>
                  {product.description}
                </p>
              )}

              {/* VARIANTS */}
              {hasVariants && product.in_stock && (
                <div className="mt-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                    Select Option {selectedVariantLabel ? '' : '· Required'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {variants.map((v) => {
                      const active = selectedVariantLabel === v.label;
                      
                      return (
                        <button
                          key={v.label}
                          onClick={() => setSelectedVariantLabel(v.label)}
                          className="rounded-[8px] px-5 py-3 text-[12px] font-semibold tracking-[0.05em] transition-all duration-300 flex items-center gap-2"
                          style={{
                            border: `1px solid ${active ? CHARCOAL : 'var(--line)'}`,
                            backgroundColor: active ? CHARCOAL : 'transparent',
                            color: active ? '#fff' : CHARCOAL,
                          }}
                        >
                          <span>{v.label}</span>
                          <span style={{ color: active ? 'rgba(255,255,255,0.7)' : MUTED, fontSize: 11 }}>
                            {naira(v.priceDelta)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUANTITY & ACTIONS */}
              {product.in_stock && (
                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                      Quantity
                    </span>
                    <div className="inline-flex items-stretch overflow-hidden rounded-[8px]" style={{ border: `1px solid var(--line)` }}>
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-11 w-11 items-center justify-center text-lg hover:bg-black/5 transition-colors">
                        −
                      </button>
                      <span className="flex h-11 w-12 items-center justify-center text-[15px] font-semibold border-x" style={{ borderColor: 'var(--line)' }}>
                        {qty}
                      </span>
                      <button onClick={() => setQty(qty + 1)} className="flex h-11 w-11 items-center justify-center text-lg hover:bg-black/5 transition-colors">
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                      onClick={handleAdd}
                      disabled={!canAdd}
                      className="w-full rounded-[10px] py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300"
                      style={{
                        backgroundColor: canAdd ? (addedFlash ? BRAND_GREEN : CHARCOAL) : 'rgba(26,26,26,0.1)',
                        color: canAdd ? '#fff' : MUTED,
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {addedFlash ? 'Added ✓' : `Add to Bag — ${naira(totalPrice)}`}
                    </button>

                    <button
                      onClick={handleOrder}
                      disabled={!canAdd}
                      className="flex w-full items-center justify-center gap-2 rounded-[10px] py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md"
                      style={{
                        backgroundColor: canAdd ? BRAND_GREEN : 'rgba(15,122,74,0.3)',
                        color: '#fff',
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                      </svg>
                      Order Now — {naira(totalPrice)}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: MUTED }}>
                      Share
                    </span>
                    <button onClick={handleShareWhatsApp} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" /></svg>
                    </button>
                    <button onClick={handleCopyLink} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" /></svg>
                    </button>
                    {copied && <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: BRAND_GREEN }}>Copied!</span>}
                  </div>
                </div>
              )}

              {!product.in_stock && (
                <p className="mt-8 rounded-[10px] py-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] border opacity-50">
                  Sold Out
                </p>
              )}
            </div>
          </div>

          {/* FREQUENTLY BOUGHT TOGETHER */}
          {pairs.length > 0 && (
            <div className="px-6 py-12 sm:px-10 sm:py-16 border-t" style={{ borderColor: 'var(--line)' }}>
              <h3 className="text-[20px] sm:text-[24px] font-semibold tracking-tight" style={{ color: CHARCOAL }}>
                Frequently Bought Together
              </h3>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {pairs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveImage(0);
                      setSelectedVariantLabel(null);
                      setMainImgLoaded(false);
                      onOpenProduct(p);
                      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group text-left flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={`${p.name}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1 w-full">
                      <p className="text-[12px] md:text-[13px] font-semibold truncate leading-[1.3] tracking-[0.01em]" style={{ color: CHARCOAL, textTransform: 'capitalize' }}>
                        {p.name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0">
                        <span className="text-[14px] font-extrabold tracking-tight" style={{ color: ASH_GREY }}>
                          {naira(p.price)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN ZOOM OVERLAY */}
      {isZoomed && currentImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          <img 
            src={currentImage} 
            alt={mainAlt} 
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}

export default ProductModal;
