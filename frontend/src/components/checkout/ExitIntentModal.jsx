import { useRef } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";

/**
 * Aviso al intentar cerrar el checkout con productos en el carrito.
 * Teclado: el foco entra en "Continuar comprando", Escape equivale a quedarse
 * y Tab no se escapa del diálogo. El click en el fondo es solo un atajo de mouse.
 */
export function ExitIntentModal({ onStay, onLeave }) {
  const cardRef = useRef(null);
  useDialogA11y(cardRef, onStay);

  return (
    <div className="cs-exit-overlay" role="presentation" onClick={e => e.target === e.currentTarget && onStay()}>
      <div ref={cardRef} tabIndex={-1} className="cs-exit-card" role="alertdialog" aria-modal="true"
        aria-labelledby="cs-exit-title" aria-describedby="cs-exit-sub">
        <div className="cs-exit-emoji" aria-hidden="true">🛒</div>
        <div className="cs-exit-title" id="cs-exit-title">¿Seguro que querés salir?</div>
        <div className="cs-exit-sub" id="cs-exit-sub">
          Tu carrito se guardará y podés volver cuando quieras. ¡No pierdas la oferta!
        </div>
        <button type="button" className="cs-exit-stay" onClick={onStay}>
          Continuar comprando
        </button>
        <button type="button" className="cs-exit-leave" onClick={onLeave}>
          Salir sin comprar
        </button>
      </div>
    </div>
  );
}
