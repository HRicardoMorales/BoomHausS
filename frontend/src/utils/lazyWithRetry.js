import { lazy } from 'react';

const RELOAD_FLAG = 'chunk-reload-at';
const RELOAD_WINDOW_MS = 10_000;

/**
 * `React.lazy` con recuperación ante chunks viejos.
 *
 * Después de un deploy, una pestaña abierta puede pedir un chunk con un hash
 * que ya no existe en el CDN ("Failed to fetch dynamically imported module").
 * En ese caso recargamos la página una sola vez para traer el `index.html`
 * nuevo; si vuelve a fallar dentro de la ventana, dejamos propagar el error.
 *
 * Devuelve el componente lazy con un método `preload()` para precargar el
 * chunk antes de navegar (hover, idle, etc.).
 */
export function lazyWithRetry(importer) {
  let promise;
  const load = () => {
    promise ??= importer().catch((error) => {
      promise = undefined;
      if (isChunkLoadError(error) && shouldReload()) {
        window.location.reload();
        return new Promise(() => {}); // la página se está recargando
      }
      throw error;
    });
    return promise;
  };

  const Component = lazy(load);
  Component.preload = load;
  return Component;
}

function isChunkLoadError(error) {
  const msg = String(error?.message || error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i.test(msg);
}

function shouldReload() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/** Ejecuta `fn` cuando el navegador está ocioso (fallback a setTimeout). */
export function whenIdle(fn, timeout = 2500) {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}
