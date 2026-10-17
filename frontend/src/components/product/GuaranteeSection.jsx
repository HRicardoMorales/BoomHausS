import Reveal from "../motion/Reveal";
/* =========================
   Guarantee Section — 30 días sin riesgo
========================= */
export default function GuaranteeSection({ mc = {} }) {
  const g = mc.guarantee || {};

  const handleCTA = () => {
    const hero = document.querySelector(".bnd2-wrap") || document.querySelector(".pd-hero-row") || document.querySelector(".pd-grid");
    if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (g.hide) return null;

  return (
    <Reveal as="section" className="grt-section" id="guarantee">
      {/* Medalla CSS — círculo dorado con efecto de sello */}
      <div className="grt-medal" aria-hidden="true">
        <div className="grt-medal-face">
          <span className="grt-medal-sup">★ GARANTÍA ★</span>
          <span className="grt-medal-num">30</span>
          <span className="grt-medal-bot">DÍAS</span>
        </div>
      </div>

      <h2 className="grt-title">{g.title || "30 DÍAS SIN RIESGO"}</h2>
      <p className="grt-sub">{g.sub || "Si no te convence, te devolvemos el dinero.\nSin preguntas. Sin trámites. Sin burocracia."}</p>

      <div className="grt-pills">
        <span className="grt-pill">🔒 Pago protegido</span>
        <span className="grt-pill">↩ Devolución en 30 días</span>
        <span className="grt-pill">✅ Sin requisitos</span>
      </div>

      <button type="button" className="grt-cta" onClick={handleCTA}>
        {g.cta || "QUIERO PROBARLO →"}
      </button>
    </Reveal>
  );
}
