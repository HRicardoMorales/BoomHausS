import { useId } from "react";
import Reveal from "../motion/Reveal.jsx";
import { EASE_OUT } from "../motion/motionPresets.js";

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

/* El sello entra "estampado": gira y se asienta con un resorte corto. */
const SEAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.82, rotate: -24 },
  shown: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 140, damping: 14, mass: 0.9 },
  },
};
const CTA_HOVER = { y: -2, transition: { duration: 0.18, ease: EASE_OUT } };

export default function HomeGuarantee({ waLink }) {
  const ringId = `${useId()}-ring`;
  return (
    <section className="hg" aria-labelledby="hg-title">
      <span className="hp-grain" aria-hidden="true" />
      <div className="hp-inner hg-grid">
        <Reveal as="div" className="hg-seal" variants={SEAL_VARIANTS} aria-hidden="true">
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
        </Reveal>

        <div className="hg-copy">
          <Reveal as="p" className="hp-eyebrow">Garantía</Reveal>
          <Reveal as="h2" className="hp-title" id="hg-title">
            Probalo 30 días. <em>Si no te convence, te devolvemos la plata.</em>
          </Reveal>
          <ol className="hg-steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" index={i} key={s.t} className="hg-step">
                <span className="hg-step-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          {waLink && (
            <Reveal
              as="a"
              index={STEPS.length}
              whileHover={CTA_HOVER}
              whileTap={{ scale: 0.97 }}
              className="hg-cta"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
