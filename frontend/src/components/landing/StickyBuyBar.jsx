import "./StickyBuyBar.css";

const fmt = (n) => "$" + Number(n).toLocaleString("es-AR");

/**
 * Barra de compra fija de las landings (aparece al pasar el CTA principal).
 *
 * @param {object}   props.bundle            bundle seleccionado ({ label, price, compareAt, soldOut })
 * @param {boolean}  props.visible           controlado por `useStickyCta`
 * @param {Function} props.onBuy
 * @param {boolean} [props.disabled]
 * @param {string}   props.buttonText
 * @param {boolean} [props.showInstallments] muestra "3 cuotas de $X"
 * @param {boolean} [props.showLabel]        muestra el nombre del bundle
 * @param {object}  [props.theme]            { from, to, shadow: "r, g, b", label }
 */
export default function StickyBuyBar({
  bundle,
  visible,
  onBuy,
  disabled = false,
  buttonText,
  showInstallments = false,
  showLabel = true,
  theme = {},
}) {
  if (!bundle) return null;
  const { soldOut } = bundle;
  const style = {
    ...(theme.from && { "--lsb-from": theme.from }),
    ...(theme.to && { "--lsb-to": theme.to }),
    ...(theme.shadow && { "--lsb-shadow": theme.shadow }),
    ...(theme.label && { "--lsb-label": theme.label }),
  };

  return (
    <div
      className={`lsb${visible ? " lsb--visible" : ""}`}
      style={style}
      // Oculta para lectores de pantalla y teclado mientras no se ve
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="lsb__inner">
        <div className="lsb__info">
          <div className="lsb__prices">
            {!soldOut && <span className="lsb__old">{fmt(bundle.compareAt)}</span>}
            <span className="lsb__now">{soldOut ? "Agotado" : fmt(bundle.price)}</span>
            {showInstallments && !soldOut && (
              <span className="lsb__cuotas">
                3 cuotas de {fmt(Math.ceil(bundle.price / 3))}
              </span>
            )}
          </div>
          {showLabel && (
            <span className="lsb__label">
              {soldOut ? "Elegí otro kit arriba" : String(bundle.label || "").split("—")[0].trim()}
            </span>
          )}
        </div>
        <button type="button" className="lsb__btn" onClick={onBuy} disabled={soldOut || disabled}>
          {buttonText}
        </button>
      </div>
      <p className="lsb__grt lsb__grt--full">🛡️ Garantía 30 días — Si no te convence, te devolvemos el dinero entero</p>
      <p className="lsb__grt lsb__grt--short">🛡️ Garantía 30 días</p>
    </div>
  );
}
