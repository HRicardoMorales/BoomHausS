import SafeImg from '../../../components/SafeImg';
import { FEATURE_SIZES } from '../../../components/landing/imageSizes';

/* S6–S7B — Bloques imagen + texto */
export default function FeatureBlocks() {
  return (
    <>
      <div className="pdx-feat-section" style={{ background: '#fff' }}>
        <div className="pdx-feat-inner">
          <div className="pdx-feat-img">
            <SafeImg
              src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/KINOKI001.webp?v=1728712902"
              alt="Problemas que resuelven los Parches Detox"
              width={600}
              height={600}
              sizes={FEATURE_SIZES}
              style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
            />
          </div>
          <div className="pdx-feat-text">
            <div className="pdx-feat-kicker">⚠️ ¿TE IDENTIFICÁS CON ESTO?</div>
            <h2 className="pdx-feat-title">Tu cuerpo te está mandando señales que no podés ignorar</h2>
            <p className="pdx-feat-desc">¿<strong>Dolor de espalda</strong>, kilos que no bajan, <strong>estrés constante</strong> o ansiedad? No son problemas separados — son señales de <strong>acumulación de toxinas</strong> que tu cuerpo no puede eliminar solo. Los Parches Detox lo hacen por vos, <strong>noche a noche</strong>, sin cambiar nada de tu rutina.</p>
          </div>
        </div>
      </div>

      {/* ══ S7 — STORY BLOCK 2: BENEFICIOS ══ */}
      <div className="pdx-feat-section" style={{ background: 'var(--pdx-section-green)' }}>
        <div className="pdx-feat-inner pdx-feat-reverse">
          <div className="pdx-feat-img">
            <SafeImg
              src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/PARCHE-BENEFICIOS_480x480_1_2abefb24-0283-4d39-9697-0ef9537237f2.webp?v=1727546498"
              alt="Beneficios de los Parches Detox"
              width={600}
              height={600}
              sizes={FEATURE_SIZES}
              style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
            />
          </div>
          <div className="pdx-feat-text">
            <div className="pdx-feat-kicker">✅ LA SOLUCIÓN</div>
            <h2 className="pdx-feat-title">5 beneficios que sentís desde la primera noche</h2>
            <p className="pdx-feat-desc">Los Parches Detox <strong>mejoran tu inmunidad</strong>, <strong>alivian el dolor y el estrés</strong>, mejoran la <strong>circulación sanguínea</strong> y eliminan las <strong>toxinas acumuladas</strong> en tu cuerpo — todo mientras dormís, sin que hagas absolutamente nada.</p>
          </div>
        </div>
      </div>

      {/* ══ S7B — STORY BLOCK 3: MÁS BENEFICIOS ══ */}
      <div className="pdx-feat-section" style={{ background: '#fff' }}>
        <div className="pdx-feat-inner">
          <div className="pdx-feat-img">
            <SafeImg
              src="https://cdn.shopify.com/s/files/1/0778/4303/8517/files/508979000853398631-bf837f33-9e47-4290-8463-4662db21bf9f.gif"
              alt="Transformación nocturna con Parches Detox"
              width={600}
              height={600}
              sizes={FEATURE_SIZES}
              style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' }}
            />
          </div>
          <div className="pdx-feat-text">
            <div className="pdx-feat-kicker">🌿 LO QUE PASA MIENTRAS DORMÍS</div>
            <h2 className="pdx-feat-title">Despertás distinto. Ligero. Con energía real.</h2>
            <p className="pdx-feat-desc">La <strong>cúrcuma, jengibre y hojas de moxa</strong> activan la termogénesis plantar — el calor natural del pie moviliza lo que se acumuló durante el día. El parche lo absorbe todo, vos solo descansás.</p>
            <p className="pdx-feat-desc">Resultado: <strong>menos hinchazón</strong>, <strong>mejor circulación</strong>, noches más reparadoras y una mañana que se siente diferente desde el primer uso.</p>
          </div>
        </div>
      </div>
    </>
  );
}
