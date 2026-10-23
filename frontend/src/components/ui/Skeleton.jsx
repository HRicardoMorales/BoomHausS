import "./Skeleton.css";

/**
 * Bloque de carga. Una sola animación y paleta para toda la tienda (antes
 * la home tenía `.hc-skel` con estilos inline y el resto mostraba texto
 * "Cargando..."). Siempre aria-hidden: quien lo usa anuncia la carga una vez
 * con un contenedor role="status" (ver `SkeletonGroup`).
 */
export default function Skeleton({ width, height = "1rem", radius, className = "", style }) {
  return (
    <span
      className={`skel ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** Contenedor que anuncia "Cargando…" a lectores de pantalla una sola vez. */
export function SkeletonGroup({ label = "Cargando…", className = "", children }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
