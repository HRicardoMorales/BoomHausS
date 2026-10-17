// Barra superior del sheet de checkout. Solo presentación: la navegación
// entre pasos la decide el padre.

const ArrowLeft = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
);

/**
 * @param {object} props
 * @param {number} props.step        paso actual (0 carrito, 1 datos, 2 pago, 3+ sin controles)
 * @param {string} props.storeName
 * @param {() => void} props.onExit  volver a la tienda (paso 0)
 * @param {() => void} props.onBack  paso anterior (pasos 1 y 2)
 * @param {() => void} props.onClose cerrar (con aviso de salida si corresponde)
 */
export function CheckoutNav({ step, storeName, onExit, onBack, onClose }) {
  const showControls = step <= 2;
  return (
    <div className="cs-nav">
      <div className="cs-nav-side cs-nav-side--left">
        {showControls && (
          step === 0 ? (
            <button className="cs-nav-back" onClick={onExit} aria-label="Volver a la tienda">
              <ArrowLeft size={18} />
              Volver
            </button>
          ) : (
            <button className="cs-nav-btn" onClick={onBack} aria-label="Volver al paso anterior">
              <ArrowLeft size={20} />
            </button>
          )
        )}
      </div>

      <div className="cs-nav-center">{storeName}</div>

      <div className="cs-nav-side cs-nav-side--right">
        {showControls && (
          <>
            {(step === 1 || step === 2) && (
              <span className="cs-nav-secure">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Seguro
              </span>
            )}
            <button className="cs-nav-btn" onClick={onClose} aria-label="Cerrar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
