import MC from "../../../landings/mundial-revendedores.js";
import { dayOfYear } from "./utils";
import "./HeroSection.css";

/* =========================
   HERO
========================= */
export function HeroSection({ onCtaPrimary, onCtaSecondary }) {
  const { hero } = MC;
  return (
    <section className="ml-hero">
      <div className="ml-hero-badge">{hero.badge}</div>
      <h1 className="ml-hero-title">
        {hero.title} <span className="ml-hero-accent">{hero.titleAccent}</span>
      </h1>
      <p className="ml-hero-sub">{hero.subtitle}</p>

      <div className="ml-hero-ctas">
        <button type="button" className="ml-btn ml-btn--primary" onClick={onCtaPrimary}>
          {hero.primaryCta}
          <span className="ml-btn-arrow">→</span>
        </button>
        <button type="button" className="ml-btn ml-btn--ghost" onClick={onCtaSecondary}>
          💬 {hero.secondaryCta}
        </button>
      </div>

      <div className="ml-hero-stats">
        {hero.stats.map((s, i) => (
          <div key={i} className="ml-hero-stat">
            <div className="ml-hero-stat-val">{s.value}</div>
            <div className="ml-hero-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   Trust strip B2B
========================= */
export function TrustStrip() {
  return (
    <div className="ml-trust-strip anim-el">
      {MC.trustStrip.map((t, i) => (
        <div key={i} className="ml-trust-item">
          <div className="ml-trust-icon">{t.icon}</div>
          <div className="ml-trust-meta">
            <div className="ml-trust-label">{t.label}</div>
            <div className="ml-trust-value">{t.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   SOCIAL PROOF BAR — debajo del hero
========================= */
export function SocialProofBar() {
  // Determinístico por día: cambia cada 24h, estable dentro del día.
  // Rango 17..34 para que sea creíble y no exagerado.
  const todayCount = 17 + (dayOfYear() % 18);
  const liveCount = 3 + (dayOfYear() % 5); // "viendo ahora"
  return (
    <div className="ml-social-proof anim-el">
      <div className="ml-social-proof-item">
        <span className="ml-social-proof-pulse" aria-hidden="true" />
        <span className="ml-social-proof-num">{liveCount}</span>
        <span className="ml-social-proof-txt">revendedores viendo ahora</span>
      </div>
      <div className="ml-social-proof-sep" aria-hidden="true" />
      <div className="ml-social-proof-item">
        <span className="ml-social-proof-fire">🔥</span>
        <span className="ml-social-proof-num">{todayCount}</span>
        <span className="ml-social-proof-txt">compraron hoy</span>
      </div>
    </div>
  );
}
