import SafeImg from "../SafeImg.jsx";
import { moneyARS, discountPct } from "../../utils/pricing.js";

/*
 * Hero de la home: promesa concreta (envío, pago, despacho) a la izquierda y
 * un "collage" de hasta 3 productos reales del catálogo a la derecha (abajo en
 * mobile). Las animaciones de entrada son CSS puro (la home está en el chunk
 * inicial: Framer Motion ahí sumaría ~35 KB gzip) y se apagan con
 * `prefers-reduced-motion` desde home.css.
 */
const PROMISES = [
  { k: "01", t: "Envío gratis", d: "a todo el país" },
  { k: "02", t: "Pagás con Mercado Pago", d: "pago protegido" },
  { k: "03", t: "Stock real", d: "despachamos en el día" },
];

const COLLAGE_SLOTS = 3;

export default function HomeHero({ storeName, maxDiscount, products = [], loading, onExplore }) {
  const picks = products.slice(0, COLLAGE_SLOTS);
  const showCollage = loading || picks.length > 0;

  return (
    <section className="hc-hero" aria-labelledby="hc-hero-title">
      <div className="hc-hero-grain" aria-hidden="true" />
      <div className="hc-hero-inner">
        <div className="hc-hero-copy">
          <p className="hc-hero-eyebrow">
            <span className="hc-hero-eyebrow-dot" aria-hidden="true" />
            {storeName} · selección curada
          </p>
          <h1 className="hc-hero-title" id="hc-hero-title">
            Lo que viste en tu feed,
            <em> en tu puerta</em>
            <span className="hc-hero-title-tail"> sin pagar envío.</span>
          </h1>

          <ol className="hc-hero-promises">
            {PROMISES.map((p) => (
              <li key={p.k}>
                <span className="hc-hero-promise-k" aria-hidden="true">{p.k}</span>
                <span>
                  <strong>{p.t}</strong> {p.d}
                </span>
              </li>
            ))}
          </ol>

          <div className="hc-hero-actions">
            <button type="button" className="hc-hero-cta" onClick={onExplore}>
              Ver el catálogo
              <span className="hc-hero-cta-arrow" aria-hidden="true">→</span>
            </button>
            {maxDiscount > 0 && (
              <span className="hc-hero-badge">
                Hasta <strong>-{maxDiscount}%</strong> esta semana
              </span>
            )}
          </div>
        </div>

        {showCollage && (
          <div className="hc-hero-collage" aria-hidden={loading || undefined}>
            {loading
              ? Array.from({ length: COLLAGE_SLOTS }, (_, i) => (
                  <div key={i} className={`hc-hero-tile hc-hero-tile--${i} is-skeleton`} />
                ))
              : picks.map((p, i) => {
                  const pct = discountPct(p.price, p.compareAtPrice);
                  return (
                    <figure key={p._id} className={`hc-hero-tile hc-hero-tile--${i}`}>
                      <SafeImg
                        src={p.images?.[0] || p.imageUrl || ""}
                        name={p.name}
                        alt={i === 0 ? p.name : ""}
                        width={600}
                        height={750}
                        priority={i === 0}
                        sizes="(min-width: 900px) 260px, 46vw"
                        widths={[240, 360, 480, 600]}
                      />
                      {i === 0 && (
                        <figcaption className="hc-hero-tag">
                          <span className="hc-hero-tag-name">{p.name}</span>
                          <span className="hc-hero-tag-price">
                            {moneyARS(p.price)}
                            {pct > 0 && <small> -{pct}%</small>}
                          </span>
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
          </div>
        )}
      </div>
    </section>
  );
}
