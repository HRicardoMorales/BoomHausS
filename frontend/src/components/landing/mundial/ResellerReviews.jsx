import { useEffect, useRef, useState } from "react";
import MC from "../../../landings/mundial-revendedores.js";
import { SectionHeader } from "./LandingChrome";
import { getAvatarColors, getInitials } from "./utils";

/* =========================
   MINI REVIEWS BAR — rotating compact review card
========================= */
export function MiniReviewsBar() {
  const data = MC.reviews.slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => setActive((i) => (i + 1) % data.length), 4500);
    return () => clearInterval(t);
  }, [data.length]);

  if (!data.length) return null;

  const avatarColors = ["#1B4D3E", "#2F855A", "#f59e0b", "#8b5cf6", "#E53E3E", "#06b6d4"];

  return (
    <div className="mrb anim-el">
      <div className="mrb-label">LO QUE DICEN NUESTROS REVENDEDORES</div>
      <div className="mrb-viewport">
        <div className="mrb-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {data.map((r, i) => (
            <div className="mrb-slide" key={i}>
              <div className="mrb-card">
                <div className="mrb-card-header">
                  <div
                    className="mrb-card-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="mrb-card-meta">
                    <div className="mrb-card-name">{r.name} — {r.city}</div>
                    <div className="mrb-card-stars">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} style={{ color: j < (r.stars || 5) ? "#FBBF24" : "#D1D5DB" }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mrb-card-text">"{r.short || r.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mrb-dots">
        {data.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`mrb-dot ${i === active ? "on" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Reseña ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   RESELLER REVIEWS — mismo layout que ProductDetail (rv- carousel)
========================= */
export function StarsInline({ rating = 5 }) {
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

        <div className="rv-row" ref={rowRef} onScroll={onScroll}>
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
