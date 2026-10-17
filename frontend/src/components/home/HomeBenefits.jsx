/*
 * Beneficios de comprar en la tienda. Solo lo que el sitio realmente ofrece:
 * WhatsApp (botón global), "Mis pedidos", Mercado Pago y el despacho que ya
 * promete el hero. Íconos SVG inline de trazo, sin librería.
 */
import Reveal from "../motion/Reveal.jsx";

const ICONS = {
  chat: (
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5zM8 8.5h8M8 11.5h5" />
  ),
  track: (
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 7 19zm10 0a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 17 19z" />
  ),
  shield: (
    <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.3-7.5 9.5-4.4-1.2-7.5-5.1-7.5-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6" />
  ),
  box: (
    <path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2zM4 7.2l8 4.3 8-4.3M12 11.5V21" />
  ),
};

const BENEFITS = [
  { icon: "chat", t: "Te atiende una persona", d: "Por WhatsApp, antes y después de comprar." },
  { icon: "track", t: "Seguís tu pedido", d: "Desde “Mis pedidos”, sin mandar mails." },
  { icon: "shield", t: "Pago protegido", d: "Con Mercado Pago, como en cualquier compra online." },
  { icon: "box", t: "Envío gratis al país", d: "Despachamos en el día, con stock real." },
];

export default function HomeBenefits({ waLink }) {
  return (
    <section className="hp-benefits" aria-labelledby="hp-benefits-title">
      <div className="hp-inner">
        <Reveal as="header" className="hp-head hp-head--center">
          <p className="hp-eyebrow hp-eyebrow--ink">Por qué comprar acá</p>
          <h2 className="hp-title hp-title--ink" id="hp-benefits-title">
            Comprar tiene que ser <em>simple.</em>
          </h2>
        </Reveal>

        <ol className="hp-benefit-list">
          {BENEFITS.map((b, i) => (
            <Reveal as="li" index={i} key={b.icon} className="hp-benefit">
              <span className="hp-benefit-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <svg className="hp-benefit-icon" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[b.icon]}
              </svg>
              <h3 className="hp-benefit-title">{b.t}</h3>
              <p className="hp-benefit-text">{b.d}</p>
            </Reveal>
          ))}
        </ol>

        {waLink && (
          <Reveal as="p" className="hp-benefits-cta">
            ¿Dudas con algún producto?{" "}
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              Escribinos por WhatsApp
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}
