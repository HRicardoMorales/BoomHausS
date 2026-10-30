import { TRUSTROW } from '../data';

/* Reemplaza "As Seen On" — sin menciones de prensa reales. */
export default function TrustRow() {
  return (
    <div className="amp-trustrow-section">
      <div className="amp-container">
        <span className="amp-trustrow-title">Comprá con confianza</span>
        <div className="amp-trustrow-grid">
          {TRUSTROW.map((t, i) => (
            <div key={i} className="amp-trustrow-item">
              <t.icon />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
