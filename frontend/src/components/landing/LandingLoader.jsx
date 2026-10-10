import "./LandingLoader.css";

/**
 * Pantalla de carga de las landings mientras llega el producto: barra fina
 * animada arriba. `colors` = [extremos, centro] del degradé.
 */
export default function LandingLoader({ colors = ["#AD1457", "#C2185B"] }) {
  const [edge, mid] = colors;
  return (
    <div className="lp-loader" role="status" aria-live="polite">
      <div
        className="lp-loader__bar"
        style={{ "--lp-loader-edge": edge, "--lp-loader-mid": mid }}
      />
      <span className="lp-loader__sr">Cargando producto…</span>
    </div>
  );
}
