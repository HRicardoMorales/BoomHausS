import { startTransition, useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { logger } from "../utils/logger.js";

/* Esperas entre intentos: cubren el cold start de Render (~30-60 s) sin
   castigar si la API vuelve rápido. Peor caso ~10 s antes del error. */
const RETRY_DELAYS = [0, 1000, 3000, 6000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* `landings/catalog.js` arrastra los configs de las 14 landings (~170 KB sin
   comprimir, casi la mitad del chunk inicial). Se pide en paralelo con la API,
   que es lo lento (cold start), así que no suma latencia. Si el import falla
   se olvida la promesa para que el siguiente intento lo vuelva a pedir. */
let catalogModule;
const loadCatalogModule = () => {
  catalogModule ??= import("../landings/catalog.js").catch((e) => {
    catalogModule = undefined;
    throw e;
  });
  return catalogModule;
};

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
        const [{ buildCatalog }, productsRes, slugsRes] = await Promise.all([
          loadCatalogModule(),
          api.get("/products"),
          api.get("/products/slugs").catch(() => ({ data: { data: [] } })),
        ]);
        if (isCancelled()) return;
        const raw = productsRes.data?.data ?? productsRes.data ?? [];
        const products = buildCatalog(raw, slugsRes.data?.data ?? []);
        // Transición: React arma la grilla, el carrusel y los conteos en
        // tramos de ~5 ms cediendo el hilo entre medio, en vez de una tarea
        // larga que bloquea el scroll y el primer toque (TBT de la home).
        startTransition(() => {
          setState({ products, loading: false, fetchError: false, retryAttempt: 0 });
        });
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
