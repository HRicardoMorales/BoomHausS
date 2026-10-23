// Paquetes de la landing: nombre, precio y precio tachado editables por fila.
import { useId } from 'react';
import { money, pct } from './productForm.js';

function BundleRow({ bundle: b, index, onChange }) {
  const base = useId();
  const dp = pct(b.price, b.compareAt);
  const offId = `${base}-off`;
  return (
    <div className={`ap-bundle-row${b.popular ? ' ap-bundle-row--popular' : ''}`} role="group" aria-label={`Paquete ${index + 1}: ${b.qty} unidades`}>
      <div>
        <div className="ap-bundle-tags">
          {b.popular && <span className="ap-tag ap-tag--popular">★ POPULAR</span>}
          {b.badge && <span className="ap-tag ap-tag--badge">{b.badge}</span>}
        </div>
        <label className="ap-bundle-lbl" htmlFor={`${base}-label`}>Nombre del paquete</label>
        <input
          id={`${base}-label`}
          className="ap-bundle-inp ap-bundle-inp--name"
          value={b.label}
          onChange={e => onChange(index, 'label', e.target.value)}
          placeholder={`Nombre del paquete ${index + 1}`}
        />
        <div className="ap-bundle-meta">{b.qty} und{b.benefit ? ` · ${b.benefit}` : ''}</div>
      </div>
      <div>
        <label className="ap-bundle-lbl" htmlFor={`${base}-price`}>Precio ARS</label>
        <input
          id={`${base}-price`}
          className="ap-bundle-inp ap-bundle-inp--price"
          inputMode="numeric"
          value={b.price}
          aria-describedby={dp > 0 ? offId : undefined}
          onChange={e => onChange(index, 'price', e.target.value)}
        />
        {dp > 0 && <span id={offId} className="ap-off">-{dp}% off</span>}
      </div>
      <div>
        <label className="ap-bundle-lbl" htmlFor={`${base}-compare`}>Tachado ARS</label>
        <input
          id={`${base}-compare`}
          className="ap-bundle-inp ap-bundle-inp--compare"
          inputMode="numeric"
          value={b.compareAt}
          onChange={e => onChange(index, 'compareAt', e.target.value)}
        />
      </div>
    </div>
  );
}

export default function BundlesEditor({ bundles, onChange }) {
  const titleId = useId();
  if (!bundles.length) return null;
  return (
    <section className="ap-section" aria-labelledby={titleId}>
      <h3 id={titleId} className="ap-section-head">
        📦 Paquetes / Bundles
        <span className="ap-aside">Nombre, precio y tachado editables</span>
      </h3>
      <div className="ap-bundles">
        <div className="ap-bundle-cols" aria-hidden="true">
          <span>Nombre del paquete ✏️</span><span>Precio ARS</span><span>Tachado ARS</span>
        </div>
        {bundles.map((b, i) => <BundleRow key={i} bundle={b} index={i} onChange={onChange} />)}
        <ul className="ap-summary" aria-label="Resumen de precios">
          <li className="ap-summary-lbl">Resumen:</li>
          {bundles.map((b, i) => {
            const off = pct(b.price, b.compareAt);
            return (
              <li key={i}>
                <span className="ap-qty">{b.qty}x</span> {money(b.price)}
                {off > 0 && <span className="ap-off">-{off}%</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
