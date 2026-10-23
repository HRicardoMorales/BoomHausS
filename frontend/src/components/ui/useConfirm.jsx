import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";

/**
 * Reemplazo accesible de `window.confirm()`.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title: "¿Eliminar el cupón?", tone: "danger" }))) return;
 *   …
 *   return <>{…}{confirmDialog}</>;
 *
 * Por qué un hook y no un provider global: solo lo usa el admin, así el
 * código vive en los chunks lazy del panel y no suma bytes a la tienda.
 *
 * Usa `<dialog>` nativo con `showModal()`: el navegador pone el resto de la
 * página inerte (foco y lector de pantalla quedan adentro), Esc dispara
 * `cancel` y la capa superior evita peleas de z-index con el admin. El foco
 * arranca en "Cancelar" (la opción segura en acciones destructivas) y vuelve
 * al botón que lo abrió al cerrar.
 */
export function useConfirm() {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const settle = useCallback((value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback((options) => {
    // Un confirm pendiente se resuelve como cancelado antes de abrir otro.
    resolverRef.current?.(false);
    const opts = typeof options === "string" ? { title: options } : options || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest(opts);
    });
  }, []);

  // Si la página se desmonta con el diálogo abierto, la promesa no queda colgada.
  useEffect(() => () => resolverRef.current?.(false), []);

  const confirmDialog = request ? (
    <ConfirmDialog {...request} onResolve={settle} />
  ) : null;

  return { confirm, confirmDialog };
}
