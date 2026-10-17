import Reveal from "../motion/Reveal";
/* Encabezado común de las secciones de la ficha de producto. */
export default function SectionHeader({ title, subtitle }) {
  return (
    <Reveal className="sec-head">
      <h2 className="sec-title">{title}</h2>
      {subtitle ? <div className="sec-sub">{subtitle}</div> : null}
    </Reveal>
  );
}
