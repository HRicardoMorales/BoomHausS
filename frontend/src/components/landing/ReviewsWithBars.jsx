import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import StarRating from "./StarRating";
import "./ReviewsWithBars.css";

const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/**
 * Bloque de reseñas de las landings: puntaje grande, distribución por
 * estrellas y carrusel de reseñas con foto (antes 4 copias casi idénticas).
 *
 * - El carrusel usa scroll-snap nativo (swipe gratis en mobile) y el punto
 *   activo se sincroniza con el scroll: antes solo cambiaba al tocar un punto
 *   o una flecha, así que al deslizar con el dedo quedaba desfasado.
 * - Se desplaza con `scrollTo` sobre la fila, no con `scrollIntoView`, que
 *   también movía el contenedor vertical de la landing.
 * - Puntos con `aria-label`/`aria-current` y 24 px táctiles; flechas que se
 *   deshabilitan en los extremos; distribución legible por lectores.
 *
 * `tone`: "green" | "wine". `quoteColor` pisa el color del globo de comillas.
 */
export default function ReviewsWithBars({
  reviews = [],
  distribution = [],
  title,
  subtitle,
  score = 4.8,
  count = 0,
  tone = "green",
  quoteColor,
  placeholder = "⭐",
}) {
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);
  const frame = useRef(0);
  const reduceMotion = useReducedMotion();
  const carouselId = useId();
  const total = reviews.length;

  const slideLeft = (row, i) => {
    const slide = row.children[i];
    if (!slide) return 0;
    return slide.offsetLeft - (row.clientWidth - slide.clientWidth) / 2;
  };

  const goTo = (i) => {
    const row = rowRef.current;
    const next = Math.max(0, Math.min(total - 1, i));
    setActive(next);
    if (!row) return;
    row.scrollTo({ left: slideLeft(row, next), behavior: reduceMotion ? "auto" : "smooth" });
  };

  /* Slide más cercano al centro de la fila → punto activo. */
  const syncActive = useCallback(() => {
    frame.current = 0;
    const row = rowRef.current;
    if (!row) return;
    const center = row.scrollLeft + row.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(row.children).forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  const onScroll = () => {
    if (!frame.current) frame.current = requestAnimationFrame(syncActive);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const style = quoteColor ? { "--rwb-quote": quoteColor } : undefined;

  return (
    <div className={`lp-rwb lp-rwb--${tone}`} style={style}>
      <div className="sec-head">
        <h2 className="sec-title">{title}</h2>
        {subtitle && <p className="sec-sub">{subtitle}</p>}
      </div>

      <div className="lp-rwb__summary">
        <div className="lp-rwb__score">
          <span className="lp-rwb__score-num">{fmt.format(score)}</span>
          <StarRating value={score} size="lg" />
          <span className="lp-rwb__score-count">+{count} reseñas</span>
        </div>
        {distribution.length > 0 && (
          <ul className="lp-rwb__bars" aria-label="Distribución de puntajes">
            {distribution.map((d) => (
              <li key={d.stars} className="lp-rwb__bar-row">
                <span className="lp-rwb__bar-label" aria-hidden="true">{d.stars}★</span>
                <span className="lp-rwb__bar-track" aria-hidden="true">
                  <span className="lp-rwb__bar-fill" style={{ width: `${d.pct}%` }} />
                </span>
                <span className="lp-rwb__bar-pct" aria-hidden="true">{d.pct}%</span>
                <span className="sr-only">{`${d.stars} estrellas: ${d.pct}%`}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > 0 && (
        <section className="lp-rwb__carousel" aria-roledescription="carrusel" aria-label="Reseñas de clientes">
          <button
            type="button"
            className="lp-rwb__nav lp-rwb__nav--prev"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-controls={carouselId}
            aria-label="Reseña anterior"
          >
            ‹
          </button>
          <div className="lp-rwb__row" id={carouselId} ref={rowRef} onScroll={onScroll}>
            {reviews.map((r, i) => (
              <article
                className="lp-rwb__slide"
                key={`${r.name}-${i}`}
                aria-roledescription="reseña"
                aria-label={`${i + 1} de ${total}`}
              >
                <div className="lp-rwb__card">
                  <div className="lp-rwb__media">
                    {r.img ? (
                      <img src={r.img} alt={r.imgAlt || `Foto de la reseña de ${r.name}`} loading="lazy" decoding="async" />
                    ) : (
                      <div className="lp-rwb__ph" aria-hidden="true">{placeholder}</div>
                    )}
                    <span className="lp-rwb__quote" aria-hidden="true">“</span>
                  </div>
                  <div className="lp-rwb__body">
                    <StarRating value={r.rating} />
                    <h3 className="lp-rwb__title">{r.title}</h3>
                    <p className="lp-rwb__text">{r.text}</p>
                    <p className="lp-rwb__name">— {r.name}{r.age ? `, ${r.age} años` : ""}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="lp-rwb__nav lp-rwb__nav--next"
            onClick={() => goTo(active + 1)}
            disabled={active === total - 1}
            aria-controls={carouselId}
            aria-label="Reseña siguiente"
          >
            ›
          </button>
          <div className="lp-rwb__dots">
            {reviews.map((r, i) => (
              <button
                type="button"
                key={`${r.name}-${i}`}
                className={`lp-rwb__dot${i === active ? " is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Ver reseña ${i + 1} de ${total}`}
                aria-current={i === active ? "true" : undefined}
                aria-controls={carouselId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
