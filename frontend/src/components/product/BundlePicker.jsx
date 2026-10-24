import { useId } from "react";
import { moneyARSTight } from "../../utils/pricing.js";
import PaymentIcons from "./PaymentIcons";
import HeroAccordions from "./HeroAccordions";

/**
 * Selector de packs por cantidad (`bundles` del config de la landing) con su
 * CTA, medios de pago, urgencia y acordeones. Solo es presentación: el precio
 * que se muestra sale del config y el servidor lo vuelve a validar al crear
 * la orden. Un pack `soldOut` queda visible pero no seleccionable.
 */
export default function BundlePicker({ bundles, selectedIdx, onSelect, onBuyNow, accordions }) {
  const titleId = useId();
  const groupName = `pd-bundle-${titleId}`;
  if (!bundles) return null;
  return (
    <div className="bnd2-wrap">
      {/* Título de sección: también nombra el grupo de radios */}
      <div className="bnd2-section-title" id={titleId}>✨ Ofertas por Tiempo Limitado ✨</div>

      {/* Cada pack es un <label> con su radio nativo: click en toda la tarjeta,
          flechas para moverse entre packs y los agotados quedan fuera del
          recorrido (radio `disabled`), sin manejar teclado a mano. */}
      <div className="bnd2-options" role="radiogroup" aria-labelledby={titleId}>
        {bundles.map((opt, i) => {
          const on = selectedIdx === i && !opt.soldOut;
          return (
            <label
              key={i}
              className={`bnd2-card${on ? " bnd2-card--on" : ""}${opt.popular ? " bnd2-card--pop" : ""}${opt.soldOut ? " bnd2-card--sold-out" : ""}`}
            >
              {opt.soldOut && (
                <span className="bnd2-sold-out-overlay" aria-hidden="true">
                  <span className="bnd2-sold-out-text">AGOTADO</span>
                </span>
              )}
              <span className="bnd2-row">
                <input
                  type="radio"
                  name={groupName}
                  value={i}
                  className="bnd2-radio"
                  checked={on}
                  onChange={() => onSelect(i)}
                  disabled={opt.soldOut}
                />
                <span className="bnd2-center">
                  <span className="bnd2-name">{opt.label}</span>
                  {opt.soldOut && <span className="sr-only">(agotado)</span>}
                  {opt.badge && !opt.popular && (
                    <span className="bnd2-badge">{opt.badge}</span>
                  )}
                </span>
                {!opt.soldOut && (
                  <span className="bnd2-prices">
                    {opt.compareAt > 0 && (
                      <span className="bnd2-was">
                        <span className="sr-only">Antes </span>{moneyARSTight(opt.compareAt)}
                      </span>
                    )}
                    <span className="bnd2-now">
                      {opt.compareAt > 0 && <span className="sr-only">, ahora </span>}{moneyARSTight(opt.price)}
                    </span>
                  </span>
                )}
              </span>
              {opt.benefit && !opt.soldOut && (
                <span className="bnd2-benefit">{opt.benefit}</span>
              )}
              {/* Va al final para que el lector de pantalla diga primero el pack */}
              {opt.popular && (
                <span className="bnd2-float-badge">{opt.badge || "Más Elegido"}</span>
              )}
            </label>
          );
        })}
      </div>

      {/* CTA */}
      <button
        className="bnd2-cta"
        type="button"
        onClick={onBuyNow}
      >
        AGREGAR AL CARRITO
      </button>

      {/* Pago seguro + logos */}
      <div className="bnd2-payments">
        <p className="bnd2-payments-title">Pago Seguro En Línea</p>
        <div className="bnd2-payments-icons">
          <PaymentIcons />
        </div>
      </div>

      {/* Urgencia */}
      <div className="bnd2-urgency">
        <span className="bnd2-urgency-dot" />
        ¡Últimas unidades!
      </div>

      {/* Acordeones de compra (Regalos / Garantía) */}
      {accordions?.length > 0 && (
        <HeroAccordions items={accordions} />
      )}
    </div>
  );
}
