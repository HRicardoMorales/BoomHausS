import SafeImg from '../../../components/SafeImg';

/* S12 — Garantía + CTA */
export default function Guarantee({ onBuy, soldOut }) {
  return (
    <div className="ipl-section ipl-section--white">
      <div className="ipl-container">
        <div className="ipl-guarantee">
          <div className="ipl-guarantee-icon">
            <SafeImg
              src="https://http2.mlstatic.com/D_NQ_NP_2X_762827-MLB111243573748_052026-F.webp"
              alt="Garantía 90 días"
              width={160}
              height={160}
              style={{ width: 160, height: 160, objectFit: 'contain' }}
            />
          </div>
          <h2 className="ipl-guarantee-title">Probala sin riesgos</h2>
          <p className="ipl-guarantee-text">
            Estamos seguras de que vas a ver resultados reales. Pero si por alguna razón no quedás satisfecha/o,
            devolvela en hasta 90 días y te reembolsamos el 100% del importe. Sin preguntas, sin vueltas.
            Tu piel lisa te espera — sin riesgo.
          </p>
          <button className="ipl-btn-cta-center" onClick={onBuy} disabled={soldOut}>
            {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}
