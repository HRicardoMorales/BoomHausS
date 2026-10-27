import Reveal from "../motion/Reveal.jsx";
import { HOME_MEDIA } from "./homeMedia.js";

/*
 * Garantía. Los 30 días son la promesa que repiten todas las landings, así
 * que acá se dice una vez y para toda la tienda: el número grande, los tres
 * pasos en texto y una foto del paquete (`HOME_MEDIA.garantia`) si existe.
 */
const STEPS = [
  { t: "Lo recibís y lo usás", d: "En tu casa, con tu rutina, sin apuro." },
  { t: "¿No era lo que esperabas?", d: "Nos escribís por WhatsApp dentro de los 30 días." },
  { t: "Te devolvemos el dinero", d: "Coordinamos la devolución y listo." },
];

export default function HomeGuarantee({ waLink }) {
  const media = HOME_MEDIA.garantia;
  return (
    <section className={`hg${media ? " hg--photo" : ""}`} aria-labelledby="hg-title">
      <div className="hc-wrap hg-grid">
        <div className="hg-copy">
          <Reveal as="p" className="hg-num">30 días para probarlo</Reveal>
          <Reveal as="h2" index={1} className="hp-title" id="hg-title">
            Si no te convence, te devolvemos la plata.
          </Reveal>
          <ol className="hg-steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" index={i + 2} key={s.t} className="hg-step">
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </ol>
          {waLink && (
            <Reveal as="a" index={STEPS.length + 2} className="hg-cta" href={waLink} target="_blank" rel="noopener noreferrer">
              Consultar por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </Reveal>
          )}
        </div>
        {media && (
          <Reveal as="div" index={1} className="hg-media">
            <img src={media.src} width={media.width} height={media.height} alt={media.alt || ""} loading="lazy" decoding="async" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
