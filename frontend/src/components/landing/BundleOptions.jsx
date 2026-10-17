import { useId } from "react";
import "./BundleOptions.css";

/**
 * Packs por cantidad de las plantillas de landing (`ShowcaseLanding`,
 * `WineLanding`). Cada tarjeta es un `<label>` con su radio nativo dentro de
 * un `radiogroup`: click en toda la tarjeta, flechas para moverse entre packs
 * (el navegador lo resuelve, sin `onKeyDown` a mano) y los agotados quedan
 * fuera del recorrido con `disabled`.
 *
 * Solo es presentación: el precio sale del config y el servidor lo vuelve a
 * validar al crear la orden.
 *
 * @param {object}   props
 * @param {Array}    props.bundles      packs `{ id, label, price, compareAt, badge, benefit, popular, soldOut }`
 * @param {*}        props.selectedId   id del pack elegido
 * @param {Function} props.onSelect     recibe el id del pack
 * @param {Function} props.formatPrice  número → texto con moneda
 * @param {string}   [props.title]      título visible; también nombra el grupo
 * @param {Function} [props.renderMedia] (pack) => nodo extra debajo de la fila (p. ej. miniaturas)
 */
export default function BundleOptions({
  bundles,
  selectedId,
  onSelect,
  formatPrice,
  title = "✨ Elegí Tu Kit ✨",
  renderMedia,
}) {
  const titleId = useId();
  if (!bundles?.length) return null;

  return (
    <>
      <div className="bnd2-section-title" id={titleId}>{title}</div>
      <div className="lp-bnd-group" role="radiogroup" aria-labelledby={titleId}>
        {bundles.map((b) => {
          const on = !b.soldOut && selectedId === b.id;
          return (
            <label
              key={b.id}
              className={`bnd2-card${on ? " bnd2-card--on" : ""}${b.popular ? " bnd2-card--pop" : ""}${b.soldOut ? " spf-card--sold" : ""}`}
            >
              {b.popular && !b.soldOut && <span className="bnd2-float-badge">⭐ MÁS POPULAR</span>}
              {/* El estado ya se lee en "Sin stock": la cinta es solo visual */}
              {b.soldOut && <span className="bnd2-float-badge spf-sold-badge" aria-hidden="true">AGOTADO</span>}
              <span className="bnd2-row">
                <input
                  type="radio"
                  name={titleId}
                  value={b.id}
                  className="bnd2-radio"
                  checked={on}
                  onChange={() => onSelect(b.id)}
                  disabled={b.soldOut}
                />
                <span className="bnd2-center">
                  <span className="bnd2-name">{b.label}</span>
                  {!b.soldOut && b.badge && (
                    <span className={`bnd2-badge${b.popular ? " bnd2-badge--pop" : ""}`}>{b.badge}</span>
                  )}
                </span>
                <span className="bnd2-prices">
                  {b.soldOut ? (
                    <span className="spf-soldout-label">Sin stock</span>
                  ) : (
                    <>
                      <span className="bnd2-was"><span className="sr-only">Antes </span>{formatPrice(b.compareAt)}</span>
                      <span className="bnd2-now"><span className="sr-only">, ahora </span>{formatPrice(b.price)}</span>
                    </>
                  )}
                </span>
              </span>
              {renderMedia?.(b)}
              {!b.soldOut && b.benefit && <span className="bnd2-benefit">{b.benefit}</span>}
            </label>
          );
        })}
      </div>
    </>
  );
}
