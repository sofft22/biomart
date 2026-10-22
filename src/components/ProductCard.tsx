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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const hasVariants = !!product.variants && product.variants.suggested.length > 0;

  const images = [product.image_url, ...(product.image_urls ?? [])].filter(
    (u): u is string => !!u
  );

  const hasSecondImage = images.length > 1;
  const altText = `${product.name} — biomart`;
  const inStock = (product as any).inStock ?? (product as any).in_stock ?? true;

  // Check for discount
  const hasDiscount = product.compare_at_price != null && product.compare_at_price > product.price;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) onClick();
    else onAddToCart();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    setActiveIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const delay = Math.min(index * 0.06, 0.6);

  return (
    <article className="pc" style={{ animationDelay: `${delay}s` }}>
      <button onClick={onClick} className="pc-media" aria-label={`View ${product.name}`}>
        {!imgLoaded && images.length > 0 && <div className="pc-skeleton" />}

        <div className="pc-desktop">
          {images[0] && (
            <img
              src={images[0]}
              alt={altText}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={`pc-img pc-img-swap ${imgLoaded ? 'is-loaded' : ''} ${hasSecondImage ? 'has-second' : ''}`}
            />
          )}
          {hasSecondImage && (
            <img
              src={images[1]}
              alt={`${product.name} — alternate view`}
              loading="lazy"
              decoding="async"
              className="pc-img pc-img-alt"
            />
          )}
        </div>

        <div className="pc-mobile">
          {images.length > 0 ? (
            <div onScroll={handleScroll} className="pc-carousel no-scrollbar">
              {images.map((url, i) => (
                <div key={i} className="pc-slide">
                  <img
                    src={url}
                    alt={i === 0 ? altText : `${product.name} — view ${i + 1}`}
                    loading={i === 0 && priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={i === 0 ? () => setImgLoaded(true) : undefined}
                    className="pc-img"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="pc-no-image">No image</div>
          )}
          
          {/* 🟢 FLAT, DARK, SQUARE INDICATORS ON THE BOTTOM EDGE */}
          {hasSecondImage && (
            <div 
              style={{
                position: "absolute",
                bottom: 0, // Exactly on the bottom edge
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end", // Align to bottom
                gap: 3,
                zIndex: 10,
                pointerEvents: "none",
                paddingBottom: 4 // Slight padding so it doesn't touch the very pixel edge
              }}
            >
              {images.map((_, i) => (
                <span 
                  key={i} 
                  style={{
                    height: 2, // Flat and thin
                    width: i === activeIdx ? 12 : 6, // Slightly wider when active
                    background: i === activeIdx ? "#1A1A1A" : "rgba(26,26,26,0.3)", // Dark when active, semi-dark when inactive
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {inStock && showNew && (
          <div className="pc-badges">
            <span className="pc-badge">New</span>
          </div>
        )}

        {!inStock && (
          <div className="pc-sold-out">
            <span>Sold out</span>
          </div>
        )}

        {inStock && (
          <div className="pc-hover-cta">
            <button onClick={handleQuickAction} className="pc-quick-btn">
              {hasVariants ? 'Choose options' : 'Add to bag'}
            </button>
          </div>
        )}
      </button>

      <button onClick={onClick} className="pc-meta" style={{ marginTop: 8 }}>
        <p className="pc-name" style={{ textTransform: 'capitalize' }}>
          {product.name}
        </p>
        <div className="pc-price-row" style={{ marginTop: 2 }}>
          
          {/* 🟢 Discounted Price FIRST (Front) */}
          <span className="pc-price">{naira(product.price)}</span>
          
          {/* 🟢 Old (Real) Price SECOND (Back, Crossed out) */}
          {hasDiscount && (
            <span className="pc-price-old">{naira(product.compare_at_price!)}</span>
          )}
          
        </div>
      </button>
    </article>
  );
});

export default ProductCard;
