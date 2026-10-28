import { useEffect, useRef, useState } from 'react';

/* C6 — Stats para círculos animados */
const statsData = [
  { pct: 90, text: <>Clientas que notaron <strong>reducción visible de papada</strong> en las primeras 4 semanas.</> },
  { pct: 89, text: <>Dicen que sus <strong>líneas de expresión se suavizaron</strong> usando el Escultor LED.</> },
  { pct: 85, text: <>Reportan <strong>mejora significativa</strong> en tono y textura de piel.</> },
  { pct: 92, text: <>Lo <strong>recomendarían a una amiga</strong> o familiar sin dudarlo.</> },
];

/* C6 — Stats circulares animados (adaptado del masajeador EMS) */
export default function StatsCircles({ items = statsData }) {
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
              setValues(prev => {
                const next = [...prev];
                next[idx] = current;
                return next;
              });
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
    <div className="led-sc-section">
      <div className="led-sc-list">
        {items.map((item, i) => (
          <div key={i} className="led-sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="led-sc-circle" style={{ '--led-sc-pct': `${values[i]}%` }}>
              <span className="led-sc-pct">{values[i]}%</span>
            </div>
            <p className="led-sc-text">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="led-sc-footer">
        <p className="led-sc-footer-note">*Basado en compras verificadas</p>
        <div className="led-sc-footer-stats">
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">+10.000</span>
            <span className="led-sc-stat-lbl">CLIENTES</span>
          </div>
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">4.8/5</span>
            <span className="led-sc-stat-lbl">SATISFACCIÓN</span>
          </div>
          <div className="led-sc-stat">
            <span className="led-sc-stat-val">+5.000</span>
            <span className="led-sc-stat-lbl">RESEÑAS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
