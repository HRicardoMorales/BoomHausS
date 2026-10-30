import { useEffect, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';
import { heroReviews } from '../data';

/* Reseña del hero: rota sola cada 5 s y avanza con › */
export default function HeroReview() {
  const [hrIdx, setHrIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHrIdx(i => (i + 1) % heroReviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pdx-hero-review">
      <div className="pdx-hr-avatar">
        <SafeImg src={heroReviews[hrIdx].avatar} alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} className="pdx-hr-avatar-img" />
      </div>
      <div className="pdx-hr-content">
        <div className="pdx-hr-top">
          <strong className="pdx-hr-name">{heroReviews[hrIdx].name}</strong>
          <span className="pdx-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
        </div>
        <p className="pdx-hr-text">"{heroReviews[hrIdx].text}"</p>
      </div>
      <button className="pdx-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
    </div>
  );
}
