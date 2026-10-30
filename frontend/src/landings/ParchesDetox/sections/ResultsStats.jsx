import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../../hooks/useCountUp.js';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion.js';

/* Stats circulares */
const statsData = [
  { pct: 92, text: <>Personas que notaron <strong>más energía al despertar</strong> en las primeras 2 semanas.</> },
  { pct: 89, text: <>Reportaron <strong>piernas más livianas</strong> y menos hinchazón al final del día.</> },
  { pct: 85, text: <>Mejoraron la <strong>calidad de su sueño</strong> según encuesta interna.</> },
  { pct: 94, text: <>Lo <strong>recomendarían a un amigo</strong> sin dudarlo.</> },
];

/* Una fila: cuenta de 0 al porcentaje una sola vez, al entrar en pantalla.
   Antes cada fila sumaba 1 por frame con un setState sobre el array entero,
   sin cancelar el rAF ni respetar reduced motion, y terminaba **un punto
   arriba** (93 en vez de 92): el updater leía `current` después del `current++`. */
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
    <div className="pdx-sc-row" ref={ref}>
      <div className="pdx-sc-circle" style={{ '--pdx-sc-pct': `${value}%` }} aria-hidden="true">
        <span className="pdx-sc-pct">{value}%</span>
      </div>
      {/* El donut es decorativo: el lector de pantalla lee el valor final, no la cuenta. */}
      <p className="pdx-sc-text"><span className="sr-only">{pct}%: </span>{text}</p>
    </div>
  );
}

function PdxStatsCircles({ items }) {
  const instant = usePrefersReducedMotion();
  return (
    <div className="pdx-sc-section">
      <div className="pdx-sc-list">
        {items.map((item, i) => (
          <StatRow key={i} pct={item.pct} text={item.text} instant={instant} />
        ))}
      </div>
    </div>
  );
}

/* S4 — Stats circulares */
export default function ResultsStats() {
  return (
    <div className="pdx-section pdx-section--white">
      <div className="pdx-container">
        <h2 className="pdx-section-title">Resultados reales, números reales.</h2>
        <p className="pdx-section-sub">Basado en encuestas a clientes de Amelor con compra verificada.</p>
        <PdxStatsCircles items={statsData} />
      </div>
    </div>
  );
}
