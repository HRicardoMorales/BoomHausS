import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import "./StatsCircles.css";

const DURATION_MS = 1400;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Hook: anima un número de 0 a `target` cuando el elemento entra en pantalla.
 * Una sola vez por elemento; respeta `prefers-reduced-motion` y cancela el
 * requestAnimationFrame al desmontar (antes quedaba un setState colgado).
 */
function useCountUpOnView(target, reduceMotion) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let frame = 0;
    const run = () => {
      if (reduceMotion) {
        setValue(target);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        setValue(Math.round(easeOutCubic(t) * target));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, reduceMotion]);

  return [ref, value];
}

function StatRow({ target, text, reduceMotion }) {
  const [ref, value] = useCountUpOnView(target, reduceMotion);
  return (
    <div className="sc-row" ref={ref}>
      <div className="sc-circle" style={{ "--sc-pct": `${value}%` }} aria-hidden="true">
        <span className="sc-pct">{value}%</span>
      </div>
      {/* El porcentaje final va en texto para lectores de pantalla (el donut es decorativo). */}
      <span className="sc-sr-only">{target}%</span>
      {/* `text` viene de la config estática de la landing (src/landings/*.js), no de usuarios. */}
      <p className="sc-text" dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

/**
 * Sección de estadísticas con donuts animados + resumen (clientes, satisfacción, reseñas).
 * Antes estaba copiada 5 veces (ProductDetail + 4 landings) con su CSS inline.
 *
 * @param {object} props.mc     config de marketing de la landing (`statsCircles`, `statsTitle`, …)
 * @param {"green"|"wine"} [props.tone]  paleta del donut
 * @param {string} [props.className]
 */
export default function StatsCircles({ mc, tone = "green", className = "" }) {
  const reduceMotion = useReducedMotion();
  const items = mc?.statsCircles || [];
  if (!items.length) return null;

  const summary = [
    mc.soldCount && { val: `+${mc.soldCount.toLocaleString("es-AR")}`, lbl: "Clientes" },
    mc.reviewScore && { val: `${Math.round(mc.reviewScore * 20)}%`, lbl: "Satisfacción" },
    mc.reviewCount && { val: `+${mc.reviewCount}`, lbl: "Reseñas" },
  ].filter(Boolean);

  return (
    <section className={`sc-section sc-section--${tone} anim-el ${className}`.trim()}>
      {mc.statsTitle && <h2 className="sc-title">{mc.statsTitle}</h2>}
      <div className="sc-list">
        {items.map((item, i) => (
          <StatRow key={i} target={item.target} text={item.text} reduceMotion={reduceMotion} />
        ))}
      </div>
      <div className="sc-footer">
        <p className="sc-footer-note">{mc.statsFooterNote || "*Basado en compras verificadas"}</p>
        {summary.length > 0 && (
          <dl className="sc-footer-stats">
            {summary.map(({ val, lbl }) => (
              <div className="sc-stat" key={lbl}>
                <dt className="sc-stat-lbl">{lbl}</dt>
                <dd className="sc-stat-val">{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
