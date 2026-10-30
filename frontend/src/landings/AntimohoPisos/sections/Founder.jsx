import { BRAND_NAME } from '../data';
import { ImgPlaceholder } from './ui';

/* EDITAR: reemplazar por la historia real de la marca/fundador */
export default function Founder() {
  return (
    <div className="amp-founder-sec">
      <div className="amp-container amp-founder-grid">
        <ImgPlaceholder label="Foto del equipo / fundador de BoomHausS" />
        <div>
          <span className="amp-founder-eyebrow">Por qué existe {BRAND_NAME}</span>
          <h2 className="amp-founder-h2">Creamos Anti-Moho PRO para que dejes de pelear con las juntas.</h2>
          <p>
            Sabemos lo que es probar producto tras producto y terminar igual, de
            rodillas, con un cepillito que no rinde. Por eso armamos un kit que
            combina una fórmula pensada para juntas y pisos con un cepillo que te
            permite limpiar de pie.
          </p>
          <p>
            Queremos que puedas recuperar tus pisos sin gastar en un rejuntado ni
            pasarte la tarde entera arrodillado.
          </p>
        </div>
      </div>
    </div>
  );
}
