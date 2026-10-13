import { useId } from "react";

/*
 * Garantía. Los 30 días son la promesa que repiten todas las landings
 * ("30 DÍAS SIN RIESGO", "30 DÍAS DE GARANTÍA TOTAL"…), así que acá se dice
 * una vez y para toda la tienda. Sello con texto circular en SVG (`textPath`
 * con id de `useId`: no se duplica aunque la sección se monte dos veces).
 */
const RING_TEXT = "Garantía de satisfacción · 30 días sin riesgo · ";

const STEPS = [
  { t: "Lo recibís y lo usás", d: "En tu casa, con tu rutina, sin apuro." },
  { t: "¿No era lo que esperabas?", d: "Nos escribís por WhatsApp dentro de los 30 días." },
  { t: "Te devolvemos el dinero", d: "Coordinamos la devolución y listo. Sin vueltas." },
];

export default function HomeGuarantee({ waLink }) {
  const ringId = `${useId()}-ring`;
  return (
    <section className="hg" aria-labelledby="hg-title">
      <span className="hp-grain" aria-hidden="true" />
      <div className="hp-inner hg-grid">
        <div className="hg-seal hc-anim" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="hg-seal-ring">
            <defs>
              <path id={ringId} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
            </defs>
            <text>
              <textPath href={`#${ringId}`} textLength="488">{RING_TEXT}</textPath>
            </text>
          </svg>
          <span className="hg-seal-core">
            <strong>30</strong>
            <small>días</small>
          </span>
        </div>

        <div className="hg-copy">
          <p className="hp-eyebrow hc-anim">Garantía</p>
          <h2 className="hp-title hc-anim" id="hg-title">
            Probalo 30 días. <em>Si no te convence, te devolvemos la plata.</em>
          </h2>
          <ol className="hg-steps">
            {STEPS.map((s, i) => (
              <li key={s.t} className="hg-step hc-anim" style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="hg-step-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          {waLink && (
            <a className="hg-cta hc-anim" href={waLink} target="_blank" rel="noopener noreferrer">
              Consultar por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
