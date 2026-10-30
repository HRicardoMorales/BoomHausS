import { useEffect, useRef, useState } from 'react';

/* Stats circulares */
const statsData = [
  { pct: 92, text: <>Personas que notaron <strong>más energía al despertar</strong> en las primeras 2 semanas.</> },
  { pct: 89, text: <>Reportaron <strong>piernas más livianas</strong> y menos hinchazón al final del día.</> },
  { pct: 85, text: <>Mejoraron la <strong>calidad de su sueño</strong> según encuesta interna.</> },
  { pct: 94, text: <>Lo <strong>recomendarían a un amigo</strong> sin dudarlo.</> },
];

/* ── Subcomponente: Stats circulares ─────────────────────── */
function PdxStatsCircles({ items }) {
  const circleRefs = useRef([]);
  const animatedRef = useRef(items.map(() => false));
  const [values, setValues] = useState(() => items.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.dataset.idx);
          if (animatedRef.current[idx]) return;
          animatedRef.current[idx] = true;
          const target = items[idx].pct;
          let current = 0;
          const step = () => {
            if (current <= target) {
              setValues(prev => { const next = [...prev]; next[idx] = current; return next; });
              current++;
              requestAnimationFrame(step);
            }
          };
          step();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    circleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pdx-sc-section">
      <div className="pdx-sc-list">
        {items.map((item, i) => (
          <div key={i} className="pdx-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="pdx-sc-circle" style={{ '--pdx-sc-pct': `${values[i]}%` }}>
              <span className="pdx-sc-pct">{values[i]}%</span>
            </div>
            <p className="pdx-sc-text">{item.text}</p>
          </div>
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
