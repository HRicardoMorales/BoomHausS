import { Link, useNavigate } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import SafeImg from "../SafeImg.jsx";
import { moneyARS, discountPct } from "../../utils/pricing.js";
import { productHref } from "../../landings/catalog.js";

import { REVEAL_VIEWPORT, revealVariants } from "../motion/motionPresets.js";

const MotionArticle = m.article;

/* Hover: la card se levanta con un resorte (no una curva fija), así si el
   mouse entra y sale rápido la animación se interrumpe sin saltos. */
const HOVER = { y: -6, transition: { type: "spring", stiffness: 380, damping: 26 } };
const TAP = { scale: 0.985 };

/**
 * `index` escalona la entrada (la grilla pasa la columna, así cada fila entra
 * en diagonal). `reveal={false}` en el carrusel: ahí las cards se ven al
 * deslizar y un fundido por slide se sentiría lento.
 */
export default function ProductCard({ product, index = 0, reveal = true }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  // Defensa en profundidad: `buildCatalog` ya filtra precio > 0, pero si algo
  // se cuela mejor que la card no exista a que muestre "$ 0" + "Ver oferta".
  if (!(Number(product?.price) > 0)) return null;

  const img = product.images?.[0] || product.imageUrl || "";
  const pct = discountPct(product.price, product.compareAtPrice);
  const href = productHref(product);

  return (
    <MotionArticle
      className="hc-card"
      initial={reveal && !reduce ? "hidden" : false}
      whileInView="shown"
      viewport={REVEAL_VIEWPORT}
      variants={revealVariants}
      custom={index}
      data-reveal=""
      whileHover={HOVER}
      whileTap={TAP}
      onClick={() => navigate(href)}
    >
      <div className="hc-card-img">
        <SafeImg
          src={img}
          name={product.name}
          alt={product.name}
          width={480}
          height={480}
          sizes="(min-width: 1024px) 300px, (max-width: 500px) 50vw, 33vw"
          widths={[240, 360, 480, 720]}
        />
        {pct > 0 && <span className="hc-badge-off">-{pct}%</span>}
      </div>
      <div className="hc-card-body">
        <div className="hc-card-name">{product.name}</div>
        <div className="hc-card-prices">
          {product.compareAtPrice > product.price && (
            <span className="hc-price-was">{moneyARS(product.compareAtPrice)}</span>
          )}
          <span className="hc-price-now">{moneyARS(product.price)}</span>
          {pct > 0 && <span className="hc-price-pct">-{pct}%</span>}
        </div>
        <Link
          className="btn btn-primary hc-card-cta"
          to={href}
          onClick={(e) => e.stopPropagation()}
        >
          Ver oferta →
        </Link>
      </div>
    </MotionArticle>
  );
}
