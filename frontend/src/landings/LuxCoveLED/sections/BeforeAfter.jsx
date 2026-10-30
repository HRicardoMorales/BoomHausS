import { useEffect, useRef, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import useNearViewport from '../../../hooks/useNearViewport';
import { preloadImage } from '../../../utils/preloadImage';
import { beforeAfterData, BA_SIZES } from '../data';

/* S11 — Carrusel antes y después */
export default function BeforeAfter() {
  const [baIdx, setBaIdx] = useState(0);

  /* Al acercarse a la sección se precarga solo la foto visible y la
     siguiente, con el mismo candidato del srcset que elige <SafeImg>. */
  const baSectionRef = useRef(null);
  const baNear = useNearViewport(baSectionRef);
  useEffect(() => {
    if (!baNear) return;
    [baIdx, baIdx + 1].forEach((i) => {
      if (beforeAfterData[i]) preloadImage(beforeAfterData[i].src, { sizes: BA_SIZES });
    });
  }, [baNear, baIdx]);

  return (
    <div className="led-section led-section--pink" ref={baSectionRef}>
      <div className="led-container">
        <h2 className="led-section-title">Clientes reales, resultados reales</h2>
        <div className="led-ba-carousel">
          <div className="led-ba-card">
            <div className="led-ba-img">
              <SafeImg
                src={beforeAfterData[baIdx].src}
                alt={beforeAfterData[baIdx].name}
                sizes={BA_SIZES}
                className="led-ba-photo"
              />
              <div className="led-ba-day-labels">
                <span className="led-ba-day">Día 1</span>
                <span className="led-ba-day">Día 30</span>
              </div>
            </div>
            <div className="led-ba-body">
              <div className="led-ba-meta">
                <span className="led-ba-name">{beforeAfterData[baIdx].name}</span>
                <span className="led-ba-stars">{'★'.repeat(beforeAfterData[baIdx].stars)}</span>
              </div>
              <p className="led-ba-text">"{beforeAfterData[baIdx].text}"</p>
            </div>
          </div>
          <div className="led-ba-nav">
            <button className="led-test-btn" onClick={() => setBaIdx(i => Math.max(0, i - 1))} disabled={baIdx === 0} aria-label="Anterior">‹</button>
            <div className="led-test-dots">
              {beforeAfterData.map((_, i) => (
                <button key={i} className={`led-test-dot${i === baIdx ? ' led-active' : ''}`} onClick={() => setBaIdx(i)} aria-label={`Resultado ${i + 1}`} />
              ))}
            </div>
            <button className="led-test-btn" onClick={() => setBaIdx(i => Math.min(beforeAfterData.length - 1, i + 1))} disabled={baIdx === beforeAfterData.length - 1} aria-label="Siguiente">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
