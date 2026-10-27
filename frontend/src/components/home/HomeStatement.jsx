import Reveal from "../motion/Reveal.jsx";
import { HOME_MEDIA } from "./homeMedia.js";

/*
 * Franja de pausa entre la vidriera y la prueba social: una foto de piel a
 * todo el ancho (`HOME_MEDIA.textura`) con una frase. La foto se acerca
 * despacio mientras se scrollea (CSS scroll-driven). Sin foto, un campo rosa
 * con la misma frase.
 */
export default function HomeStatement() {
  const media = HOME_MEDIA.textura;
  return (
    <section
      className={`hs${media ? " hs--photo" : ""}`}
      aria-labelledby="hs-title"
    >
      {media && (
        <div className="hs-media" aria-hidden="true">
          <img src={media.src} width={media.width} height={media.height} alt="" loading="lazy" decoding="async" />
        </div>
      )}
      <div className="hs-inner hc-wrap">
        <Reveal as="h2" className="hs-title" id="hs-title">
          Diez minutos por día, en tu casa.
        </Reveal>
        <Reveal as="p" index={1} className="hs-text">
          Sin turnos ni traslados, al ritmo de tu semana. Los cambios llegan con la constancia,
          por eso tenés 30 días para probarlo tranquila.
        </Reveal>
      </div>
    </section>
  );
}
