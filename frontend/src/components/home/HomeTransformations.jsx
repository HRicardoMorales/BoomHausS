import { useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BeforeAfterSlider from "../landing/BeforeAfterSlider.jsx";
import useNearViewport from "../../hooks/useNearViewport.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import { collectTransformations } from "../../landings/homeProof.js";

/*
 * Antes/después + estadísticas. Todo sale de las landings (`beforeAfter` y
 * `statsCircles`): solo productos con las dos fotos reales. Selector por
 * producto (tabs ARIA con flechas), slider reutilizado de las landings y
 * números que cuentan al entrar en pantalla.
 */
export default function HomeTransformations() {
  const items = useMemo(() => collectTransformations(), []);
  const [activeId, setActiveId] = useState(items[0]?.id);
  const sectionRef = useRef(null);
  const visible = useNearViewport(sectionRef, { margin: -140 });
  const reduced = usePrefersReducedMotion();
  const baseId = useId();
  const tabRefs = useRef([]);

  if (items.length === 0) return null;
  const index = Math.max(0, items.findIndex((t) => t.id === activeId));
  const active = items[index];

  const onTabKey = (e) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (e.key === "Home" || e.key === "End" || delta) {
      e.preventDefault();
      const next = e.key === "Home" ? 0
        : e.key === "End" ? items.length - 1
        : (index + delta + items.length) % items.length;
      setActiveId(items[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section className="ht" aria-labelledby={`${baseId}-title`} ref={sectionRef}>
      <div className="hp-inner">
        <header className="hp-head hp-head--split hc-anim">
          <div>
            <p className="hp-eyebrow hp-eyebrow--ink">Resultados</p>
            <h2 className="hp-title hp-title--ink" id={`${baseId}-title`}>
              El cambio, <em>a la vista.</em>
            </h2>
          </div>
          <p className="hp-lede hp-lede--ink">
            Fotos de antes y después y lo que cuentan quienes ya lo usan. Elegí un producto y
            arrastrá la línea.
          </p>
        </header>

        {items.length > 1 && (
          <div className="ht-tabs hc-anim" role="tablist" aria-label="Producto" onKeyDown={onTabKey}>
            {items.map((t, i) => {
              const selected = i === index;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className="ht-tab"
                  onClick={() => setActiveId(t.id)}
                >
                  {t.product}
                </button>
              );
            })}
          </div>
        )}

        <div
          className="ht-panel"
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${index}`}
        >
          <div className="ht-media" key={active.id}>
            <BeforeAfterSlider
              imgBefore={active.before}
              imgAfter={active.after}
              beforeLabel={active.beforeLabel}
              afterLabel={active.afterLabel}
              hint=""
            />
          </div>

          <div className="ht-stats">
            <ol className="ht-stat-list" key={active.id}>
              {active.stats.map((s, i) => (
                <Stat key={i} stat={s} active={visible} instant={reduced} delay={i} />
              ))}
            </ol>
            {active.note && <p className="ht-note">{active.note}</p>}
            <Link className="ht-link" to={active.href}>
              Ver {active.product}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ stat, active, instant, delay }) {
  const n = useCountUp(stat.value, { active, instant, duration: 1300 + delay * 200 });
  return (
    <li className="ht-stat" style={{ "--ht-fill": `${n}%` }}>
      {/* El lector de pantalla recibe el número final, no la cuenta. */}
      <span className="ht-stat-num" aria-hidden="true">
        {n}<small>%</small>
      </span>
      <p className="ht-stat-text">
        <span className="sr-only">{stat.value}% — </span>
        {stat.parts.map((p, i) => (p.strong ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
      </p>
      <span className="ht-stat-bar" aria-hidden="true" />
    </li>
  );
}
