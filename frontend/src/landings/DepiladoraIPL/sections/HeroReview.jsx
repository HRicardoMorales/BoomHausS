import { useEffect, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';
import { heroReviews } from '../data';

const ROTATE_MS = 5000;

/* Reseña del hero: rota sola cada 5 s y avanza con ›. Antes el intervalo
   vivía en el componente raíz y re-renderizaba toda la landing cada 5 s. */
export default function HeroReview() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % heroReviews.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const review = heroReviews[idx];
  return (
    <div className="ipl-hero-review">
      <div className="ipl-hr-avatar">
        <SafeImg src={review.avatar} alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} className="ipl-hr-avatar-img" />
      </div>
      <div className="ipl-hr-content">
        <div className="ipl-hr-top">
          <strong className="ipl-hr-name">{review.name}</strong>
          <span className="ipl-hr-stars">{'★'.repeat(review.stars)}</span>
        </div>
        <p className="ipl-hr-text">"{review.text}"</p>
      </div>
      <button className="ipl-hr-next" onClick={() => setIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
    </div>
  );
}
