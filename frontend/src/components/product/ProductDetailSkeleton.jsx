import "./ProductDetailSkeleton.css";

/**
 * Esqueleto de la ficha mientras `useProduct` trae el producto.
 *
 * Copia las medidas del hero real (`.pd-hero-row`): imagen de 390/420/520 px
 * según el ancho y dos columnas desde 980 px. Así el contenido llega al mismo
 * lugar que ocupaba el esqueleto y no empuja nada. Además reserva un alto
 * mínimo de una pantalla para que el footer no se pinte arriba mientras carga
 * (era el CLS 1,3 que medía Lighthouse en `/products/:id`).
 */
export default function ProductDetailSkeleton() {
  return (
    <main className="pdsk" aria-busy="true">
      <div className="pdsk__row" aria-hidden="true">
        <div className="pdsk__media">
          <span className="pdsk__block pdsk__img" />
          <div className="pdsk__thumbs">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="pdsk__block pdsk__thumb" />
            ))}
          </div>
        </div>
        <div className="pdsk__info">
          <span className="pdsk__block pdsk__line pdsk__line--xs" />
          <span className="pdsk__block pdsk__title" />
          <span className="pdsk__block pdsk__line pdsk__line--md" />
          <span className="pdsk__block pdsk__price" />
          <span className="pdsk__block pdsk__option" />
          <span className="pdsk__block pdsk__option" />
          <span className="pdsk__block pdsk__cta" />
          <span className="pdsk__block pdsk__line" />
          <span className="pdsk__block pdsk__line pdsk__line--md" />
        </div>
      </div>
      <p className="sr-only" role="status">Cargando producto…</p>
    </main>
  );
}
