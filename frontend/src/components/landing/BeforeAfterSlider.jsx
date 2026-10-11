import { useCallback, useRef, useState } from "react";
import "./BeforeAfterSlider.css";

const clamp = (n) => Math.min(100, Math.max(0, n));

/**
 * Comparador antes/después.
 *
 * - **Arrastre con puntero** (mouse, dedo, lápiz) sobre toda la imagen con
 *   `setPointerCapture`. Antes era un `<input type="range">` invisible encima:
 *   en iOS solo se podía arrastrar desde el thumb (que no se veía) y el gesto
 *   vertical quedaba bloqueado. `touch-action: pan-y` deja scrollear la página.
 * - **Teclado y lectores de pantalla**: el range sigue existiendo, ahora
 *   controlado, con `aria-valuetext` y foco visible en el handle.
 * - **Fix visual**: la imagen "antes" se recorta con `clip-path` sobre una capa
 *   del mismo tamaño que la "después". Antes se achicaba el contenedor y el
 *   `object-fit: cover` re-escalaba la foto, así que las dos no coincidían.
 *
 * @param {{
 *   imgBefore?: string, imgAfter?: string,
 *   beforeLabel?: string, afterLabel?: string,
 *   placeholderIcons?: { before?: string, after?: string },
 *   hint?: string,
 * }} props
 */
export default function BeforeAfterSlider({
  imgBefore,
  imgAfter,
  beforeLabel = "Antes",
  afterLabel = "Después",
  placeholderIcons = {},
  hint = "← Arrastrá para comparar →",
}) {
  const [position, setPosition] = useState(50);
  const frameRef = useRef(null);
  const draggingRef = useRef(false);

  const updateFromPointer = useCallback((clientX) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX);
  };
  const onPointerMove = (e) => {
    if (draggingRef.current) updateFromPointer(e.clientX);
  };
  const stopDragging = () => {
    draggingRef.current = false;
  };

  const rounded = Math.round(position);

  return (
    <figure className="lp-ba">
      <div
        ref={frameRef}
        className="lp-ba__frame"
        style={{ "--ba-pos": `${position}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <BaLayer src={imgAfter} label={afterLabel} icon={placeholderIcons.after ?? "✨"} className="lp-ba__layer--after" />
        <BaLayer
          src={imgBefore}
          label={beforeLabel}
          icon={placeholderIcons.before ?? "📦"}
          className="lp-ba__layer--before"
        />

        <span className="lp-ba__badge lp-ba__badge--before" aria-hidden="true">{beforeLabel}</span>
        <span className="lp-ba__badge lp-ba__badge--after" aria-hidden="true">{afterLabel}</span>

        <input
          type="range"
          className="lp-ba__range"
          min="0"
          max="100"
          step="1"
          value={rounded}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label={`Comparar ${beforeLabel.toLowerCase()} y ${afterLabel.toLowerCase()}`}
          aria-valuetext={`${rounded}% ${beforeLabel.toLowerCase()}, ${100 - rounded}% ${afterLabel.toLowerCase()}`}
        />
        <div className="lp-ba__line" aria-hidden="true" />
        <div className="lp-ba__handle" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M6 9H12M6 9L4 7M6 9L4 11M12 9L14 7M12 9L14 11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {hint && <figcaption className="lp-ba__hint">{hint}</figcaption>}
    </figure>
  );
}

function BaLayer({ src, label, icon, className }) {
  return (
    <div className={`lp-ba__layer ${className}`}>
      {src ? (
        <img src={src} alt={label} loading="lazy" decoding="async" draggable="false" />
      ) : (
        <div className="lp-ba__placeholder">
          <span className="lp-ba__placeholder-icon" aria-hidden="true">{icon}</span>
          <span className="lp-ba__placeholder-text">{label}</span>
        </div>
      )}
    </div>
  );
}
