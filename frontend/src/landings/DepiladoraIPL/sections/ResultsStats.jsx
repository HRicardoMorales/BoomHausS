import { useEffect, useRef, useState } from 'react';

/* Stats circulares (con JSX, por eso no van en data.js) */
const statsData = [
  { pct: 91, text: <>Clientas que notaron <strong>reducción visible de vello</strong> desde la sesión 3.</> },
  { pct: 88, text: <>Dicen que es <strong>mucho menos doloroso</strong> que la cera o el hilo.</> },
  { pct: 93, text: <>No necesitaron <strong>volver al centro estético</strong> después de 8 semanas.</> },
  { pct: 96, text: <>Lo <strong>recomendarían a una amiga</strong> sin dudarlo.</> },
];

/* Contador circular que arranca al entrar en pantalla */
function IplStatsCircles({ items }) {
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
      { threshold: 0.1 }
    );
    circleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ipl-sc-section">
      <div className="ipl-sc-list">
        {items.map((item, i) => (
          <div key={i} className="ipl-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="ipl-sc-circle" style={{ '--ipl-sc-pct': `${values[i]}%` }}>
              <span className="ipl-sc-pct">{values[i]}%</span>
            </div>
            <p className="ipl-sc-text">{item.text}</p>
          </div>
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
