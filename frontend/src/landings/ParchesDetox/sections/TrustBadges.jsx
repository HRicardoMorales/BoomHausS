import SafeImg from '../../../components/SafeImg';
import { ICON_WIDTHS } from '../../../components/landing/imageSizes';

/* Sellos de confianza del hero */
export default function TrustBadges() {
  return (
    <div className="pdx-trust-badges">
      <div className="pdx-trust-item">
        <SafeImg src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} className="pdx-trust-icon" />
        <span>Garantía devolución<br />90 días</span>
      </div>
      <div className="pdx-trust-item">
        <SafeImg src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131541.485.png?v=1719749753" alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} className="pdx-trust-icon" />
        <span>Envío gratis<br />en todos los pedidos</span>
      </div>
      <div className="pdx-trust-item">
        <SafeImg src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} className="pdx-trust-icon" />
        <span>Garantía devolución<br />90 días</span>
      </div>
    </div>
  );
}
