import { moneyARS } from '../../../utils/pricing.js';
import { ImgPlaceholder } from './ui';

/* Selector de kit. El estado vive en la landing porque lo usan el
   botón de compra y la barra fija. */
export default function BundleSelector({ bundles, selected, onSelect }) {
  return (
    <div className="amp-bundles" id="amp-bundles" role="radiogroup" aria-label="Elegí tu pack">
      {bundles.map((b, i) => (
        <label
          key={b.id}
          className={`amp-bundle-opt${selected === i ? ' selected' : ''}`}
        >
          <input type="radio" name="amp-bundle" checked={selected === i} onChange={() => onSelect(i)} />
          <div className="amp-bundle-thumb">
            <ImgPlaceholder label={`x${b.qty}`} />
          </div>
          <div className="amp-bundle-body">
            <div>
              <div className="amp-bundle-label-row">
                <span className="amp-bundle-label">{b.label}</span>
                {b.badge && <span className="amp-bundle-badge">{b.badge}</span>}
              </div>
              <span className="amp-bundle-off">{b.pctLabel}</span>
            </div>
            <div className="amp-bundle-price-col">
              <span className="amp-bundle-price">{moneyARS(b.price)}</span>
              <span className="amp-bundle-compare">{moneyARS(b.compareAt)}</span>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
