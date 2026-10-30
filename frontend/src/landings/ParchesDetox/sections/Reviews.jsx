import { useRef, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { REVIEW_WIDTHS } from '../../../components/landing/imageSizes';
import { REVIEWS } from '../data';

/* S10 — Carrusel de reseñas con swipe */
export default function Reviews() {
  const [reviewIdx, setReviewIdx] = useState(0);
  const reviewTouchX = useRef(null);

  return (
    <div className="pdx-section pdx-section--green">
      <div className="pdx-container">
        <h2 className="pdx-section-title">Lo que dicen nuestros clientes</h2>
        <p className="pdx-section-sub">Reseñas verificadas de compradores reales.</p>
        <div
          className="pdx-rev-carousel"
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
          <div className="pdx-rev-card">
            <div className="pdx-review-img-wrap">
              {REVIEWS[reviewIdx].reviewImg
                ? <SafeImg src={REVIEWS[reviewIdx].reviewImg} alt={`Foto de la reseña de ${REVIEWS[reviewIdx].name}`} sizes="min(520px, 88vw)" widths={REVIEW_WIDTHS} />
                : <div className="pdx-review-img-ph">🌿</div>
              }
            </div>
            <div className="pdx-review-body">
              <div className="pdx-review-top">
                <span className="pdx-review-name">{REVIEWS[reviewIdx].name}</span>
                <span className="pdx-review-stars">{'★'.repeat(REVIEWS[reviewIdx].stars)}</span>
              </div>
              <p className="pdx-review-text">{REVIEWS[reviewIdx].text}</p>
            </div>
          </div>
          <div className="pdx-rev-nav">
            <button className="pdx-rev-arrow" onClick={() => setReviewIdx(i => Math.max(i - 1, 0))} disabled={reviewIdx === 0}>‹</button>
            <div className="pdx-rev-dots">
              {REVIEWS.map((_, i) => (
                <button key={i} type="button" className={`pdx-rev-dot${i === reviewIdx ? ' active' : ''}`} onClick={() => setReviewIdx(i)} aria-label={`Ver reseña ${i + 1} de ${REVIEWS.length}`} aria-current={i === reviewIdx || undefined} />
              ))}
            </div>
            <button className="pdx-rev-arrow" onClick={() => setReviewIdx(i => Math.min(i + 1, REVIEWS.length - 1))} disabled={reviewIdx === REVIEWS.length - 1}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
