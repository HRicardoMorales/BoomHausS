import { useRef, useState } from "react";
import MC from "../../../landings/mundial-revendedores.js";
import MiniReviewsBar from "../MiniReviewsBar";
import { SectionHeader } from "./LandingChrome";
import { getAvatarColors, getInitials } from "./utils";
import "./ResellerReviews.css";

/* =========================
   MINI REVIEWS — el carrusel compartido de las landings (APG, swipe,
   pausa con hover/foco y reduced motion) con las reseñas de revendedores.
========================= */
const MINI_REVIEWS = MC.reviews.slice(0, 6).map((r) => ({
  name: r.city ? `${r.name} — ${r.city}` : r.name,
  text: r.short || r.text,
  rating: r.stars || 5,
}));

export function MundialMiniReviews() {
  return (
    <MiniReviewsBar
      reviews={MINI_REVIEWS}
      tone="accent"
      label="Lo que dicen nuestros revendedores"
      maxChars={180}
    />
  );
}

/* =========================
   RESELLER REVIEWS — mismo layout que ProductDetail (rv- carousel)
========================= */
function StarsInline({ rating = 5 }) {
  return (
    <div className="rv-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? "#FBBF24" : "#D1D5DB" }}>★</span>
      ))}
    </div>
  );
}

export function ResellerReviews() {
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  const go = (idx) => {
    const n = MC.reviews.length;
    const next = (idx + n) % n;
    setActive(next);
    const el = rowRef.current?.querySelectorAll(".rv-slide")?.[next];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onScroll = () => {
    if (!rowRef.current) return;
    const slides = Array.from(rowRef.current.querySelectorAll(".rv-slide"));
    const center = rowRef.current.scrollLeft + rowRef.current.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const sCenter = s.offsetLeft + s.clientWidth / 2;
      const dist = Math.abs(center - sCenter);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActive(best);
  };

  return (
    <section className="pd-block anim-el" id="reviews-section">
      <SectionHeader
        kicker="RESEÑAS"
        title="LO QUE DICEN OTROS REVENDEDORES"
      />

      <div className="rv-wrap">
        <button type="button" className="rv-nav rv-prev" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div
          className="rv-row"
          ref={rowRef}
          onScroll={onScroll}
          role="region"
          aria-label="Reseñas de revendedores (deslizá para ver más)"
          tabIndex={0}
        >
          {MC.reviews.map((r, i) => {
            const [c1, c2] = getAvatarColors(r.name);
            return (
              <article key={i} className="rv-slide">
                <div className="rv-card">
                  <div className="rv-head">
                    <div
                      className="rv-avatar"
                      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
                      aria-hidden="true"
                    >
                      {getInitials(r.name)}
                    </div>
                    <div className="rv-head-meta">
                      <div className="rv-name">{r.name}</div>
                      <div className="rv-city">{r.city}</div>
                      <StarsInline rating={r.stars} />
                    </div>
                    <div className="rv-verified" aria-label="Cliente verificado">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
                      </svg>
                      <span>Verificado</span>
                    </div>
                  </div>
                  <div className="rv-body">
                    <div className="rv-title">{r.title}</div>
                    <p className="rv-text">&ldquo;{r.text}&rdquo;</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" className="rv-nav rv-next" onClick={() => go(active + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className="rv-dots">
        {MC.reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`rv-dot ${i === active ? "on" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir al testimonio ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
