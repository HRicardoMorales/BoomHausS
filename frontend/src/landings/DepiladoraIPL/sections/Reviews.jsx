import { useRef, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { REVIEW_WIDTHS } from '../../../components/landing/imageSizes';
import { REVIEWS } from '../data';

/* S10 — Carrusel de reseñas con foto (swipe) */
export default function Reviews() {
  const [reviewIdx, setReviewIdx] = useState(0);
  const reviewTouchX = useRef(null);

  return (
    <div className="ipl-section ipl-section--rose">
      <div className="ipl-container">
        <h2 className="ipl-section-title">Lo que dicen nuestras clientas</h2>
        <p className="ipl-section-sub">Reseñas verificadas de compradoras reales.</p>
        <div
          className="ipl-rev-carousel"
          onTouchStart={e => { reviewTouchX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (reviewTouchX.current === null) return;
            const diff = reviewTouchX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) setReviewIdx(i => Math.min(i + 1, REVIEWS.length - 1));
              else setReviewIdx(i => Math.max(i - 1, 0));
            }
            reviewTouchX.current = null;
          }}
        >
          <div className="ipl-rev-card">
            <div className="ipl-review-img-wrap">
              {REVIEWS[reviewIdx].reviewImg
                ? <SafeImg src={REVIEWS[reviewIdx].reviewImg} alt={`Foto de la reseña de ${REVIEWS[reviewIdx].name}`} sizes="min(520px, 88vw)" widths={REVIEW_WIDTHS} />
                : <div className="ipl-review-img-ph">📷</div>
              }
            </div>
            <div className="ipl-review-body">
              <div className="ipl-review-top">
                <span className="ipl-review-name">{REVIEWS[reviewIdx].name}</span>
                <span className="ipl-review-stars">{'★'.repeat(REVIEWS[reviewIdx].stars)}</span>
              </div>
              <p className="ipl-review-text">{REVIEWS[reviewIdx].text}</p>
            </div>
          </div>
          <div className="ipl-rev-nav">
            <button type="button" className="ipl-rev-arrow" aria-label="Reseña anterior" onClick={() => setReviewIdx(i => Math.max(i - 1, 0))} disabled={reviewIdx === 0}><span aria-hidden="true">‹</span></button>
            <div className="ipl-rev-dots">
              {REVIEWS.map((_, i) => (
                <button key={i} type="button" className={`ipl-rev-dot${i === reviewIdx ? ' active' : ''}`} onClick={() => setReviewIdx(i)} aria-label={`Ver reseña ${i + 1} de ${REVIEWS.length}`} aria-current={i === reviewIdx || undefined} />
              ))}
            </div>
            <button type="button" className="ipl-rev-arrow" aria-label="Reseña siguiente" onClick={() => setReviewIdx(i => Math.min(i + 1, REVIEWS.length - 1))} disabled={reviewIdx === REVIEWS.length - 1}><span aria-hidden="true">›</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
