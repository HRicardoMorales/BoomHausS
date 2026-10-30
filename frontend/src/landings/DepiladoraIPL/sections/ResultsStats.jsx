import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../../hooks/useCountUp.js';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion.js';

/* Stats circulares (con JSX, por eso no van en data.js) */
const statsData = [
  { pct: 91, text: <>Clientas que notaron <strong>reducción visible de vello</strong> desde la sesión 3.</> },
  { pct: 88, text: <>Dicen que es <strong>mucho menos doloroso</strong> que la cera o el hilo.</> },
  { pct: 93, text: <>No necesitaron <strong>volver al centro estético</strong> después de 8 semanas.</> },
  { pct: 96, text: <>Lo <strong>recomendarían a una amiga</strong> sin dudarlo.</> },
];

/* Una fila: cuenta de 0 al porcentaje una sola vez, al entrar en pantalla.
   Antes cada fila sumaba 1 por frame con un setState sobre el array entero
   (~95 renders de toda la lista por fila), sin cancelar el rAF al desmontar
   y sin respetar reduced motion. */
function StatRow({ pct, text, instant }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setSeen(true);
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const value = useCountUp(pct, { active: seen, instant });
  return (
    <div className="ipl-sc-row" ref={ref}>
      <div className="ipl-sc-circle" style={{ '--ipl-sc-pct': `${value}%` }} aria-hidden="true">
        <span className="ipl-sc-pct">{value}%</span>
      </div>
      {/* El donut es decorativo: el lector de pantalla lee el valor final, no la cuenta. */}
      <p className="ipl-sc-text"><span className="sr-only">{pct}%: </span>{text}</p>
    </div>
  );
}

function IplStatsCircles({ items }) {
  const instant = usePrefersReducedMotion();
  return (
    <div className="ipl-sc-section">
      <div className="ipl-sc-list">
        {items.map((item, i) => (
          <StatRow key={i} pct={item.pct} text={item.text} instant={instant} />
        ))}
      </div>
    </div>
  );
}

/* S4 — Resultados en números */
export default function ResultsStats() {
  return (
    <div className="ipl-section ipl-section--white">
      <div className="ipl-container">
        <h2 className="ipl-section-title">Resultados reales, números reales.</h2>
        <p className="ipl-section-sub">Basado en encuestas a clientas de Amelor con compra verificada.</p>
        <IplStatsCircles items={statsData} />
      </div>
    </div>
  );
}
