import { GUARANTEE_DAYS } from '../data';
import { IconShield } from '../icons';

export default function Guarantee() {
  return (
    <div className="amp-sec amp-mist">
      <div className="amp-container">
        <div className="amp-guarantee-box">
          <IconShield className="amp-guarantee-icon" />
          <h3>Garantía de {GUARANTEE_DAYS} días</h3>
          <p>
            Probá Anti-Moho PRO en tus juntas más sucias. Si no quedás conforme con
            el resultado, contactanos dentro de los {GUARANTEE_DAYS} días. {/* EDITAR política real */}
          </p>
        </div>
      </div>
    </div>
  );
}
