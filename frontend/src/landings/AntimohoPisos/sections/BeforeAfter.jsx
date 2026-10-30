import { ImgPlaceholder } from './ui';

const ZONES = ['Piso de cocina', 'Juntas de baño', 'Entrada de casa'];

export default function BeforeAfter() {
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <span className="amp-eyebrow">Antes / Después</span>
        <h2 className="amp-sec-h2">Mirá cómo devuelve la vida a tus juntas</h2>
        <p className="amp-sec-sub">Años de suciedad acumulada, eliminados — sin rejuntar ni reemplazar nada.</p>
        <div className="amp-ba-grid">
          {ZONES.map((label, i) => (
            <div key={i} className="amp-ba-card">
              <span className="amp-ba-tag before">Antes</span>
              <span className="amp-ba-tag after">Después</span>
              <ImgPlaceholder label={`Foto antes/después — ${label}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
