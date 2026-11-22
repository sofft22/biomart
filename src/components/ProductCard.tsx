import { useState, memo } from 'react';
import type { Product } from '../types';
import { naira } from '../lib/format';

interface Props {
  product: Product;
  onClick: () => void;
  onAddToCart: () => void;
  priority?: boolean;
  showNew?: boolean;
  index?: number;
}

export const ProductCard = memo(function ProductCard({
  product,
  onClick,
  onAddToCart,
  priority,
  showNew = false,
  index = 0,
}: Props) {
  if (!product) return null;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const images = [product?.image_url, ...(product?.image_urls ?? [])].filter(
    (u): u is string => !!u
  );

  const hasSecondImage = images.length > 1;
  const altText = `${product.name} — biomart`;
  const inStock = (product as any).inStock ?? (product as any).in_stock ?? true;

  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    setActiveIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const delay = Math.min(index * 0.06, 0.6);

  return (
    <article className="pc group flex flex-col cursor-pointer w-full" style={{ animationDelay: `${delay}s` }}>
      
      {/* IMAGE CONTAINER - Minimalist */}
      <button onClick={onClick} className="pc-media relative aspect-[4/5] w-full overflow-hidden bg-black/5" aria-label={`View ${product.name}`}>
        {!imgLoaded && images.length > 0 && <div className="absolute inset-0 animate-pulse bg-black/5" />}

        <div className="pc-desktop h-full w-full hidden md:block">
          {images[0] && (
            <img
              src={images[0]}
              alt={altText}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                e.currentTarget.onerror = null;
              }}
              className={`pc-img object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${hasSecondImage ? 'has-second' : ''}`}
            />
          )}
          {hasSecondImage && (
            <img
              src={images[1]}
              alt={`${product.name} — alternate view`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                e.currentTarget.onerror = null;
              }}
              className="pc-img pc-img-alt object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
        </div>

        <div className="pc-mobile h-full w-full block md:hidden">
          {images.length > 0 ? (
            <div onScroll={handleScroll} className="pc-carousel no-scrollbar h-full w-full flex overflow-x-auto snap-x snap-mandatory">
              {images.map((url, i) => (
                <div key={i} className="pc-slide min-w-full h-full snap-center">
                  <img
                    src={url}
                    alt={i === 0 ? altText : `${product.name} — view ${i + 1}`}
                    loading={i === 0 && priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={i === 0 ? () => setImgLoaded(true) : undefined}
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x800/F5F5F5/1A1A1A?text=Image";
                      e.currentTarget.onerror = null;
                    }}
                    className="pc-img object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="pc-no-image flex items-center justify-center h-full text-black/40 text-[11px] font-bold tracking-widest uppercase">No image</div>
          )}
          
          {/* Mobile Pagination Lines */}
          {hasSecondImage && (
            <div 
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: 3,
                zIndex: 10,
                pointerEvents: "none",
                paddingBottom: 6
              }}
            >
              {images.map((_, i) => (
                <span 
                  key={i} 
                  style={{
                    height: 2,
                    width: i === activeIdx ? 12 : 6,
                    background: i === activeIdx ? "#1A1A1A" : "rgba(26,26,26,0.3)",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {inStock && showNew && (
          <div className="absolute left-3 top-3 z-10">
            <span className="bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] shadow-sm">New</span>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <span className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Sold Out
            </span>
          </div>
        )}

        {/* HOVER CTA (Desktop Only) */}
        {inStock && (
          <div className="pc-hover-cta absolute bottom-4 left-0 right-0 hidden md:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={handleQuickAction} 
              className="bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] shadow-xl transition-all duration-300 hover:bg-white hover:text-black rounded-sm"
            >
              Add to bag
            </button>
          </div>
        )}
      </button>

      {/* META DATA - Matched to Frequently Bought Together */}
      <button onClick={onClick} className="pc-meta mt-4 flex flex-col gap-1 text-left w-full">
        <p 
          className="pc-name text-[14px] md:text-[15px] truncate leading-[1.3]"
          style={{ fontFamily: 'var(--serif)', color: '#1A1A1A', fontWeight: 400 }}
        >
          {product.name}
        </p>
        
        <div className="pc-price-row flex items-baseline gap-1 mt-0">
          <span 
            className="pc-price text-[12px] font-medium tracking-tight text-black/50"
            style={{ fontFamily: 'var(--font)' }}
          >
            {naira(product.price)}
          </span>
          
          {hasDiscount && (
            <span 
              className="pc-price-old text-[11px] font-medium opacity-40 line-through"
              style={{ fontFamily: 'var(--font)' }}
            >
              {naira(product.compare_at_price!)}
            </span>
          )}
        </div>
      </button>
    </article>
  );
});

export default ProductCard;
