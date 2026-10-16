import { useEffect, useId, useRef, useState } from "react";

/* =========================
   Band + WaveSeparator (igual que ProductDetail)
========================= */
export function Band({ variant = "light", children, innerRef, waCtx }) {
  return (
    <section
      ref={innerRef}
      className={`pd-band pd-band--${variant}`}
      {...(waCtx ? { "data-wa-ctx": waCtx } : {})}
    >
      <div className="container pd-band-inner">{children}</div>
    </section>
  );
}

// El <path> lleva un id por instancia (useId): antes las 4 olas de la página
// compartían id="gentle-wave-ml" y el DOM quedaba con ids duplicados.
export function WaveSeparator({ from = "light" }) {
  const waveId = `ml-wave-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const isDark = from === "blue";
  const topColor = isDark ? "#0F2D24" : "#F7FBF9";
  const bottomColor = isDark ? "#F7FBF9" : "#0F2D24";
  return (
    <div
      className="wave-divider"
      role="presentation"
      aria-hidden="true"
      style={{ "--wave-top-color": topColor, "--wave-bottom-color": bottomColor }}
    >
      <svg
        className="waves-anim"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id={waveId}
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
          />
        </defs>
        <g className="parallax1">
          <use href={`#${waveId}`} x="50" y="3" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax2">
          <use href={`#${waveId}`} x="50" y="0" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax3">
          <use href={`#${waveId}`} x="50" y="9" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax4">
          <use href={`#${waveId}`} x="50" y="6" fill="var(--wave-bottom-color)" />
        </g>
      </svg>
    </div>
  );
}

/* =========================
   WhatsApp tab (idéntica a ProductDetail)
========================= */
export function WaTab({ number, message, label }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const handleToggle = (e) => {
    if (!open) {
      e.preventDefault();
      setOpen(true);
      timerRef.current = setTimeout(() => setOpen(false), 4000);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const msg = typeof message === "function" ? message() : message;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(msg || "Hola!")}`;

  return (
    <a
      className={`wa-tab${open ? " wa-tab--open" : ""}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleToggle}
      aria-label="Consultar por WhatsApp"
    >
      <svg className="wa-tab-icon" viewBox="0 0 32 32" width="22" height="22" fill="#fff">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.132 6.744 3.058 9.374L1.058 31.14l5.968-1.97A15.89 15.89 0 0 0 16.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0Zm9.35 22.616c-.394 1.108-1.95 2.028-3.192 2.296-.85.18-1.96.324-5.696-1.224-4.78-1.98-7.852-6.836-8.09-7.152-.228-.316-1.916-2.552-1.916-4.868 0-2.316 1.214-3.454 1.644-3.926.43-.472.94-.59 1.252-.59.312 0 .624.002.898.016.288.014.674-.11 1.054.804.394.948 1.336 3.264 1.452 3.502.118.238.196.514.04.828-.158.316-.236.514-.472.79-.236.278-.496.62-.71.832-.236.236-.482.492-.206.964.276.472 1.226 2.022 2.634 3.276 1.81 1.612 3.336 2.112 3.808 2.348.472.236.748.198 1.024-.118.276-.316 1.182-1.376 1.496-1.848.316-.472.628-.394 1.06-.236.43.158 2.746 1.296 3.216 1.532.472.236.786.354.902.55.118.196.118 1.128-.276 2.236Z" />
      </svg>
      <span className="wa-tab-label">{label || "¿Dudas? Escribinos"}</span>
    </a>
  );
}

/* =========================
   Section Header (igual al de ProductDetail)
========================= */
export function SectionHeader({ kicker, title, subtitle, light = false }) {
  return (
    <div className="ml-sec-head anim-el">
      {kicker && <div className={`ml-sec-kicker ${light ? "is-light" : ""}`}>{kicker}</div>}
      <h2 className={`ml-sec-title ${light ? "is-light" : ""}`}>{title}</h2>
      {subtitle && <p className={`ml-sec-sub ${light ? "is-light" : ""}`}>{subtitle}</p>}
    </div>
  );
}
