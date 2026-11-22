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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const displayPrice = selectedVariant ? selectedVariant.priceDelta : product.price;
  const totalPrice = displayPrice * qty;
  
  const displayCompare = !selectedVariant && product.compare_at_price != null 
    ? product.compare_at_price 
    : null;

  const canAdd = !hasVariants || selectedVariantLabel !== null;

  const pairs = useMemo(() => {
    if (!products || products.length === 0) return [];
    const others = products.filter((p) => p.id !== product.id);
    return shuffle(others).slice(0, 4);
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
        className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6"
        onClick={onClose}
      >
        <div
          ref={modalScrollRef}
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-full w-full flex-col overflow-y-auto sm:h-auto sm:max-h-[90vh] sm:max-w-6xl bg-white shadow-2xl"
          style={{ backgroundColor: 'var(--bg)', color: CHARCOAL }}
        >
          {/* Elegant Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-all hover:scale-105 sm:absolute sm:right-6 sm:top-6"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] h-full md:h-auto">
            
            {/* LEFT: IMAGE GALLERY */}
            <div className="relative flex flex-col bg-[var(--bg)]">
              <div
                className="relative w-full aspect-[4/5] md:aspect-auto md:h-full min-h-[400px] cursor-zoom-in overflow-hidden"
                onClick={() => setIsZoomed(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {!mainImgLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-black/5" />
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
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                      e.currentTarget.onerror = null;
                    }}
                    draggable={false}
                    className={`h-full w-full object-cover transition-all duration-700 ease-out ${
                      mainImgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                  />
                )}

                {/* Mobile Swipe Indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:hidden">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === activeImage ? 'w-6 bg-white' : 'w-2 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Thumbnails */}
              {images.length > 1 && (
                <div className="hidden gap-3 px-8 py-6 md:flex">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goToImage(i); }}
                      className={`aspect-square w-16 overflow-hidden transition-all duration-300 ${
                        i === activeImage ? 'opacity-100 ring-1 ring-black ring-offset-2' : 'opacity-40 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={src} 
                        alt="thumbnail" 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                          e.currentTarget.onerror = null;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: PRODUCT DETAILS */}
            {/* Added pb-12 to guarantee it clears the FBT section on mobile, and md:justify-center to kill the desktop void */}
            <div className="flex flex-col p-6 sm:p-10 md:p-12 pb-14 md:pb-12 bg-white md:justify-center">
              
              <div className="mb-6 shrink-0">
                <h2
                  className="text-[28px] md:text-[38px] leading-[1.1] tracking-[-0.02em] mb-4 pr-10 md:pr-0"
                  style={{ fontFamily: "var(--serif)", fontWeight: 400 }}
                >
                  {product.name}
                </h2>
                <div className="flex items-baseline gap-4">
                  <p className="text-[20px] font-medium tracking-tight" style={{ color: CHARCOAL }}>
                    {naira(displayPrice)}
                  </p>
                  {displayCompare && (
                    <p className="text-[15px] line-through opacity-40">
                      {naira(displayCompare)}
                    </p>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="mb-8 text-[14px] leading-[1.8] text-black/60 font-light">
                  {product.description}
                </p>
              )}

              {/* Variants */}
              {hasVariants && product.in_stock && (
                <div className="mb-8">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                    Select Option {selectedVariantLabel ? '' : '· Required'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const active = selectedVariantLabel === v.label;
                      return (
                        <button
                          key={v.label}
                          onClick={() => setSelectedVariantLabel(v.label)}
                          className="rounded-full px-5 py-2.5 text-[12px] transition-all duration-300 flex items-center gap-2 border"
                          style={{
                            borderColor: active ? CHARCOAL : 'rgba(0,0,0,0.15)',
                            backgroundColor: active ? CHARCOAL : 'transparent',
                            color: active ? '#fff' : CHARCOAL,
                          }}
                        >
                          <span className="font-medium">{v.label}</span>
                          <span className="text-[10px] opacity-60">
                            +{naira(v.priceDelta)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {product.in_stock ? (
                <div className="mt-2 w-full">
                  {/* Quantity */}
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                      Quantity
                    </span>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-xl font-light text-black/50 hover:text-black transition-colors px-2">−</button>
                      <span className="text-[16px] font-medium w-4 text-center">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="text-xl font-light text-black/50 hover:text-black transition-colors px-2">+</button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-row gap-2 sm:gap-3 w-full mb-8">
                    <button
                      onClick={handleAdd}
                      disabled={!canAdd}
                      className="flex-1 min-w-0 rounded-lg py-4 text-[clamp(9px,2.5vw,11px)] sm:text-[12px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        backgroundColor: canAdd ? (addedFlash ? BRAND_GREEN : CHARCOAL) : 'rgba(0,0,0,0.05)',
                        color: canAdd ? '#fff' : 'rgba(0,0,0,0.3)',
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                        boxShadow: canAdd && !addedFlash ? '0 4px 14px 0 rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <span className="truncate block px-1">
                        {addedFlash ? 'Added ✓' : `Add to Bag — ${naira(totalPrice)}`}
                      </span>
                    </button>

                    <button
                      onClick={handleOrder}
                      disabled={!canAdd}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-4 text-[clamp(9px,2.5vw,11px)] sm:text-[12px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] transition-all duration-300 border border-black/20 hover:bg-black hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        backgroundColor: 'transparent',
                        color: CHARCOAL,
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                        opacity: canAdd ? 1 : 0.5
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0 hidden sm:block">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                      </svg>
                      <span className="truncate px-1">
                        Order Now
                      </span>
                    </button>
                  </div>

                  {/* Share - Added flex-wrap to prevent overlap */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/30">
                      Share
                    </span>
                    <div className="flex items-center gap-4">
                      <button onClick={handleShareWhatsApp} className="text-black/40 hover:text-black transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" /></svg>
                      </button>
                      <button onClick={handleCopyLink} className="text-black/40 hover:text-black transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" /></svg>
                      </button>
                      {copied && <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/50">Copied!</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] border border-black/10 bg-black/5 text-black/50">
                  Sold Out
                </div>
              )}
            </div>
          </div>

          {/* FREQUENTLY BOUGHT TOGETHER */}
          {pairs.length > 0 && (
            <div className="px-6 py-12 md:px-12 md:py-16 border-t border-black/10">
              <h3 
                className="text-[22px] md:text-[26px] mb-8" 
                style={{ fontFamily: "var(--serif)", fontWeight: 400 }}
              >
                Frequently Bought Together
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
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
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/5">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={`${p.name}`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                            e.currentTarget.onerror = null;
                          }}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-1 w-full">
                      <p className="text-[14px] md:text-[15px] truncate leading-[1.3]" style={{ fontFamily: "var(--serif)", fontWeight: 400 }}>
                        {p.name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0">
                        <span className="text-[12px] font-medium tracking-tight text-black/50">
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          <img 
            src={currentImage} 
            alt={mainAlt} 
            className="max-h-full max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image+Unavailable";
              e.currentTarget.onerror = null;
            }}
          />
        </div>
      )}
    </>
  );
}

export default ProductModal;
