import SafeImg from '../../../components/SafeImg';
import StatsCircles from './StatsCircles';

/* S5 — Resultados en 30 días con stats circulares (C6) */
export default function ResultsStats() {
  return (
    <div className="led-section led-section--white">
      <div className="led-container">
        <h2 className="led-section-title">Vea resultados visibles en solo 30 días.</h2>
        <p className="led-section-sub">Así es como nuestro Escultor Facial LED está transformando vidas, una tez radiante a la vez.</p>
        <div className="led-stats-image">
          <SafeImg src="//www.luxcove.co/cdn/shop/files/US_VS_THEM_FACELIFT_SURGERY.png?v=1773769643" alt="Resultados del producto" sizes="min(1100px, calc(100vw - 32px))" style={{ width: '100%', aspectRatio: '4/3', minHeight: 180, objectFit: 'cover', borderRadius: 12 }} />
        </div>
        <StatsCircles />
      </div>
    </div>
  );
}
