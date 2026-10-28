import { useEffect, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';
import { reviewsData } from '../data';

/* S3 — Carrusel de testimonios (C13) */
export default function Testimonials() {
  const [testIdx, setTestIdx] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const update = () => setSlidesPerView(window.innerWidth >= 768 ? 3 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxTestIdx = Math.max(0, reviewsData.length - slidesPerView);
  const testPrev = () => setTestIdx(i => Math.max(0, i - 1));
  const testNext = () => setTestIdx(i => Math.min(maxTestIdx, i + 1));

  return (
    <div className="led-section led-section--pink">
      <div className="led-container">
        <h2 className="led-section-title">
          A nuestros clientes les <em>ENCANTA</em> nuestro Escultor Facial LED
        </h2>
        <div className="led-test-viewport">
          <div
            className="led-test-track"
            style={{ transform: `translateX(-${testIdx * (100 / slidesPerView)}%)` }}
          >
            {reviewsData.map((t, i) => (
              <div key={i} className="led-test-slide">
                <div className="led-test-card">
                  <div className="led-review-avatar">
                    <SafeImg src={t.avatar} alt="" width={42} height={42} sizes="42px" widths={ICON_WIDTHS} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div className="led-review-stars">{'★'.repeat(t.stars)}</div>
                  <p className="led-test-text">"{t.text}"</p>
                  <div className="led-test-name">— {t.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="led-test-nav">
          <button className="led-test-btn" onClick={testPrev} aria-label="Anterior">‹</button>
          <div className="led-test-dots">
            {Array.from({ length: maxTestIdx + 1 }).map((_, i) => (
              <button key={i} className={`led-test-dot${i === testIdx ? ' led-active' : ''}`} onClick={() => setTestIdx(i)} aria-label={`Ir al testimonio ${i + 1}`} />
            ))}
          </div>
          <button className="led-test-btn" onClick={testNext} aria-label="Siguiente">›</button>
        </div>
      </div>
    </div>
  );
}
