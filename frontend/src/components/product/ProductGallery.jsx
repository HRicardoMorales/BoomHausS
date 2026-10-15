import { useRef } from "react";
import SafeImg from "../SafeImg";
import { HERO_SIZES, THUMB_WIDTHS } from "../landing/imageSizes";

const MIN_SWIPE_DISTANCE = 40;

/**
 * Galería del hero de la ficha: imagen principal con swipe táctil y fila de
 * miniaturas. Es controlada (el índice vive en ProductDetail, que lo resetea
 * al cambiar de variante); el gesto se guarda en refs para no re-renderizar
 * la página en cada `touchmove`.
 *
 * `variantKey` entra en la `key` de la imagen para reiniciar la animación de
 * entrada cuando cambia la variante aunque el índice siga en 0.
 */
export default function ProductGallery({ images, activeIndex, onIndexChange, alt, variantKey }) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const count = images.length;

  const step = (delta) => {
    if (count > 0) onIndexChange((prev) => (prev + delta + count) % count);
  };

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > MIN_SWIPE_DISTANCE) step(1);
    if (distance < -MIN_SWIPE_DISTANCE) step(-1);
  };

  return (
    <section className="pd-media-fullwidth">
      <section className="card pd-media pd-media-sticky">
        <div
          className="pd-mediaMain pd-mediaMain--bigger"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {count > 0 ? (
            <SafeImg
              key={`v${variantKey}-${activeIndex}`}
              className="pd-mainImg pd-mainImg--force pd-mainImg--anim"
              src={images[activeIndex]}
              alt={alt}
              sizes={HERO_SIZES}
              width={1000}
              height={1000}
              referrerPolicy="no-referrer"
              priority={activeIndex === 0}
              loading="eager"
              draggable={false}
            />
          ) : (
            <div className="pd-empty">Sin imagen</div>
          )}
        </div>

        {count > 1 && (
          <div className="pd-thumbs-row">
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className={`pd-thumb ${idx === activeIndex ? "is-active" : ""}`}
                onClick={() => onIndexChange(idx)}
                aria-label={`Miniatura ${idx + 1}`}
              >
                <SafeImg
                  src={img}
                  alt=""
                  widths={THUMB_WIDTHS}
                  sizes="90px"
                  width={90}
                  height={68}
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
