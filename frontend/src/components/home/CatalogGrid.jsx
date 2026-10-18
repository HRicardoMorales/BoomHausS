import ProductCard from "./ProductCard.jsx";
import SkeletonCard from "./SkeletonCard.jsx";
import StatePanel from "../ui/StatePanel.jsx";
import { ALL_CATEGORIES } from "./catalogCategories.js";

const SKELETON_COUNT = 8;
/* Columnas de la grilla en desktop: el stagger va por columna, no por índice,
   así las filas que entran al scrollear no esperan medio segundo. */
const STAGGER_COLS = 4;
const pillBtn = { padding: "10px 22px", borderRadius: 999 };

function FetchErrorState({ onRetry, waLink }) {
  return (
    <StatePanel
      tone="error"
      size="inline"
      as="h3"
      title="No pudimos cargar el catálogo"
      actions={
        <>
          <button type="button" className="btn btn-primary" style={pillBtn} onClick={onRetry}>
            Reintentar
          </button>
          {waLink && (
            <a className="btn btn-ghost" style={pillBtn} href={waLink} target="_blank" rel="noreferrer">
              Comprar por WhatsApp
            </a>
          )}
        </>
      }
    >
      <p>
        Es un problema de conexión de nuestro lado. Reintentá en unos segundos
        o escribinos por WhatsApp y te ayudamos a comprar directamente.
      </p>
    </StatePanel>
  );
}

function EmptyState({ filtered, onShowAll }) {
  return (
    <StatePanel
      size="inline"
      as="h3"
      icon={filtered ? "search" : "bag"}
      title={filtered ? "Nada en esta categoría (todavía)" : "Estamos reponiendo la tienda"}
      actions={
        filtered && (
          <button type="button" className="btn btn-ghost" style={pillBtn} onClick={onShowAll}>
            Ver todos los productos
          </button>
        )
      }
    >
      <p>
        {filtered
          ? "Probá con otra categoría o mirá el catálogo completo."
          : "Volvé pronto: estamos cargando novedades."}
      </p>
    </StatePanel>
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
