import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Comportamiento de teclado de un diálogo modal (patrón WAI-ARIA APG):
 *  - al abrir, mueve el foco al primer control (o al contenedor);
 *  - Escape llama a `onEscape`;
 *  - Tab / Shift+Tab quedan atrapados dentro del diálogo;
 *  - al cerrar, devuelve el foco al elemento que lo abrió.
 *
 * `onEscape` se lee desde un ref: no hace falta memoizarlo y el efecto no
 * se re-suscribe en cada render.
 */
export function useDialogA11y(ref, onEscape, { initialFocus = "first" } = {}) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const opener = document.activeElement;

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    const first = initialFocus === "first" ? focusables()[0] : null;
    (first || node).focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) { e.preventDefault(); node.focus(); return; }
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === head || document.activeElement === node)) {
        e.preventDefault(); tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault(); head.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [ref, initialFocus]);
}
