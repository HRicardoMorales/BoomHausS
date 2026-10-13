import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { buildCatalog } from "../landings/catalog.js";
import { logger } from "../utils/logger.js";

/* Esperas entre intentos: cubren el cold start de Render (~30-60 s) sin
   castigar si la API vuelve rápido. Peor caso ~10 s antes del error. */
const RETRY_DELAYS = [0, 1000, 3000, 6000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Catálogo de la home con reintentos. Si todos fallan devuelve
 * `fetchError` y una lista vacía: mejor un mensaje claro que un catálogo
 * fantasma armado con los configs de landing.
 */
export function useCatalog() {
  const [state, setState] = useState({
    products: [],
    loading: true,
    fetchError: false,
    retryAttempt: 0, // 0 = primer intento, 1+ = reintento en curso
  });

  const load = useCallback(async (isCancelled = () => false) => {
    setState((s) => ({ ...s, loading: true, fetchError: false, retryAttempt: 0 }));
    let lastError = null;

    for (let i = 0; i < RETRY_DELAYS.length; i++) {
      if (RETRY_DELAYS[i] > 0) {
        setState((s) => ({ ...s, retryAttempt: i }));
        await sleep(RETRY_DELAYS[i]);
      }
      if (isCancelled()) return;
      try {
        const [productsRes, slugsRes] = await Promise.all([
          api.get("/products"),
          api.get("/products/slugs").catch(() => ({ data: { data: [] } })),
        ]);
        if (isCancelled()) return;
        const raw = productsRes.data?.data ?? productsRes.data ?? [];
        const products = buildCatalog(raw, slugsRes.data?.data ?? []);
        setState({ products, loading: false, fetchError: false, retryAttempt: 0 });
        return;
      } catch (e) {
        lastError = e;
        logger.warn(`Home catalog: intento ${i + 1}/${RETRY_DELAYS.length} falló`, e?.message || e);
      }
    }

    if (isCancelled()) return;
    logger.error("Home catalog: todos los reintentos fallaron", lastError);
    setState({ products: [], loading: false, fetchError: true, retryAttempt: 0 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  const retry = useCallback(() => load(), [load]);

  return { ...state, retry };
}
