import { Link } from "react-router-dom";
import SafeImg from "../SafeImg.jsx";
import { moneyARS } from "../../utils/pricing.js";
import { HOME_MEDIA } from "./homeMedia.js";

/*
 * Hero de la home: qué es la tienda en una línea, una acción y una foto grande.
 * Con la foto editorial (`HOME_MEDIA.hero`) la imagen ocupa media pantalla en
 * desktop y el ancho completo en mobile; sin ella, el producto estrella sobre
 * un campo rosa con su nombre y precio. Animaciones en CSS (home-hero.css): la
 * home está en el chunk inicial y el parallax usa scroll-driven animations,
 * sin JS, con `prefers-reduced-motion` respetado.
 */
const FACTS = ["Envío gratis a todo el país", "Pagás con Mercado Pago", "30 días para probarlo"];

export default function HomeHero({ product, fromPrice, loading, onExplore, onShopAll }) {
  const media = HOME_MEDIA.hero;
  const productImg = product?.images?.[0] || product?.imageUrl || "";

  return (
    <section className="hh" aria-labelledby="hh-title">
      <div className="hh-inner">
        <div className="hh-copy">
          <h1 className="hh-title" id="hh-title">
            Tu rutina de cabina, en casa.
          </h1>
          <p className="hh-lede">
            Depiladora IPL, luz LED y masajeadores faciales para usar diez minutos por día.
            {fromPrice > 0 && <> Desde <strong>{moneyARS(fromPrice)}</strong>.</>}
          </p>

          <div className="hh-actions">
            <button type="button" className="hh-cta" onClick={onExplore}>
              Ver tratamientos
            </button>
            <button type="button" className="hh-link" onClick={onShopAll}>
              Toda la tienda
            </button>
          </div>

          <ul className="hh-facts">
            {FACTS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <figure className={`hh-media${media ? " hh-media--photo" : ""}`}>
          <div className="hh-media-frame">
            {media ? (
              <img
                className="hh-img"
                src={media.src}
                width={media.width}
                height={media.height}
                alt={media.alt}
                fetchPriority="high"
                decoding="async"
              />
            ) : loading ? (
              <div className="hh-img is-skeleton" />
            ) : (
              <SafeImg
                className="hh-img hh-img--product"
                src={productImg}
                name={product?.name}
                alt={product?.name || ""}
                width={720}
                height={900}
                priority
                sizes="(min-width: 900px) 46vw, 100vw"
                widths={[360, 480, 720, 960]}
              />
            )}
          </div>
          {!media && product && (
            <figcaption className="hh-caption">
              <Link to={product.href}>{product.name}</Link>
              <span>{moneyARS(product.price)}</span>
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
