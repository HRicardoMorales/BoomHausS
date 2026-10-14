import SafeImg from "../SafeImg";
import SectionHeader from "./SectionHeader";
import BeforeAfterSlider from "./BeforeAfterSlider";

export default function AuthorityCard({ mc = {} }) {
  const ba = mc.beforeAfter;
  const auth = mc.authority || {};

  // Si hay config de before/after, mostrar el slider en lugar de la tarjeta
  if (ba) return <BeforeAfterSlider mc={mc} />;

  if (!auth.show || !auth.quote) return null;

  const { photo, name, role, quote, disclaimer } = auth;

  return (
    <section className="pd-block" id="authority">
      <SectionHeader
        title="LO QUE DICEN LOS PROFESIONALES"
        subtitle="Recomendación de expertos"
      />
      <div className="auth3">
        <div className="auth3-photo-col">
          <SafeImg
            className="auth3-photo"
            src={photo}
            alt={name}
            sizes="(min-width: 768px) 280px, 100vw"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="auth3-content">
          <div className="auth3-label">
            <span className="auth3-label-dot" aria-hidden="true" />
            RECOMENDADO POR PROFESIONALES
          </div>

          <blockquote className="auth3-quote">
            <span className="auth3-qq" aria-hidden="true">"</span>
            {quote}
          </blockquote>

          <div className="auth3-author">
            <div className="auth3-name">{name}</div>
            <div className="auth3-role">{role}</div>
          </div>

          <div className="auth3-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Profesional verificado
          </div>

          {disclaimer && (
            <p className="auth3-disclaimer">{disclaimer}</p>
          )}
        </div>
      </div>
    </section>
  );
}
