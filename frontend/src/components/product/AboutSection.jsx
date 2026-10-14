import SafeImg from "../SafeImg";

export default function AboutSection({ mc = {} }) {
  const { about, soldCount, reviewScore, reviewCount } = mc;

  const stats = [
    { value: soldCount  ? `+${soldCount}`              : "+500",  label: "Ventas realizadas"   },
    { value: reviewScore ? `${reviewScore} ⭐`          : "4.8 ⭐", label: "Calificación promedio" },
    { value: reviewCount ? `+${reviewCount}`            : "+100",  label: "Reseñas verificadas" },
  ];

  return (
    <section className="about2 anim-el" id="about">
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

      <div className="about2-stats">
        {stats.map((s, i) => (
          <div key={i} className="about2-stat">
            <div className="about2-stat-val">{s.value}</div>
            <div className="about2-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="about2-pills">
        {about.bullets.map((b, i) => (
          <div key={i} className="about2-pill">{b}</div>
        ))}
      </div>
    </section>
  );
}
