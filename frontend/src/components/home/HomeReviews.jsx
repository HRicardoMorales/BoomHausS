import { Link } from "react-router-dom";
import { collectReviews } from "../../landings/homeProof.js";
import { LANDING_CONFIGS } from "../../landings/index.js";
import { BEAUTY_SLUGS } from "./beauty.js";
import Reveal from "../motion/Reveal.jsx";
import "./home-proof.css";

/*
 * Opiniones: las mismas que publica cada landing, intercaladas por producto y
 * con link al producto del que salen (nada inventado para la home).
 * Mobile: carrusel con scroll-snap nativo (sin JS). Desktop: masonry con
 * CSS columns, así las tarjetas largas no dejan huecos.
 */
/* Belleza primero (la identidad de la home); si no alcanzan, todas. */
const BEAUTY_CONFIGS = Object.fromEntries(
  Object.entries(LANDING_CONFIGS).filter(([slug]) => BEAUTY_SLUGS.includes(slug))
);
const beautyReviews = collectReviews(BEAUTY_CONFIGS, { max: 6 });
const REVIEWS = beautyReviews.length >= 3 ? beautyReviews : collectReviews(undefined, { max: 6 });

function Stars({ value }) {
  return (
    <span className="hp-stars" role="img" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className={i < value ? "is-on" : ""}>
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function HomeReviews({ reviews = REVIEWS }) {
  if (!reviews.length) return null;
  const products = new Set(reviews.map((r) => r.product)).size;

  return (
    <section className="hp-reviews" aria-labelledby="hp-reviews-title">
      <div className="hp-inner">
        <Reveal as="header" className="hp-head">
          <h2 className="hp-title" id="hp-reviews-title">
            Lo que cuentan quienes ya lo usan
          </h2>
          <p className="hp-lede">
            Opiniones de {products} productos, tal como aparecen en su página. Tocá el nombre para verlo.
          </p>
        </Reveal>

        <ul className="hp-review-list" aria-label="Opiniones de clientes">
          {reviews.map((r) => (
            <li key={r.id} className="hp-review">
              <Stars value={r.rating} />
              {r.title && <p className="hp-review-title">{r.title}</p>}
              <blockquote className="hp-review-text">
                <p>{r.text}</p>
              </blockquote>
              <footer className="hp-review-foot">
                <span className="hp-review-who">
                  <span className="hp-review-name">{r.name}</span>
                  <Link className="hp-review-product" to={r.href}>
                    sobre {r.product}
                  </Link>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
