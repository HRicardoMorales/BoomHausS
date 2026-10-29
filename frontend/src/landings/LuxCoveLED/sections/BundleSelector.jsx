import SafeImg from '../../../components/SafeImg';
import { THUMB_WIDTHS } from '../../../components/landing/imageSizes';
import { moneyARS } from '../../../utils/pricing.js';

function BundleThumb({ img, alt, fallback, gift = false, ebook = false }) {
  return (
    <div className={`led-bundle-thumb${ebook ? ' led-bundle-thumb--ebook' : ''}`}>
      {img ? <SafeImg src={img} alt={alt} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} /> : <span>{fallback}</span>}
      {gift && <span className="led-bundle-sticker">GRATIS</span>}
    </div>
  );
}

/* Selector de pack (radiogroup nativo). Cada pack muestra el producto y sus
   dos regalos; la imagen del regalo cambia según la campaña (?regalo=). */
export default function BundleSelector({ bundles, selected, onSelect, productImg, productAlt, giftImg, ebookImg }) {
  return (
    <div className="led-bundles" role="radiogroup" aria-label="Elegí tu pack">
      {bundles.map((b, i) => (
        <label key={b.id} className={`led-bundle-opt${selected === i ? ' selected' : ''}`}>
          <input type="radio" name="led-bundle" checked={selected === i} onChange={() => onSelect(i)} />
          <div className="led-bundle-body">
            <div className="led-bundle-top">
              <div className="led-bundle-left">
                <div className="led-bundle-label-row">
                  <span className="led-bundle-label">{b.label}</span>
                  {b.badge && <span className="led-bundle-badge">{b.badge}</span>}
                </div>
                <span className="led-bundle-perks">{b.perks}</span>
              </div>
              <div className="led-bundle-price-col">
                <span className="led-bundle-price">{moneyARS(b.bundlePrice)}</span>
                <span className="led-bundle-compare">{moneyARS(b.comparePrice)}</span>
              </div>
            </div>

            {b.extras.length > 0 && (
              <div className="led-bundle-extras-wrap">
                <div className="led-bundle-thumbs">
                  <div className="led-bundle-item">
                    <BundleThumb img={productImg} alt={productAlt} fallback="💡" />
                    <span className="led-bundle-item-name">{b.productThumbName}</span>
                  </div>
                  <span className="led-bundle-plus">+</span>
                  <div className="led-bundle-item">
                    <BundleThumb img={giftImg} alt={b.extras[0].label} fallback="🎁" gift />
                    <span className="led-bundle-item-name">{b.extras[0].label}</span>
                  </div>
                  <span className="led-bundle-plus">+</span>
                  <div className="led-bundle-item">
                    <BundleThumb img={ebookImg} alt={b.extras[1].label} fallback="📖" gift ebook />
                    <span className="led-bundle-item-name">{b.extras[1].label}</span>
                  </div>
                </div>
                <div className="led-bundle-shipping">🚚 Envío gratis a todo el país</div>
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
