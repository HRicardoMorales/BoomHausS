import { useEffect, useState } from "react";

function StarsInline({ rating = 5 }) {
  return (
    <span className="stars-inline" aria-label={`${rating} estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`s ${i < rating ? "on" : ""}`}>★</span>
      ))}
    </span>
  );
}

export default function MiniReviewsBar({ mc = {} }) {
  const data = (mc.miniReviews || mc.reviewsCarousel || []).slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => setActive(i => (i + 1) % data.length), 5000);
    return () => clearInterval(t);
  }, [data.length]);

  if (!data.length) return null;

  // paleta de colores para el avatar
  const avatarColors = ["#1B4D3E","#2F855A","#f59e0b","#8b5cf6","#E53E3E","#06b6d4"];

  return (
    <div className="mrb anim-el">
      <div className="mrb-label">Lo que dicen nuestros clientes</div>
      <div className="mrb-viewport">
        <div className="mrb-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {data.map((r, i) => (
            <div className="mrb-slide" key={i}>
              <div className="mrb-card">
                <div className="mrb-card-header">
                  <div className="mrb-card-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="mrb-card-meta">
                    <div className="mrb-card-name">{r.name}</div>
                    <div className="mrb-card-stars"><StarsInline rating={r.rating || 5} /></div>
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
          <button key={i} type="button" className={`mrb-dot ${i === active ? "on" : ""}`}
            onClick={() => setActive(i)} aria-label={`Reseña ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
