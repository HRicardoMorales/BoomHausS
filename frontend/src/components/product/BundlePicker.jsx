import { moneyARS } from "./format";
import PaymentIcons from "./PaymentIcons";
import HeroAccordions from "./HeroAccordions";

/**
 * Selector de packs por cantidad (`bundles` del config de la landing) con su
 * CTA, medios de pago, urgencia y acordeones. Solo es presentación: el precio
 * que se muestra sale del config y el servidor lo vuelve a validar al crear
 * la orden. Un pack `soldOut` queda visible pero no seleccionable.
 */
export default function BundlePicker({ bundles, selectedIdx, onSelect, onBuyNow, accordions }) {
  if (!bundles) return null;
  return (
    <div className="bnd2-wrap">
      {/* Título de sección */}
      <div className="bnd2-section-title">✨ Ofertas por Tiempo Limitado ✨</div>

      {bundles.map((opt, i) => (
        <div
          key={i}
          className={`bnd2-card${selectedIdx === i && !opt.soldOut ? " bnd2-card--on" : ""}${opt.popular ? " bnd2-card--pop" : ""}${opt.soldOut ? " bnd2-card--sold-out" : ""}`}
          onClick={() => !opt.soldOut && onSelect(i)}
          role="button"
          tabIndex={opt.soldOut ? -1 : 0}
          aria-disabled={opt.soldOut || undefined}
          onKeyDown={e => !opt.soldOut && e.key === "Enter" && onSelect(i)}
        >
          {opt.popular && (
            <span className="bnd2-float-badge">{opt.badge || "Más Elegido"}</span>
          )}
          {opt.soldOut && (
            <div className="bnd2-sold-out-overlay">
              <span className="bnd2-sold-out-text">AGOTADO</span>
            </div>
          )}
          <div className="bnd2-row">
            <input
              type="radio"
              name="pd-bundle"
              className="bnd2-radio"
              checked={selectedIdx === i && !opt.soldOut}
              onChange={() => !opt.soldOut && onSelect(i)}
              disabled={opt.soldOut}
              aria-label={opt.label}
            />
            <div className="bnd2-center">
              <span className="bnd2-name">{opt.label}</span>
              {opt.badge && !opt.popular && (
                <span className="bnd2-badge">{opt.badge}</span>
              )}
            </div>
            {!opt.soldOut && (
              <div className="bnd2-prices">
                {opt.compareAt > 0 && <span className="bnd2-was">{moneyARS(opt.compareAt)}</span>}
                <span className="bnd2-now">{moneyARS(opt.price)}</span>
              </div>
            )}
          </div>
          {opt.benefit && !opt.soldOut && (
            <div className="bnd2-benefit">{opt.benefit}</div>
          )}
        </div>
      ))}

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
