import { Link, useLocation } from "react-router-dom";
import { SITE_NAME } from "../seo/routeSeo.js";
import "./NotFound.css";

const SHORTCUTS = [
  { to: "/products", label: "Todo el catálogo" },
  { to: "/my-orders", label: "Seguir mi pedido" },
  { to: "/returns", label: "Cambios y devoluciones" },
];

/**
 * 404 real. Antes `<Route path="*">` redirigía a /public: una URL rota
 * (link viejo de un anuncio, typo) mostraba la home sin aviso y Google la
 * indexaba como duplicado. Ahora la URL se conserva, se marca noindex y se
 * ofrecen salidas concretas.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <main className="nf" aria-labelledby="nf-title">
      <title>{`Página no encontrada · ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex, nofollow" />

      <div className="nf__glow" aria-hidden="true" />

      <p className="nf__code" aria-hidden="true">
        4<span className="nf__zero">0</span>4
      </p>

      <div className="nf__body">
        <p className="nf__eyebrow">Error 404</p>
        <h1 id="nf-title" className="nf__title">
          Esta página <em>se tomó el día</em>
        </h1>
        <p className="nf__lead">
          El link que abriste no existe o cambió de lugar. Lo que buscabas
          seguramente sigue en la tienda.
        </p>
        <p className="nf__path">
          <span className="sr-only">Dirección solicitada: </span>
          <code>{pathname}</code>
        </p>

        <div className="nf__actions">
          <Link className="nf__btn nf__btn--primary" to="/products">
            Ver productos
          </Link>
          <Link className="nf__btn nf__btn--ghost" to="/">
            Volver al inicio
          </Link>
        </div>

        <nav className="nf__shortcuts" aria-label="Atajos">
          <ul>
            {SHORTCUTS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>
                  {label}
                  <span aria-hidden="true"> →</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
