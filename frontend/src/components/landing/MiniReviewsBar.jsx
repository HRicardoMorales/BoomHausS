import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import "./MiniReviewsBar.css";

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;

const AVATAR_COLORS = {
  green: ["#1B4D3E", "#2F855A", "#276749", "#1B4D3E", "#2D6A4F", "#2F855A", "#1B4D3E"],
  wine: ["#8B1A4A", "#C2185B", "#A0154E", "#8B1A4A", "#9C1B55", "#C2185B", "#8B1A4A"],
  // Ficha de producto: el acento sale de --pd-accent-rgb (tema por producto).
  accent: ["#1B4D3E", "#2F855A", "#f59e0b", "#8b5cf6", "#E53E3E", "#06b6d4"],
};

const truncate = (text = "", max) => (text.length > max ? `${text.slice(0, max)}…` : text);
const initial = (name) => (name || "?").charAt(0).toUpperCase();

function Stars({ rating = 5 }) {
  return (
    <span className="lp-mrb__stars" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} aria-hidden="true" className={s <= rating ? "is-on" : undefined}>★</span>
      ))}
    </span>
  );
}

/**
 * Carrusel de reseñas cortas para las landings (antes 4 copias con 2 variantes).
 *
 * - `variant="carousel"`: tarjetas que se deslizan (Sillón, Kit, EMS).
 * - `variant="card"`: una tarjeta con foto y flechas (Facial).
 * - `maxChars`: largo máximo del texto en el carrusel (se corta con “…”).
 * - `tone`: `green` | `wine` | `accent` (ficha de producto, toma `--pd-accent-rgb`).
 *
 * Patrón de carrusel accesible (WAI-ARIA APG): región con `aria-roledescription`,
 * slides como grupos "N de M", las ocultas con `inert`, puntos con `aria-label`
 * y `aria-current`. El autoplay se pausa con hover/foco y no corre con
 * `prefers-reduced-motion`. En mobile se puede deslizar con el dedo.
 */
export default function MiniReviewsBar({
  reviews = [],
  variant = "carousel",
  tone = "green",
  label = "Lo que dicen nuestros clientes",
  maxChars = 110,
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchX = useRef(null);
  const labelId = useId();
  const count = reviews.length;
  const current = count ? active % count : 0;

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, paused, reduceMotion]);

  if (!count) return null;

  const go = (i) => setActive((i + count) % count);
  const colors = AVATAR_COLORS[tone] || AVATAR_COLORS.green;

  const pauseProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
    },
    onTouchStart: (e) => {
      touchX.current = e.touches[0].clientX;
      setPaused(true);
    },
    onTouchEnd: (e) => {
      const start = touchX.current;
      touchX.current = null;
      if (start == null) return;
      const dx = e.changedTouches[0].clientX - start;
      if (Math.abs(dx) > SWIPE_PX) go(current + (dx < 0 ? 1 : -1));
    },
  };

  const dots = (
    <div className="lp-mrb__dots">
      {reviews.map((rev, i) => (
        <button
          key={i}
          type="button"
          className={`lp-mrb__dot${i === current ? " is-on" : ""}`}
          aria-label={`Ver reseña ${i + 1} de ${count}${rev.name ? `, de ${rev.name}` : ""}`}
          aria-current={i === current ? "true" : undefined}
          onClick={() => go(i)}
        />
      ))}
    </div>
  );

  return (
    <section
      className={`lp-mrb lp-mrb--${variant} lp-mrb--${tone}`}
      aria-roledescription="carrusel"
      aria-labelledby={labelId}
      {...pauseProps}
    >
      <h2 className="lp-mrb__label" id={labelId}>{label}</h2>

      {variant === "card" ? (
        <CardSlide rev={reviews[current]} index={current} count={count} color={colors[current % colors.length]} />
      ) : (
        <div className="lp-mrb__viewport">
          <div className="lp-mrb__track" style={{ transform: `translateX(-${current * 100}%)` }}>
            {reviews.map((rev, i) => (
              <div
                key={i}
                className="lp-mrb__slide"
                role="group"
                aria-roledescription="reseña"
                aria-label={`${i + 1} de ${count}`}
                aria-hidden={i === current ? undefined : true}
                inert={i === current ? undefined : true}
              >
                <figure className="lp-mrb__card">
                  <figcaption className="lp-mrb__head">
                    <span className="lp-mrb__avatar" aria-hidden="true" style={{ background: colors[i % colors.length] }}>
                      {initial(rev.name)}
                    </span>
                    <span className="lp-mrb__meta">
                      <span className="lp-mrb__name">{rev.name}</span>
                      <Stars rating={rev.rating} />
                    </span>
                  </figcaption>
                  <blockquote className="lp-mrb__text">“{truncate(rev.text, maxChars)}”</blockquote>
                </figure>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "card" ? (
        <div className="lp-mrb__nav">
          <button type="button" className="lp-mrb__arrow" onClick={() => go(current - 1)} aria-label="Reseña anterior">‹</button>
          {dots}
          <button type="button" className="lp-mrb__arrow" onClick={() => go(current + 1)} aria-label="Reseña siguiente">›</button>
        </div>
      ) : (
        dots
      )}
    </section>
  );
}

function CardSlide({ rev, index, count, color }) {
  const avatarSrc = rev.mrbImg || rev.img;
  return (
    <figure
      key={index}
      className="lp-mrb__card"
      role="group"
      aria-roledescription="reseña"
      aria-label={`${index + 1} de ${count}`}
    >
      {avatarSrc ? (
        <img className="lp-mrb__photo" src={avatarSrc} alt="" width="58" height="58" loading="lazy" decoding="async" />
      ) : (
        <span className="lp-mrb__photo lp-mrb__photo--fallback" aria-hidden="true" style={{ background: color }}>
          {initial(rev.name)}
        </span>
      )}
      <div className="lp-mrb__content">
        <blockquote className="lp-mrb__text">{truncate(rev.text, 120)}</blockquote>
        <figcaption className="lp-mrb__meta">
          <span className="lp-mrb__name">{rev.name}</span>
          <Stars rating={rev.rating} />
        </figcaption>
      </div>
    </figure>
  );
}
