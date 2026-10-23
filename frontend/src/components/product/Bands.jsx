// Banda de color de la ficha de producto. Las olas entre bandas son el
// `WaveSeparator` compartido de components/landing.
export const Band = ({ variant = "light", children }) => {
  return (
    <section className={`pd-band pd-band--${variant}`}>
      <div className="container pd-band-inner">{children}</div>
    </section>
  );
};
