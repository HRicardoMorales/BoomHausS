import { useRef, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { REVIEW_WIDTHS } from '../../../components/landing/imageSizes';
import { photoReviews } from '../data';

/* S15b — Carrusel de reseñas con foto (swipe) */
export default function PhotoReviews() {
  const [prIdx, setPrIdx] = useState(0);
  const prTouchX = useRef(null);

  const prHandleTouchStart = (e) => { prTouchX.current = e.touches[0].clientX; };
  const prHandleTouchEnd = (e) => {
    if (prTouchX.current === null) return;
    const diff = prTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setPrIdx(i => Math.min(i + 1, photoReviews.length - 1));
      else setPrIdx(i => Math.max(i - 1, 0));
    }
    prTouchX.current = null;
  };

  return (
    <div className="led-photo-reviews-section">
      <div className="led-pr-inner">
        <div className="led-pr-viewport" onTouchStart={prHandleTouchStart} onTouchEnd={prHandleTouchEnd}>
          <div className="led-pr-track" style={{ transform: `translateX(-${prIdx * (100 / photoReviews.length)}%)` }}>
            {photoReviews.map((r, i) => (
              <div key={i} className="led-pr-card">
                <SafeImg src={r.img} alt={`Foto de la reseña de ${r.name}`} className="led-pr-img" sizes="min(480px, 88vw)" widths={REVIEW_WIDTHS} />
                <div className="led-pr-body">
                  <span className="led-pr-stars">{'★'.repeat(r.stars)}</span>
                  <p className="led-pr-text">{r.text}</p>
                  <span className="led-pr-name">- {r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="led-pr-dots">
          {photoReviews.map((_, i) => (
            <button
              key={i}
              className={`led-pr-dot${i === prIdx ? ' led-pr-dot--active' : ''}`}
              onClick={() => setPrIdx(i)}
              aria-label={`Reseña ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
