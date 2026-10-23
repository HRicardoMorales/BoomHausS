import { useCallback, useEffect, useRef, useState } from "react";
import "./ConfirmDialog.css";

/**
 * Reemplazo de `window.alert()` para avisos del admin.
 *
 *   const { notify, notice } = useNotice();
 *   notify("No se pudo eliminar", { tone: "error" });
 *   …
 *   return <>{…}{notice}</>;
 *
 * La región `role="status"` está montada siempre (vacía si no hay aviso):
 * los lectores de pantalla solo anuncian cambios dentro de una región viva
 * que ya existía. No roba el foco ni bloquea la página como `alert()`, y se
 * cierra sola a los `duration` ms (o con su botón).
 */
export function useNotice({ duration = 4500 } = {}) {
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);
  const seqRef = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setCurrent(null);
  }, []);

  const notify = useCallback((message, { tone = "info" } = {}) => {
    clearTimeout(timerRef.current);
    seqRef.current += 1;
    setCurrent({ message, tone, key: seqRef.current });
    timerRef.current = setTimeout(() => setCurrent(null), duration);
  }, [duration]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const notice = (
    <div className="nt-region" role="status" aria-live="polite">
      {current && (
        <div key={current.key} className={`nt nt--${current.tone}`}>
          <span className="nt__dot" aria-hidden="true" />
          <span className="nt__msg">{current.message}</span>
          <button type="button" className="nt__x" onClick={dismiss} aria-label="Cerrar aviso">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return { notify, dismiss, notice };
}
