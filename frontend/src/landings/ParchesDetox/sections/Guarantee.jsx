import SafeImg from '../../../components/SafeImg';

/* S12 — Garantía con CTA */
export default function Guarantee({ onBuy, soldOut }) {
  return (
    <div className="pdx-section pdx-section--white">
      <div className="pdx-container">
        <div className="pdx-guarantee">
          <div className="pdx-guarantee-icon">
            <SafeImg
              src="https://img.icons8.com/ios_filled/1200/guarantee.jpg"
              alt="Garantía 90 días"
              width={160}
              height={160}
              style={{ width: 160, height: 160, objectFit: 'contain' }}
            />
          </div>
          <h2 className="pdx-guarantee-title">Cero riesgo. Cero excusas.</h2>
          <p className="pdx-guarantee-text">
            Estamos seguros de que vas a ver el parche oscuro en tu mano la primera mañana. Pero si por alguna razón no notás ningún resultado, devolvelo en hasta 90 días y te reembolsamos el 100% del importe. Sin preguntas, sin vueltas. Tu descanso te espera — sin riesgo.
          </p>
          <button className="pdx-btn-cta-center" onClick={onBuy} disabled={soldOut}>
            {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
          </button>
        </div>
      </div>
    </div>
  );
}
