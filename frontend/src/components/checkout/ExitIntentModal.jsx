/** Aviso al intentar cerrar el checkout con productos en el carrito. */
export function ExitIntentModal({ onStay, onLeave }) {
  return (
    <div className="cs-exit-overlay" onClick={e => e.target === e.currentTarget && onStay()}>
      <div className="cs-exit-card" role="alertdialog" aria-modal="true" aria-labelledby="cs-exit-title">
        <div className="cs-exit-emoji">🛒</div>
        <div className="cs-exit-title" id="cs-exit-title">¿Seguro que querés salir?</div>
        <div className="cs-exit-sub">
          Tu carrito se guardará y podés volver cuando quieras. ¡No pierdas la oferta!
        </div>
        <button className="cs-exit-stay" onClick={onStay}>
          Continuar comprando
        </button>
        <button className="cs-exit-leave" onClick={onLeave}>
          Salir sin comprar
        </button>
      </div>
    </div>
  );
}
