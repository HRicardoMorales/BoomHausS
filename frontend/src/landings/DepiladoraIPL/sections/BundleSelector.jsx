import SafeImg from '../../../components/SafeImg';
import { THUMB_WIDTHS } from '../../../components/landing/imageSizes';
import { moneyARS } from '../../../utils/pricing.js';
import { BUNDLE_PRODUCT_IMG } from '../data';

function BundleItem({ img, alt, name, gift = false, ebook = false }) {
  return (
    <div className="ipl-bundle-item">
      <div className={`ipl-bundle-thumb${ebook ? ' ipl-bundle-thumb--ebook' : ''}`}>
        <SafeImg src={img} alt={alt} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
        {gift && <span className="ipl-bundle-sticker">GRATIS</span>}
      </div>
      <span className="ipl-bundle-item-name">{name}</span>
    </div>
  );
}

/* Selector de pack (radiogroup nativo): producto + sus dos regalos. */
export default function BundleSelector({ bundles, selected, onSelect }) {
  return (
    <div className="ipl-bundles" role="radiogroup" aria-label="Elegí tu pack">
      {bundles.map((b, i) => (
        <label key={b.id} className={`ipl-bundle-opt${selected === i ? ' selected' : ''}`}>
          <input type="radio" name="ipl-bundle" checked={selected === i} onChange={() => onSelect(i)} />
          <div className="ipl-bundle-body">
            <div className="ipl-bundle-top">
              <div className="ipl-bundle-left">
                <div className="ipl-bundle-label-row">
                  <span className="ipl-bundle-label">{b.label}</span>
                  {b.badge && <span className="ipl-bundle-badge">{b.badge}</span>}
                </div>
                <span className="ipl-bundle-perks">{b.perks}</span>
              </div>
              <div className="ipl-bundle-price-col">
                <span className="ipl-bundle-price">{moneyARS(b.bundlePrice)}</span>
                <span className="ipl-bundle-compare">{moneyARS(b.comparePrice)}</span>
              </div>
            </div>

            {b.extras.length > 0 && (
              <div className="ipl-bundle-extras-wrap">
                <div className="ipl-bundle-thumbs">
                  <BundleItem img={BUNDLE_PRODUCT_IMG} alt={b.productThumbName} name={b.productThumbName} />
                  <span className="ipl-bundle-plus">+</span>
                  <BundleItem img={b.extras[0].img} alt={b.extras[0].label} name={b.extras[0].label} gift />
                  <span className="ipl-bundle-plus">+</span>
                  <BundleItem img={b.extras[1].img} alt={b.extras[1].label} name={b.extras[1].label} gift ebook />
                </div>
                <div className="ipl-bundle-shipping">🚚 Envío gratis a todo el país</div>
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
