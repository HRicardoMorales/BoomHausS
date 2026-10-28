import SafeImg from '../../../components/SafeImg';
import { THUMB_WIDTHS } from '../../../components/landing/imageSizes';
import { FEATURES } from '../data';

/* S6 — 4 beneficios con íconos + CTA */
export default function FeaturesGrid({ onBuy, soldOut }) {
  return (
    <div className="led-section led-section--white">
      <div className="led-container">
        <div className="led-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="led-feature-item">
              <SafeImg
                src={f.src}
                alt=""
                width={56}
                height={56}
                sizes="56px"
                widths={THUMB_WIDTHS}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  objectFit: 'contain'
                }}
              />
              <div className="led-feature-title">{f.title}</div>
              <div className="led-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
        <p className="led-feature-credibility">⭐ Elegido por estetas y cosmetólogas. Resultados de clínica, precio accesible.</p>
        <div className="led-cta-row">
          <button className="led-btn-cta-center" onClick={onBuy} disabled={soldOut}>
            {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}
