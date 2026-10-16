import WaveSeparator from "../WaveSeparator";

/* =========================
   Band + olas (igual que ProductDetail)
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

// Olas: el componente compartido de components/landing con la paleta verde
// de la landing (antes había una copia local con su propio CSS y keyframes).
const WAVE_DARK = "#0F2D24";
const WAVE_LIGHT = "#F7FBF9";

export function MundialWave({ from = "light" }) {
  return <WaveSeparator from={from} dark={WAVE_DARK} light={WAVE_LIGHT} />;
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
