import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';
import { moneyARS } from '../../../utils/pricing.js';
import { GUARANTEE_DAYS } from '../data';
import { ImgPlaceholder } from './ui';

/* Barra fija (mobile). El botón no compra directo: lleva arriba, a los
   kits, para que el usuario elija antes de comprar. */
function scrollToBundles() {
  document.getElementById('amp-bundles')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function StickyBar({ visible, image, bundle }) {
  return (
    <div className={`amp-sticky-bar${visible ? ' amp-visible' : ''}`} aria-hidden={!visible} inert={!visible}>
      <div className="amp-sticky-thumb">
        {image?.src
          ? <SafeImg src={image.src} alt="" width={40} height={40} sizes="40px" widths={ICON_WIDTHS} />
          : <ImgPlaceholder label="" />
        }
      </div>
      <div className="amp-sticky-info">
        <div className="amp-sticky-name">{bundle.label}</div>
        <div className="amp-sticky-price"><strong>{moneyARS(bundle.price)}</strong> · Garantía {GUARANTEE_DAYS} días</div>
      </div>
      <button className="amp-cta-btn" onClick={scrollToBundles}>Elegir opción</button>
    </div>
  );
}
