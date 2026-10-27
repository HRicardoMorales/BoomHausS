/*
 * Cómo es comprar en la tienda. Solo lo que el sitio realmente ofrece:
 * WhatsApp (botón global), "Mis pedidos", Mercado Pago y el envío que
 * promete el hero. Foto de rutina (`HOME_MEDIA.ritual`) a un lado; sin foto,
 * un campo de color con el nombre de la tienda.
 */
import Reveal from "../motion/Reveal.jsx";
import { HOME_MEDIA } from "./homeMedia.js";
import { STORE_NAME } from "../../config/brand.js";

const BENEFITS = [
  { t: "Te atiende una persona", d: "Por WhatsApp, antes y después de comprar. Te ayudamos a elegir y a usarlo." },
  { t: "Pagás con Mercado Pago", d: "Tarjeta, débito o dinero en cuenta, con la protección de siempre." },
  { t: "Envío gratis a todo el país", d: "Despachamos en el día los productos con stock." },
  { t: "Seguís tu pedido", d: "Desde “Mis pedidos”, sin mandar mails ni esperar respuestas." },
];

export default function HomeBenefits({ waLink }) {
  const media = HOME_MEDIA.ritual;
  return (
    <section className="hb" aria-labelledby="hb-title">
      <div className="hc-wrap hb-grid">
        <Reveal as="div" className={`hb-media${media ? "" : " hb-media--empty"}`}>
          {media ? (
            <img src={media.src} width={media.width} height={media.height} alt={media.alt || ""} loading="lazy" decoding="async" />
          ) : (
            <span className="hb-mark" aria-hidden="true">{STORE_NAME}</span>
          )}
        </Reveal>

        <div className="hb-copy">
          <Reveal as="h2" className="hp-title" id="hb-title">
            Comprar acá es simple
          </Reveal>
          <dl className="hb-list">
            {BENEFITS.map((b, i) => (
              <Reveal as="div" index={i + 1} key={b.t} className="hb-item">
                <dt>{b.t}</dt>
                <dd>{b.d}</dd>
              </Reveal>
            ))}
          </dl>
          {waLink && (
            <Reveal as="p" index={BENEFITS.length + 1} className="hb-cta">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                Escribinos por WhatsApp
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
