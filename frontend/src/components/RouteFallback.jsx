/**
 * Fallback de Suspense mientras se descarga el chunk de una ruta.
 * Barra de progreso fina arriba + bloques skeleton; se muestra con un pequeño
 * delay (CSS) para no parpadear en conexiones rápidas.
 */
export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__bar" aria-hidden="true" />
      <div className="route-fallback__body" aria-hidden="true">
        <span className="route-fallback__block route-fallback__block--media" />
        <span className="route-fallback__block route-fallback__block--title" />
        <span className="route-fallback__block route-fallback__block--line" />
        <span className="route-fallback__block route-fallback__block--line short" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
