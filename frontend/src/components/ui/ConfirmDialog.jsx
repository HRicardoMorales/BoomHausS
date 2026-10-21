import { useEffect, useId, useRef } from "react";
import "./ConfirmDialog.css";

/** Vista del diálogo de `useConfirm` (ver ese hook). */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onResolve,
}) {
  const ref = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const opener = document.activeElement;
    if (typeof node.showModal === "function" && !node.open) node.showModal();
    else node.setAttribute("open", "");
    cancelRef.current?.focus();
    return () => {
      if (node.open && typeof node.close === "function") node.close();
      if (opener && typeof opener.focus === "function" && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    // Click en el fondo cierra; su equivalente de teclado es Esc (onCancel).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={`cd cd--${tone}`}
      aria-labelledby={titleId}
      aria-describedby={message ? descId : undefined}
      // Esc: el navegador cierra el diálogo; lo traducimos a "cancelar".
      onCancel={(e) => { e.preventDefault(); onResolve(false); }}
      // Click en el backdrop (el target es el propio <dialog>, no su contenido).
      onClick={(e) => { if (e.target === e.currentTarget) onResolve(false); }}
    >
      <div className="cd__body">
        <span className="cd__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {tone === "danger" ? (
              <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>
            ) : (
              <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>
            )}
          </svg>
        </span>
        <h2 id={titleId} className="cd__title">{title}</h2>
        {message && <p id={descId} className="cd__msg">{message}</p>}
      </div>
      <div className="cd__actions">
        <button ref={cancelRef} type="button" className="cd__btn cd__btn--ghost" onClick={() => onResolve(false)}>
          {cancelLabel}
        </button>
        <button type="button" className="cd__btn cd__btn--solid" onClick={() => onResolve(true)}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
