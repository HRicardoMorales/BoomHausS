import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { logger } from "../../utils/logger";

/**
 * Trae un producto por slug (landings `/lp/:slug`) o por id (`/products/:id`).
 *
 * - `error` es `{ kind: "not-found" | "network", status }` o `null`: la UI
 *   decide el mensaje (antes se armaban textos para el admin que nadie veía y
 *   la página los clasificaba con una regex sobre el texto).
 * - Las respuestas viejas se descartan: al cambiar rápido de variante, la
 *   respuesta lenta de la anterior ya no pisa a la actual.
 * - `hasLoaded` permite no volver a mostrar la pantalla de carga completa
 *   cuando solo cambia la variante.
 * - `retry()` reintenta sin recargar la página.
 */
export function useProduct({ id, slug }) {
  const [state, setState] = useState({ product: null, error: null, loading: true, hasLoaded: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = slug ? await api.get(`/products/slug/${slug}`) : await api.get(`/products/${id}`);
        if (stale) return;
        if (res.data?.ok) {
          setState({ product: res.data.data, error: null, loading: false, hasLoaded: true });
        } else {
          setState({ product: null, error: { kind: "not-found", status: res.status }, loading: false, hasLoaded: true });
        }
      } catch (err) {
        if (stale) return;
        const status = err?.response?.status;
        // 400 = id mal formado (validateObjectId en el backend): tampoco existe.
        const kind = status === 404 || status === 400 ? "not-found" : "network";
        if (kind === "not-found" && slug) {
          logger.debug(`[useProduct] sin producto con slug "${slug}" (Admin → Productos → Slug)`);
        }
        setState({ product: null, error: { kind, status }, loading: false, hasLoaded: true });
      }
    }

    load();
    return () => { stale = true; };
  }, [id, slug, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}

