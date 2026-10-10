import { useId } from 'react';
import './LandingFooter.css';

const TRUST_ITEMS = [
  { icon: '🔒', label: 'Pago seguro' },
  { icon: '🚚', label: 'Envío gratis' },
  { icon: '🛡️', label: 'Garantía total' },
  { icon: '💳', label: '3 cuotas sin interés' },
];

const PAYMENT_METHODS = ['MercadoPago', 'Visa', 'Mastercard', 'Amex'];

/**
 * Footer de las landings de producto.
 *
 * @param {object}  props
 * @param {'night'|'wine'} [props.variant='night'] Paleta del footer.
 * @param {string}  [props.tagline]        Bajada bajo el logo.
 * @param {string}  [props.whatsappNumber] Si viene, muestra el link de consultas.
 * @param {string}  [props.waveFrom]       Color de la sección anterior: dibuja
 *                                         una ola de transición (solo `night`).
 */
export default function LandingFooter({
  variant = 'night',
  tagline = 'Tecnología que mejora tu vida diaria',
  whatsappNumber,
  waveFrom,
}) {
  const payLabelId = useId();
  const showWave = Boolean(waveFrom) && variant === 'night';

  return (
    <footer className={`lp-footer lp-footer--${variant}`}>
      {showWave && (
        <div className="lp-footer-wave" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 52" preserveAspectRatio="none">
            <rect width="150" height="52" fill={waveFrom} />
            <path
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v52h-352z"
              style={{ fill: 'var(--lf-bg)' }}
            />
          </svg>
        </div>
      )}

      <div className="lp-footer-body">
        <div className="lp-footer-brand">
          <div className="lp-footer-logo">Amelor</div>
          <p className="lp-footer-tagline">{tagline}</p>
        </div>

        <ul className="lp-footer-trust">
          {TRUST_ITEMS.map(({ icon, label }) => (
            <li key={label} className="lp-footer-ti">
              <span aria-hidden="true">{icon}</span>
              {label}
            </li>
          ))}
        </ul>

        <div className="lp-footer-pay">
          <span className="lp-footer-pay-label" id={payLabelId}>Medios de pago aceptados</span>
          <ul className="lp-footer-pay-row" aria-labelledby={payLabelId}>
            {PAYMENT_METHODS.map((method) => (
              <li key={method} className="lp-pay-chip">{method}</li>
            ))}
          </ul>
        </div>

        <div className="lp-footer-bottom">
          <small>© {new Date().getFullYear()} Amelor · Todos los derechos reservados</small>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              className="lp-footer-wa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">💬</span> Consultas por WhatsApp
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
