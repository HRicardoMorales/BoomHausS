import "./StarRating.css";

const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/**
 * Estrellas de puntaje para las landings. Se anuncia como una imagen con
 * "4,8 de 5 estrellas" y las estrellas individuales quedan ocultas a lectores
 * de pantalla (antes leían "★ ★ ★ ★ ★").
 */
export default function StarRating({ value = 5, size = "sm", className = "" }) {
  const filled = Math.round(value);
  return (
    <span
      className={`lp-stars lp-stars--${size} ${className}`.trim()}
      role="img"
      aria-label={`${fmt.format(value)} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} aria-hidden="true" className={s <= filled ? "is-on" : undefined}>★</span>
      ))}
    </span>
  );
}
