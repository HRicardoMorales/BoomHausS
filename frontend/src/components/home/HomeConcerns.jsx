import { forwardRef } from "react";
import { Link } from "react-router-dom";
import SafeImg from "../SafeImg.jsx";
import Reveal from "../motion/Reveal.jsx";
import { moneyARS } from "../../utils/pricing.js";

/*
 * "Por lo que buscás": cuatro necesidades, cada una con su foto y el producto
 * que la resuelve. Mobile: tira deslizable con scroll-snap (sin JS). Desktop:
 * cuatro columnas escalonadas. Sin foto editorial, la del producto sobre el
 * campo rosa.
 */
const HomeConcerns = forwardRef(function HomeConcerns({ items }, ref) {
  if (!items?.length) return null;

  return (
    <section className="hk hc-block" aria-labelledby="hk-title" ref={ref}>
      <div className="hc-wrap">
        <Reveal as="header" className="hk-head">
          <h2 className="hk-title" id="hk-title">Por lo que buscás</h2>
          <p className="hk-lede">
            Un aparato para cada cosa, pensado para usar en casa sin turnos ni cabina.
          </p>
        </Reveal>
      </div>

      <ul className="hk-list">
        {items.map((c, i) => {
          const media = c.media;
          const productImg = c.product?.images?.[0] || "";
          const href = c.product?.href || `/lp/${c.slug}`;
          return (
            <Reveal as="li" index={i} key={c.id} className="hk-item">
              <Link to={href} className="hk-link">
                <span className={`hk-img${media ? "" : " hk-img--product"}`}>
                  {media ? (
                    <img
                      src={media.src}
                      width={media.width}
                      height={media.height}
                      alt={media.alt || ""}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <SafeImg
                      src={productImg}
                      name={c.title}
                      alt=""
                      width={480}
                      height={600}
                      sizes="(min-width: 900px) 25vw, 72vw"
                      widths={[240, 360, 480, 720]}
                    />
                  )}
                </span>
                <span className="hk-name">{c.title}</span>
                <span className="hk-text">{c.text}</span>
                <span className="hk-meta">
                  {c.product?.price > 0 ? `Desde ${moneyARS(c.product.price)}` : "Ver producto"}
                  <span className="hk-arrow" aria-hidden="true">→</span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
});

export default HomeConcerns;
