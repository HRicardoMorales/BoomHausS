import SafeImg from "../SafeImg.jsx";
import { moneyARS } from "../../utils/pricing.js";
import { describeLine, unitsLabel } from "./cartLine.js";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/**
 * Una línea del carrito. Fila editorial (foto, nombre, precio a la derecha)
 * separada por filetes en vez de una tarjeta dentro de otra tarjeta.
 * Stepper de 44 px con nombres accesibles; la cantidad es un `<output>` que
 * los lectores anuncian al cambiar. Los packs muestran su cantidad fija.
 */
export default function CartLine({ item, onQty, onRemove }) {
  const line = describeLine(item);
  const name = item?.name || "Producto";

  return (
    <li className="cart-line">
      <div className="cart-line__media">
        {item?.imageUrl ? (
          <SafeImg
            src={item.imageUrl}
            alt=""
            name={name}
            width={96}
            height={96}
            sizes="96px"
            widths={[96, 192]}
            className="cart-line__img"
          />
        ) : (
          <span className="cart-line__noimg" aria-hidden="true">{name.slice(0, 1)}</span>
        )}
        {line.qty > 1 && <span className="cart-line__count" aria-hidden="true">×{line.qty}</span>}
      </div>

      <div className="cart-line__body">
        <div className="cart-line__head">
          <h3 className="cart-line__name">{name}</h3>
          <p className="cart-line__total">
            <span className="sr-only">Total de la línea: </span>
            {moneyARS(line.total)}
          </p>
        </div>

        <p className="cart-line__meta">
          {line.isPack
            ? `Pack de ${unitsLabel(line.qty)} · precio cerrado`
            : `${moneyARS(line.unitPrice)} c/u`}
        </p>

        {(line.saving > 0 || line.promoPct > 0) && (
          <p className="cart-line__deal">
            {line.saving > 0
              ? `Ahorrás ${moneyARS(line.saving)} con este pack`
              : `−${line.promoPct}% en cada par (promo Lleva 2)`}
          </p>
        )}

        <div className="cart-line__actions">
          {line.isPack ? (
            <span className="cart-line__fixed">Cantidad fija del pack</span>
          ) : (
            <div className="cart-stepper" role="group" aria-label={`Cantidad de ${name}`}>
              <button
                type="button"
                className="cart-stepper__btn"
                onClick={() => onQty(item.productId, line.qty - 1)}
                disabled={!line.canDecrease}
                aria-label={`Quitar una unidad de ${name}`}
              >
                <Icon d="M6 12h12" />
              </button>
              <output className="cart-stepper__value" aria-live="polite">
                {line.qty}
              </output>
              <button
                type="button"
                className="cart-stepper__btn"
                onClick={() => onQty(item.productId, line.qty + 1)}
                disabled={!line.canIncrease}
                aria-label={`Sumar una unidad de ${name}`}
              >
                <Icon d="M12 6v12M6 12h12" />
              </button>
            </div>
          )}

          <button
            type="button"
            className="cart-line__remove"
            onClick={() => onRemove(item.productId, name)}
            aria-label={`Quitar ${name} del carrito`}
          >
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}
