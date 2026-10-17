import ProductCard from "./ProductCard.jsx";
import SkeletonCard from "./SkeletonCard.jsx";
import { ALL_CATEGORIES } from "./catalogCategories.js";

const SKELETON_COUNT = 8;
/* Columnas de la grilla en desktop: el stagger va por columna, no por índice,
   así las filas que entran al scrollear no esperan medio segundo. */
const STAGGER_COLS = 4;
const pillBtn = { padding: "10px 22px", borderRadius: 999 };

function FetchErrorState({ onRetry, waLink }) {
  return (
    <div className="hc-empty">
      <div className="hc-empty-ico" aria-hidden="true">📡</div>
      <h3 className="hc-empty-title">Estamos teniendo un problema técnico</h3>
      <p className="hc-empty-sub" style={{ marginBottom: 18 }}>
        No pudimos cargar el catálogo. Reintentá en unos segundos —
        o hablanos por WhatsApp y te ayudamos a comprar directamente.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" style={pillBtn} onClick={onRetry}>
          Reintentar
        </button>
        {waLink && (
          <a className="btn btn-ghost" style={pillBtn} href={waLink} target="_blank" rel="noreferrer">
            💬 Comprar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filtered, onShowAll }) {
  return (
    <div className="hc-empty">
      <div className="hc-empty-ico" aria-hidden="true">🛍️</div>
      <h3 className="hc-empty-title">
        {filtered ? "No hay productos en esta categoría" : "Sin productos disponibles"}
      </h3>
      <p className="hc-empty-sub">
        {filtered ? (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ display: "inline", padding: "4px 12px", fontSize: ".82rem" }}
            onClick={onShowAll}
          >
            Ver todos
          </button>
        ) : (
          "Volvé pronto — estamos cargando novedades."
        )}
      </p>
    </div>
  );
}

/** Grilla del catálogo con sus estados: cargando, error, vacío y lista. */
export default function CatalogGrid({ products, loading, fetchError, activeCat, onRetry, onShowAll, waLink }) {
  let content;
  if (loading) {
    content = Array.from({ length: SKELETON_COUNT }, (_, i) => <SkeletonCard key={i} />);
  } else if (fetchError) {
    content = <FetchErrorState onRetry={onRetry} waLink={waLink} />;
  } else if (products.length === 0) {
    content = <EmptyState filtered={activeCat !== ALL_CATEGORIES} onShowAll={onShowAll} />;
  } else {
    content = products.map((p, i) => <ProductCard key={p._id} product={p} index={i % STAGGER_COLS} />);
  }
  // `key` por categoría: al filtrar, la grilla se vuelve a montar y las cards
  // entran de nuevo en cascada en vez de reacomodarse de golpe.
  return (
    <div className="hc-grid" key={activeCat} aria-busy={loading || undefined}>
      {content}
    </div>
  );
}
