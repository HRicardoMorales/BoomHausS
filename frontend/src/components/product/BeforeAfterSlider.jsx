import { useRef, useState } from "react";
import SafeImg from "../SafeImg";
import { FEATURE_SIZES } from "../landing/imageSizes";
import SectionHeader from "./SectionHeader";

export default function BeforeAfterSlider({ mc = {} }) {
  const ba = mc.beforeAfter;
  const containerRef = useRef(null);
  const [pos, setPos] = useState(50);

  if (!ba) return null;

  const handleInput = (e) => {
    const v = e.target.value;
    setPos(v);
    if (containerRef.current) {
      containerRef.current.style.setProperty("--position", `${v}%`);
    }
  };

  return (
    <section className="pd-block" id="authority">
      <SectionHeader
        title={ba.title || "ANTES Y DESPUÉS"}
        subtitle={ba.subtitle || ""}
      />
      <div className="ba-wrap">
        <div
          className="ba-container"
          ref={containerRef}
          style={{ "--position": "50%" }}
        >
          <div className="ba-img-wrap">
            {/* AFTER (base, full width) */}
            <SafeImg
              className="ba-img-after"
              src={ba.afterImg}
              alt={ba.afterLabel || "Después"}
              sizes={FEATURE_SIZES}
              draggable={false}
            />
            {/* BEFORE (clipped to --position width) */}
            <SafeImg
              className="ba-img-before"
              src={ba.beforeImg}
              alt={ba.beforeLabel || "Antes"}
              sizes={FEATURE_SIZES}
              draggable={false}
            />
            {/* Badges */}
            <span className="ba-badge ba-badge-before">{ba.beforeLabel || "Antes"}</span>
            <span className="ba-badge ba-badge-after">{ba.afterLabel || "Después"}</span>
          </div>

          {/* Invisible range input for drag */}
          <input
            type="range"
            min="0"
            max="100"
            value={pos}
            onChange={handleInput}
            aria-label="Porcentaje de imagen Antes mostrada"
            className="ba-range"
          />

          {/* Visual divider line */}
          <div className="ba-line" aria-hidden="true" />

          {/* Handle button */}
          <div className="ba-handle" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
              <line x1="128" y1="40" x2="128" y2="216" stroke="currentColor" strokeLinecap="round" strokeWidth="20" />
              <line x1="96"  y1="128" x2="16"  y2="128" stroke="currentColor" strokeLinecap="round" strokeWidth="20" />
              <polyline points="48 160 16 128 48 96"   fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20" />
              <line x1="160" y1="128" x2="240" y2="128" stroke="currentColor" strokeLinecap="round" strokeWidth="20" />
              <polyline points="208 96 240 128 208 160" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
