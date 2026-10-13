import { Link, useNavigate } from "react-router-dom";
import SafeImg from "../SafeImg.jsx";
import { moneyARS, discountPct } from "../../utils/pricing.js";
import { productHref } from "../../landings/catalog.js";

/* Stagger de entrada para las primeras 8 cards; el resto está bajo el pliegue. */
const STAGGER_MS = 70;
const STAGGER_MAX = 7;

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();

  // Defensa en profundidad: `buildCatalog` ya filtra precio > 0, pero si algo
  // se cuela mejor que la card no exista a que muestre "$ 0" + "Ver oferta".
  if (!(Number(product?.price) > 0)) return null;

  const img = product.images?.[0] || product.imageUrl || "";
  const pct = discountPct(product.price, product.compareAtPrice);
  const href = productHref(product);

  return (
    <article
      className="hc-card reveal"
      style={{ transitionDelay: `${Math.min(index, STAGGER_MAX) * STAGGER_MS}ms` }}
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
    </article>
  );
}
