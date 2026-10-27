// Un cupón de la lista, dibujado como un talón: código grande a la izquierda,
// condiciones al lado y el interruptor de "activo" en el troquel.
import { REASON_LABEL, couponStatus, describeDiscount, formatExpiry, usesLabel } from './couponForm.js';
import { moneyARS } from '../../../utils/pricing.js';

export default function CouponTicket({ coupon: c, busy, onToggle, onDelete, now }) {
  const { live, reasons } = couponStatus(c, now);
  const expiry = formatExpiry(c.expiresAt);
  const used = Number(c.usedCount) || 0;
  const progress = c.maxUses != null && c.maxUses > 0 ? Math.min(1, used / c.maxUses) : null;

  return (
    <li className={`ac-ticket${live ? ' ac-ticket--live' : ''}`} aria-busy={busy || undefined}>
      <div className="ac-stub">
        <span className="ac-code">{c.code}</span>
        <span className="ac-discount">{describeDiscount(c)}</span>
      </div>

      <div className="ac-body">
        <dl className="ac-terms">
          <div><dt>Mínimo</dt><dd>{c.minOrderAmount > 0 ? moneyARS(c.minOrderAmount) : 'Sin mínimo'}</dd></div>
          <div><dt>Vence</dt><dd>{expiry || 'Nunca'}</dd></div>
          <div className="ac-terms-uses">
            <dt>Usos</dt>
            <dd>
              {usesLabel(c)}
              {progress != null && (
                <span className="ac-meter" aria-hidden="true"><span style={{ '--p': progress }} /></span>
              )}
            </dd>
          </div>
        </dl>

        <p className="ac-status">
          {live
            ? <span className="ac-badge ac-badge--live">Funciona en el checkout</span>
            : reasons.map((r) => <span key={r} className={`ac-badge ac-badge--${r}`}>{REASON_LABEL[r]}</span>)}
        </p>
      </div>

      <div className="ac-actions">
        <label className="ac-switch">
          <input
            type="checkbox"
            role="switch"
            checked={Boolean(c.isActive)}
            onChange={() => onToggle(c)}
            disabled={busy}
            aria-label={`Cupón ${c.code} activado`}
          />
          <span className="ac-switch-track" aria-hidden="true" />
          <span className="ac-switch-text" aria-hidden="true">{c.isActive ? 'Activado' : 'Apagado'}</span>
        </label>
        <button type="button" className="ac-delete" onClick={() => onDelete(c)} disabled={busy}>
          Eliminar<span className="sr-only"> el cupón {c.code}</span>
        </button>
      </div>
    </li>
  );
}
