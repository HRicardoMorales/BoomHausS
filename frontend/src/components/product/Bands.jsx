import { useId } from "react";

// WaveSeparator — implementación fiel al Wave 3 Animated Divider.
// "from" controla los colores: sección de arriba y sección de abajo.
// Wave divider — estilo Shopify "gentle wave" con 4 capas parallax
export function WaveSeparator({ from = "light" }) {
  const isDark = from === "blue";
  const topColor    = isDark ? "#0b172a" : "#ffffff";
  const bottomColor = isDark ? "#ffffff" : "#0b172a";
  // id único por instancia: la página monta varias olas y antes repetían "gentle-wave".
  const waveId = `gentle-wave-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div
      className="wave-divider"
      role="presentation"
      aria-hidden="true"
      style={{ "--wave-top-color": topColor, "--wave-bottom-color": bottomColor }}
    >
      <svg className="waves-anim" xmlns="http://www.w3.org/2000/svg"
           xmlnsXlink="http://www.w3.org/1999/xlink"
           viewBox="0 24 150 28" preserveAspectRatio="none">
        <defs>
          <path id={waveId} d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z" />
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

export const Band = ({ variant = "light", children }) => {
  return (
    <section className={`pd-band pd-band--${variant}`}>
      <div className="container pd-band-inner">{children}</div>
    </section>
  );
};
