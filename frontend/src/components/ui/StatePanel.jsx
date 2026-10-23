import { useId } from "react";
import "./StatePanel.css";

/* Íconos de línea propios (24×24, stroke = currentColor). Reemplazan los
   emojis que cada pantalla elegía por su cuenta: se ven igual en todos los
   sistemas y heredan el color del tono. */
const ICONS = {
  bag: (
    <>
      <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  signal: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0" />
      <path d="M12 19.5h.01" />
      <path d="M4 4l16 16" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
};

/**
 * Estado vacío / de error compartido por la tienda.
 *
 * Antes cada pantalla resolvía sus estados a mano (un badge "Vacío", un
 * panel de debug con la URL de la API, emojis sueltos). Este componente da
 * una sola gramática: ícono en anillo, eyebrow, título serif, texto y
 * acciones. `tone="error"` usa role="alert"; el resto, role="status", así
 * los lectores de pantalla anuncian el cambio sin robar el foco.
 *
 * @param {"empty"|"error"} [tone]
 * @param {keyof ICONS} [icon]
 * @param {"page"|"inline"} [size] page = ocupa la pantalla; inline = dentro de una grilla
 * @param {"h1"|"h2"|"h3"} [as] nivel del título según la página
 */
export default function StatePanel({
  tone = "empty",
  icon = tone === "error" ? "signal" : "bag",
  size = "page",
  as: Heading = "h2",
  eyebrow,
  title,
  children,
  actions,
  className = "",
}) {
  const titleId = useId();
  return (
    <section
      className={`state-panel state-panel--${tone} state-panel--${size} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
      aria-labelledby={titleId}
    >
      <span className="state-panel__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon] || ICONS.bag}
        </svg>
      </span>
      {eyebrow && <p className="state-panel__eyebrow">{eyebrow}</p>}
      <Heading id={titleId} className="state-panel__title">{title}</Heading>
      {children && <div className="state-panel__text">{children}</div>}
      {actions && <div className="state-panel__actions">{actions}</div>}
    </section>
  );
}
