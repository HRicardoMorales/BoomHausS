import { useId, useState } from "react";
import MC from "../../../landings/mundial-revendedores.js";
import { SectionHeader } from "./LandingChrome";

/* =========================
   HOW IT WORKS
========================= */
export function HowItWorks() {
  const { howItWorks } = MC;
  return (
    <div className="ml-htw anim-el">
      <SectionHeader
        kicker="EL PROCESO"
        title={howItWorks.title}
        subtitle={howItWorks.subtitle}
        light
      />
      <div className="ml-htw-grid">
        {howItWorks.steps.map((s, i) => (
          <div key={i} className="ml-htw-step">
            <div className="ml-htw-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="ml-htw-icon">{s.icon}</div>
            <h4 className="ml-htw-stepTitle">{s.title}</h4>
            <p className="ml-htw-stepText">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   FAQ — custom look (numerado, sobre la banda oscura, acordeón suave).
   No usa components/landing/LandingFaq a propósito: ese es para bandas
   claras y sin números. Sí comparte su semántica: aria-controls, panel
   como región y cerrado `inert` (no se lee ni se enfoca).
========================= */
export function ResellerFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();
  return (
    <section className="ml-faq-section">
      <SectionHeader
        kicker="DUDAS FRECUENTES"
        title={MC.faqTitle || "LO QUE MÁS NOS PREGUNTAN"}
        subtitle="Respondemos lo que todo revendedor quiere saber antes de empezar."
        light
      />
      <div className="ml-faq-list anim-el">
        {MC.faq.map((item, i) => {
          const isOpen = openIndex === i;
          const num = String(i + 1).padStart(2, "0");
          const btnId = `${baseId}-q${i}`;
          const panelId = `${baseId}-a${i}`;
          return (
            <div key={i} className={`ml-faq-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                id={btnId}
                className="ml-faq-q"
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="ml-faq-num" aria-hidden="true">{num}</span>
                <span className="ml-faq-q-text">{item.q}</span>
                <span className="ml-faq-chev" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className="ml-faq-a"
                inert={!isOpen}
              >
                <div className="ml-faq-a-inner">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================
   ABOUT (B2B) — sección final, clean y pro
========================= */
export function AboutB2B() {
  const { about } = MC;
  return (
    <section className="ml-about-final anim-el">
      <div className="ml-about-kicker-wrap">
        <span className="ml-about-kicker">QUIÉNES SOMOS</span>
      </div>
      <h3 className="ml-about-title">{about.title}</h3>
      <p className="ml-about-text">{about.text}</p>

      {about.bullets?.length > 0 && (
        <div className="ml-about-bullets">
          {about.bullets.map((b, i) => (
            <div key={i} className="ml-about-pill">
              <span className="ml-about-pill-ico" aria-hidden="true">✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ml-about-signoff">
        <div className="ml-about-signoff-logo">Amelor</div>
        <div className="ml-about-signoff-tag">
          Distribución mayorista · Argentina
        </div>
      </div>
    </section>
  );
}

/* =========================
   MARKET COMPARE — por qué nosotros vs competencia
========================= */
export function MarketCompare() {
  const rows = [
    {
      feat: "Precio mayorista real",
      them: { txt: "Precio inflado", ok: false },
      us:   { txt: "Directo de fábrica", ok: true },
    },
    {
      feat: "Mínimo de compra",
      them: { txt: "50+ unidades", ok: false },
      us:   { txt: "1 solo pack", ok: true },
    },
    {
      feat: "Tiempo de entrega",
      them: { txt: "5 a 10 días", ok: false },
      us:   { txt: "24 a 48hs", ok: true },
    },
    {
      feat: "Reposición de daños",
      them: { txt: "Trámite largo", ok: false },
      us:   { txt: "Gratis, sin vueltas", ok: true },
    },
    {
      feat: "Atención",
      them: { txt: "Formulario / bot", ok: false },
      us:   { txt: "WhatsApp humano", ok: true },
    },
    {
      feat: "Factura A o B",
      them: { txt: "A veces", ok: false },
      us:   { txt: "Siempre", ok: true },
    },
  ];
  return (
    <div className="ml-compare anim-el">
      <div className="ml-compare-table">
        <div className="ml-compare-head">
          <div className="ml-compare-head-feat" aria-hidden="true" />
          <div className="ml-compare-head-them">
            <span className="ml-compare-head-lbl">OTROS PROVEEDORES</span>
          </div>
          <div className="ml-compare-head-us">
            <span className="ml-compare-head-lbl">NOSOTROS</span>
            <span className="ml-compare-head-pill">RECOMENDADO</span>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="ml-compare-row">
            <div className="ml-compare-feat">{r.feat}</div>
            <div className="ml-compare-them">
              <span className="ml-compare-ico ml-compare-ico--x">✕</span>
              <span className="ml-compare-txt">{r.them.txt}</span>
            </div>
            <div className="ml-compare-us">
              <span className="ml-compare-ico ml-compare-ico--ok">✓</span>
              <span className="ml-compare-txt">{r.us.txt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
