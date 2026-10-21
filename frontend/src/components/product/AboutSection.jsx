import SafeImg from "../SafeImg";
import Reveal from "../motion/Reveal";

export default function AboutSection({ mc = {} }) {
  const { about, soldCount, reviewScore, reviewCount } = mc;
  if (!about?.text) return null;

  // Solo números que vienen del config: sin valores inventados de relleno.
  const stats = [
    soldCount   && { value: `+${soldCount}`,    label: "Ventas realizadas" },
    reviewScore && { value: `${reviewScore} ⭐`, label: "Calificación promedio" },
    reviewCount && { value: `+${reviewCount}`,  label: "Reseñas verificadas" },
  ].filter(Boolean);

  return (
    <Reveal as="section" className="about2" id="about">
      <div className="about2-top">
        <div className="about2-brand">
          <span className="about2-live-dot" aria-hidden="true" />
          <span className="about2-brand-name">Amelor</span>
        </div>
        <p className="about2-tagline">Productos que realmente funcionan</p>
      </div>

      <div className="about2-hero">
        <SafeImg
          className="about2-img"
          src={about.img}
          alt="Amelor equipo"
          sizes="(min-width: 768px) 1100px, 100vw"
          referrerPolicy="no-referrer"
        />
        <div className="about2-overlay">
          <p className="about2-quote">{about.text}</p>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="about2-stats">
          {stats.map((s, i) => (
            <div key={i} className="about2-stat">
              <div className="about2-stat-val">{s.value}</div>
              <div className="about2-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="about2-pills">
        {(about.bullets || []).map((b, i) => (
          <div key={i} className="about2-pill">{b}</div>
        ))}
      </div>
    </Reveal>
  );
}
