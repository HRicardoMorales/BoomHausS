/* Encabezado común de las secciones de la ficha de producto. */
export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="sec-head anim-el">
      <h2 className="sec-title">{title}</h2>
      {subtitle ? <div className="sec-sub">{subtitle}</div> : null}
    </div>
  );
}
