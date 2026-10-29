import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';
import { heroReviews } from '../data';

/* C5 — Reseña rotativa dentro del hero (avanza con el botón ›). */
export default function HeroReview() {
  const [idx, setIdx] = useState(0);
  const review = heroReviews[idx];
  return (
    <div className="led-hero-review">
      <div className="led-hr-avatar">
        <SafeImg src={review.avatar} alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} />
      </div>
      <div className="led-hr-content">
        <div className="led-hr-top">
          <strong className="led-hr-name">{review.name}</strong>
          <span className="led-hr-stars">{'★'.repeat(review.stars)}</span>
        </div>
        <p className="led-hr-text">"{review.text}"</p>
      </div>
      <button className="led-hr-next" onClick={() => setIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
    </div>
  );
}
