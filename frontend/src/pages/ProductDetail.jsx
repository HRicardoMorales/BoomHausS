import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

/* ========================================================================
   MARKETING CONTENT (EDICIÓN: ESTRATEGIA "REGALO")
   ======================================================================== */
const MARKETING_CONTENT = {
  miniDescription:
    "Volvé a divertirte como antes, pero en tu TV. La Game Stick M15 es ese “plan fácil” para cualquier día: conectás, agarrás los mandos y ya estás jugando. Ideal para jugar con amigos o en familia, revivir clásicos y pasar horas sin pensar qué poner. Trae 2 mandos para jugar de a dos y una biblioteca enorme de juegos retro para que siempre tengas algo nuevo que probar. Si querés una compra que se disfrute desde el minuto 1, esta es.",

  heroBullets: [
    "🎮 +20.000 Juegos ya instalados.",
    "🎁 2do Joystick GRATIS (Oferta x Tiempo Limitado).",
    "📺 Resolución 4K Ultra HD vía HDMI.",
    "💾 Guardado de partidas (Save State).",
    "🚀 15 Emuladores: PS1, Sega, Nintendo, Arcade...",
    "✅ Plug & Play: Conectar y Jugar.",
  ],

  stats: [
    { pct: "20K+", text: "Juegos Clásicos" },
    { pct: "GRATIS", text: "2do Joystick" },
    { pct: "4K", text: "Calidad de Imagen" },
  ],

  whatsIncluded: [
    { name: "Game Stick M15 4K", icon: "🎮" },
    { name: "Mando Principal", icon: "🕹️" },
    { name: "2do Mando (REGALO)", icon: "🎁" },
    { name: "Receptor + Cables", icon: "🔌" },
  ],

  breakthroughBenefits: {
    title: "Tu infancia en un Stick",
    subtitle: "Olvídate de comprar consolas viejas. Aquí tienes TODO en uno.",
    items: [
      {
        title: "Oferta 2x1 en Mandos",
        desc: "Solo por hoy, incluimos el segundo joystick totalmente bonificado para que no juegues solo.",
        icon: "🎁",
      },
      {
        title: "Catálogo Infinito",
        desc: "Desde Mario y Sonic hasta Street Fighter. 20.000 títulos para elegir.",
        icon: "📚",
      },
      {
        title: "Libertad Inalámbrica",
        desc: "Juega desde el sofá sin cables molestos gracias a los controles 2.4G.",
        icon: "🛋️",
      },
      {
        title: "Potencia M15",
        desc: "Chip mejorado para correr juegos de PS1 y Arcade sin lag.",
        icon: "🚀",
      },
      {
        title: "Guarda tu Progreso",
        desc: "¿Te llaman a comer? Guarda la partida y retómala después.",
        icon: "💾",
      },
      {
        title: "Plug & Play",
        desc: "Sin instalaciones. Conectas al HDMI y juegas al instante.",
        icon: "⚡",
      },
    ],
  },

  slider: {
    title: "Ayer vs. Hoy",
    text: "Toda tu colección de cartuchos ahora cabe en tu bolsillo.",
    labelBefore: "Antes (Cables y Cartuchos)",
    labelAfter: "Ahora (Game Stick M15)",
    imgBefore:
      "https://pbs.twimg.com/media/G-wt1eTbQAEFNGS?format=jpg&name=small",
    imgAfter:
      "https://pbs.twimg.com/media/G-wuj-CagAAQJqx?format=jpg&name=small",
  },

  comparison: {
    title: "M15 vs. Consolas Viejas",
    text: "La evolución de la nostalgia.",
    brandName: "Game Stick M15",
    competitorName: "Consola Original",
    features: [
      { name: "20.000 Juegos Incluidos", us: true, others: false },
      { name: "2do Mando GRATIS", us: true, others: false },
      { name: "Conexión HDMI 4K", us: true, others: false },
      { name: "No sopla cartuchos", us: true, others: false },
      { name: "Guardado de Partida", us: true, others: false },
    ],
  },

  bigMedia: {
    title: "Revive la magia en 4K.",
    subtitle: "Invita a tus amigos, pide unas pizzas y vuelvan a tener 10 años.",
    src: "https://pbs.twimg.com/media/G-wvy3vbQAMt65N?format=jpg&name=small",
    isVideo: false,
  },

  authority: {
    title: "Editor en TecnoGaming",
    quote:
      "He probado docenas de consolas retro chinas. Por este precio, la M15 es la única que ofrece emulación fluida y mandos que no se sienten de juguete. Es la compra inteligente del año.",
    name: "Alejandro T.",
    job: "Cliente Verificado",
    img: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600",
  },

  faq: [
    {
      q: "¿El segundo mando es realmente gratis?",
      a: "SÍ. Al comprar el pack hoy, te enviamos la caja con 2 mandos, pero solo pagas el precio de uno.",
    },
    {
      q: "¿Necesita internet?",
      a: "NO. No necesitas internet ni WiFi. Todo viene instalado en la memoria interna.",
    },
    {
      q: "¿Qué pilas llevan los mandos?",
      a: "Cada mando lleva 2 pilas AAA (las 'finitas'). No están incluidas.",
    },
    {
      q: "¿Cómo se conecta?",
      a: "El Stick va al puerto HDMI de la tele, y el cable USB al puerto USB de la tele.",
    },
    {
      q: "¿Puedo guardar partidas?",
      a: "Sí, presionando SELECT + START al mismo tiempo abres el menú para Guardar.",
    },
  ],

  trustBadges: {
    payment: [
      {
        name: "Visa",
        src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
      },
      {
        name: "Mastercard",
        src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
      },
      {
        name: "Amex",
        src: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg",
      },
      {
        name: "Mercado Pago",
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Mercado_Pago_Link_Logo.png/1024px-Mercado_Pago_Link_Logo.png",
      },
    ],
    shipping: "Envío Gratis y Asegurado a todo el país",
    security: "Garantía de funcionamiento asegurada.",
  },
};

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="28" fill="#94a3b8">
      Imagen no disponible
    </text>
  </svg>
`);

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const difference = endOfDay - now;
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      return "00h 00m 00s";
    };
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="countdown-timer">{timeLeft}</span>;
}

function ClinicalStatsSection() {
  const { stats } = MARKETING_CONTENT;
  return (
    <div className="landing-section fade-in-section">
      <div className="landing-container">
        <h3 className="landing-center-title">Potencia Retro</h3>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card hover-scale">
              <div className="stat-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">
                    {s.pct}
                  </text>
                </svg>
              </div>
              <p className="stat-text">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreakthroughSection() {
  const { breakthroughBenefits } = MARKETING_CONTENT;
  return (
    <div className="landing-section breakthrough-section fade-in-section">
      <div className="landing-container">
        <h3 className="landing-center-title">{breakthroughBenefits.title}</h3>
        <p className="landing-center-subtitle landing-center-subtitle--breakthrough">
          {breakthroughBenefits.subtitle}
        </p>

        <div className="breakthrough-grid">
          {breakthroughBenefits.items.map((item, i) => (
            <div key={i} className="breakthrough-card hover-lift-pro">
              <div className="breakthrough-icon">{item.icon}</div>
              <h4 className="breakthrough-title">{item.title}</h4>
              <p className="breakthrough-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhatsIncludedSection() {
  const { whatsIncluded } = MARKETING_CONTENT;
  return (
    <div className="landing-section whats-included-section fade-in-section">
      <div className="landing-container">
        <h3 className="landing-center-title">¿Qué incluye la caja?</h3>
        <div className="included-grid">
          {whatsIncluded.map((item, i) => (
            <div key={i} className="included-item hover-lift">
              <div className="included-icon spin-on-hover">{item.icon}</div>
              <div className="included-name">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const { slider } = MARKETING_CONTENT;

  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  };

  return (
    <div className="landing-section fade-in-section">
      <div className="landing-container split-layout reverse-mobile">
        <div className="split-text">
          <span className="badge-pill">Evolución</span>
          <h3 className="landing-title">{slider.title}</h3>
          <p className="landing-p">{slider.text}</p>
        </div>

        <div className="split-media">
          <div
            className="ba-slider-container shadow-hover"
            ref={containerRef}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onTouchStart={handleMove}
          >
            <img src={slider.imgAfter} alt="Después" className="ba-img" />
            <div className="ba-label ba-after">{slider.labelAfter}</div>

            <div className="ba-overlay" style={{ width: `${sliderPos}%` }}>
              <img
                src={slider.imgBefore}
                alt="Antes"
                className="ba-img ba-img--before"
              />
              <div className="ba-label ba-before">{slider.labelBefore}</div>
            </div>

            <div className="ba-handle" style={{ left: `${sliderPos}%` }}>
              <div className="ba-line"></div>
              <div className="ba-circle">⟷</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const { comparison } = MARKETING_CONTENT;
  return (
    <div className="landing-section fade-in-section">
      <div className="landing-container">
        <h3 className="landing-center-title">{comparison.title}</h3>
        <div className="comp-table shadow-hover">
          <div className="comp-header">
            <div className="comp-col-empty"></div>
            <div className="comp-col-us">{comparison.brandName}</div>
            <div className="comp-col-others">{comparison.competitorName}</div>
          </div>

          {comparison.features.map((f, i) => (
            <div key={i} className="comp-row">
              <div className="comp-feature-name">{f.name}</div>
              <div className="comp-check-us">✔</div>
              <div className="comp-check-others comp-check-others--muted">✕</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BigMediaSection() {
  const { bigMedia } = MARKETING_CONTENT;
  return (
    <div className="landing-section full-width-bg fade-in-section">
      <div className="landing-container text-center">
        <h2 className="video-title-pro">{bigMedia.title}</h2>
        <p className="video-subtitle-pro">{bigMedia.subtitle}</p>

        <div className="video-placeholder-container">
          {bigMedia.isVideo ? (
            <video
              src={bigMedia.src}
              autoPlay
              loop
              muted
              playsInline
              className="landing-video-real"
            />
          ) : (
            <img
              src={bigMedia.src}
              alt="Demo"
              className="landing-video-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProblemSolutionSection() {
  return (
    <div className="landing-section fade-in-section">
      <div className="landing-container split-layout reverse-mobile">
        <div className="split-text">
          <span className="badge-pill">Gaming 2024</span>
          <h3 className="landing-title">¿Por qué elegir la M15?</h3>
          <p className="landing-p">
            La combinación perfecta entre nostalgia y tecnología moderna.
          </p>

          <div className="tech-list">
            <div className="tech-item hover-lift">
              <div className="tech-icon">🎁</div>
              <div>
                <strong>2do Mando GRATIS</strong>
                <p>Te regalamos el segundo joystick para que juegues acompañado.</p>
              </div>
            </div>

            <div className="tech-item hover-lift">
              <div className="tech-icon">🏎️</div>
              <div>
                <strong>Cero Lag</strong>
                <p>Procesador optimizado para emulación fluida.</p>
              </div>
            </div>

            <div className="tech-item hover-lift">
              <div className="tech-icon">📺</div>
              <div>
                <strong>Compatible con todo</strong>
                <p>Funciona en cualquier TV/Monitor con HDMI.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="split-media ps-split-media">
          <div className="gift-card hover-lift">
            <h3 className="gift-card-title">¡El 2do Mando va de Regalo! 🎁</h3>
            <p className="gift-card-text">
              No dejes que tu amigo te mire jugar. Con la oferta de hoy, te llevas el segundo joystick{" "}
              <b>GRATIS</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthoritySection() {
  const { authority } = MARKETING_CONTENT;
  return (
    <div className="landing-section authority-bg fade-in-section">
      <div className="landing-container authority-flex">
        <div className="authority-img-box">
          <img
            src={authority.img}
            alt="Experto"
            className="authority-img-fixed shadow-hover"
          />
        </div>

        <div className="authority-text">
          <div className="authority-stars">★★★★★</div>
          <p className="landing-p authority-quote">"{authority.quote}"</p>
          <div className="authority-sign">
            <strong>{authority.name}</strong>
            <span>{authority.job}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const { faq } = MARKETING_CONTENT;
  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="landing-section fade-in-section" id="faq-section">
      <h3 className="landing-center-title">Preguntas Frecuentes</h3>
      <div className="landing-container faq-container">
        {faq.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="faq-item">
              <button
                className={`faq-question ${isOpen ? "active" : ""}`}
                onClick={() => toggle(i)}
                type="button"
              >
                {item.q}
                <span className="faq-icon">{isOpen ? "−" : "+"}</span>
              </button>

              <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                <p className="faq-answer-text">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [showAll, setShowAll] = useState(false);

  const allReviews = [
    {
      date: "Hace 2 días",
      author: "Matías F.",
      location: "Córdoba",
      rating: 5,
      verified: true,
      title: "Superó mis expectativas",
      text:
        "La verdad tenía dudas porque vi muchas parecidas en internet, pero esta funciona joya. Los joysticks se sienten bien, no son pesados. Lo único malo es que las pilas se gastan rápido si jugás mucho, compren recargables.",
      image: null,
    },
    {
      date: "Hace 5 días",
      author: "Lucas G.",
      location: "Buenos Aires",
      rating: 5,
      verified: true,
      title: "El regalo del 2do mando es real",
      text:
        "Llegó todo en la caja. Pensé que era mentira lo del mando de regalo pero vinieron los dos. Ya le dimos duro al Street Fighter con mi hermano. Recomendado.",
      image: null,
    },
    {
      date: "Hace 1 semana",
      author: "Valeria S.",
      location: "Mendoza",
      rating: 4,
      verified: true,
      title: "Muy buena, llegó rápido",
      text:
        "Me llegó en 3 días a Mendoza. La consola es chiquita, queda escondida atrás de la tele, eso me gustó. Trae bocha de juegos, algunos repetidos pero los clásicos están todos.",
      image: null,
    },
    {
      date: "Hace 1 semana",
      author: "Esteban D.",
      location: "CABA",
      rating: 5,
      verified: true,
      title: "Nostalgia pura",
      text:
        "No puedo creer que tenga el Pepsi Man jajaja. Es enchufar y jugar, no tuve que configurar nada. Vale cada peso.",
      image: null,
    },
    {
      date: "Hace 2 semanas",
      author: "Camila R.",
      location: "Santa Fe",
      rating: 5,
      verified: true,
      title: "Excelente atención",
      text:
        "Tuve un problema para conectarlo al principio (era mi tele) y me respondieron al toque por WhatsApp para ayudarme. Unos genios.",
      image: null,
    },
    {
      date: "Hace 3 semanas",
      author: "Jorge P.",
      location: "Neuquén",
      rating: 4,
      verified: true,
      title: "Buen producto",
      text:
        "La relación precio calidad es imbatible. No esperen gráficos de PS5, son juegos retro. Para pasar el rato con amigos va como piña.",
      image: null,
    },
    {
      date: "Hace 3 semanas",
      author: "Fernando A.",
      location: "Rosario",
      rating: 5,
      verified: true,
      title: "Todo OK",
      text:
        "Compré el pack de 2 para regalarle una a mi ahijado y quedé como un rey. La presentación es simple pero cumple.",
      image: null,
    },
    {
      date: "Hace 1 mes",
      author: "Lucía M.",
      location: "Tucumán",
      rating: 5,
      verified: true,
      title: "Me encanta",
      text:
        "Los juegos de Mario y Sonic andan perfecto. Me hace acordar a cuando era chica. El envío tardó un poquito más de lo esperado pero llegó bien.",
      image: null,
    },
    {
      date: "Hace 1 mes",
      author: "Gustavo L.",
      location: "La Plata",
      rating: 4,
      verified: true,
      title: "Buena opción económica",
      text:
        "Si querés revivir viejos tiempos sin gastar una fortuna en una consola usada, esto es lo mejor. Los mandos son tipo Play, bastante cómodos.",
      image: null,
    },
  ];

  const visibleReviews = showAll ? allReviews : allReviews.slice(0, 6);

  return (
    <div id="reviews-section" className="landing-section reviews-section fade-in-section">
      <div className="landing-container">
        <div className="reviews-header-grid">
          <div className="rh-left">
            <h3 className="tm-main-title tm-main-title--left">Opiniones del producto</h3>
            <div className="rh-score-row">
              <span className="rh-big-score">4.8</span>
              <div className="rh-stars-col">
                <span className="rh-stars">★★★★★</span>
                <span className="rh-count">Base en 1,204 opiniones</span>
              </div>
            </div>
          </div>

          <div className="rh-right">
            <div className="rh-bar-row">
              <span className="rh-star-label">5 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w85"></div>
              </div>
              <span className="rh-pct">85%</span>
            </div>

            <div className="rh-bar-row">
              <span className="rh-star-label">4 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w10"></div>
              </div>
              <span className="rh-pct">10%</span>
            </div>

            <div className="rh-bar-row">
              <span className="rh-star-label">3 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w3"></div>
              </div>
              <span className="rh-pct">3%</span>
            </div>

            <div className="rh-bar-row">
              <span className="rh-star-label">2 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w1"></div>
              </div>
              <span className="rh-pct">1%</span>
            </div>

            <div className="rh-bar-row">
              <span className="rh-star-label">1 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w1"></div>
              </div>
              <span className="rh-pct">1%</span>
            </div>
          </div>
        </div>

        <div className="reviews-list-grid">
          {visibleReviews.map((r, i) => (
            <div key={i} className="review-card-real fade-in-section">
              <div className="rc-header">
                <div className="rc-stars">
                  {[...Array(r.rating)].map((_, x) => (
                    <span key={x}>★</span>
                  ))}
                </div>
                <span className="rc-date">{r.date}</span>
              </div>

              <h4 className="rc-title">{r.title}</h4>
              <p className="rc-text">{r.text}</p>

              {r.image && (
                <div className="rc-img-container">
                  <img src={r.image} alt="Foto del cliente" loading="lazy" />
                </div>
              )}

              <div className="rc-footer">
                <div className="rc-author-block">
                  <div className="rc-avatar">{r.author.charAt(0)}</div>
                  <div className="rc-author-info">
                    <span className="rc-name">{r.author}</span>
                    <span className="rc-location">{r.location}</span>
                  </div>
                </div>

                {r.verified && (
                  <div className="rc-verified-badge">
                    <span className="rc-check">✓</span> Compra Verificada
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="reviews-toggle-wrap">
          <button className="btn-load-more" onClick={() => setShowAll(!showAll)} type="button">
            {showAll ? "Ver menos" : "Ver todas las opiniones"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   HELPERS & MAIN
========================= */
function formatARS(n) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function Stars() {
  return (
    <div className="hero-stars">
      <span className="hero-star on">★</span>
      <span className="hero-star on">★</span>
      <span className="hero-star on">★</span>
      <span className="hero-star on">★</span>
      <span className="hero-star on">★</span>{" "}
      <span className="hero-ratingText">4.9/5</span>
    </div>
  );
}

function moneyARS(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [bundle, setBundle] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 40;
  const lastViewedRef = useRef(null);

  useEffect(() => {
    async function fetchOne() {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        if (res.data?.ok) setProduct(res.data.data);
        else setError("No se pudo cargar.");
      } catch (e) {
        setError("Error al cargar.");
      } finally {
        setLoading(false);
      }
    }
    fetchOne();
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    const arr = [];
    if (product.imageUrl) arr.push(product.imageUrl);
    if (Array.isArray(product.images)) {
      product.images.forEach((x) => {
        if (x && typeof x === "string" && !arr.includes(x)) arr.push(x);
      });
    }
    return arr;
  }, [product]);

  const nextImage = () => {
    if (images.length > 0) setActiveImgIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    if (images.length > 0) setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextImage();
    if (distance < -minSwipeDistance) prevImage();
  };

  const price = Number(product?.price) || 0;
  const compareAt =
    Number(product?.originalPrice) ||
    Number(product?.compareAtPrice) ||
    (price ? Math.round(price * 1.35) : 0);
  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 1284;

  const pack2Discount = 10;
  const unitPrice = price;
  const totalQty = qty;
  const promoOn = bundle === 2;
  const pairsQty = promoOn ? Math.floor(totalQty / 2) * 2 : 0;
  const remQty = totalQty - pairsQty;
  const displayTotal = promoOn
    ? Math.round(pairsQty * unitPrice * (1 - pack2Discount / 100) + remQty * unitPrice)
    : Math.round(totalQty * unitPrice);
  const transferPrice = Math.round(displayTotal * 0.9);

  const contentId = useMemo(
    () =>
      product?.sku ||
      product?.productId ||
      product?._id ||
      (product?.id ? String(product.id) : null) ||
      id ||
      "GAMESTICK_M15",
    [product, id]
  );

  useEffect(() => {
    if (!product) return;
    if (lastViewedRef.current === contentId) return;
    lastViewedRef.current = contentId;

    track("ViewContent", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(price) || 0,
      currency: "ARS",
    });
  }, [product, contentId, price]);

  const handleBuyNow = () => {
    if (!product) return;
    setRedirecting(true);

    track("InitiateCheckout", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(displayTotal) || 0,
      currency: "ARS",
      num_items: Number(totalQty) || 1,
    });

    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);

    setTimeout(() => navigate("/checkout"), 500);
  };

  const handleAddToCart = () => {
    if (!product) return;
    track("AddToCart", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(displayTotal) || 0,
      currency: "ARS",
      num_items: Number(totalQty) || 1,
    });

    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
    window.dispatchEvent(new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } }));
  };

  const scrollToReviews = (e) => {
    e.preventDefault();
    document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading)
    return (
      <main className="section">
        <div className="container">
          <div className="pd-skeleton card">
            <div className="pd-skel-left" />
            <div className="pd-skel-right" />
          </div>
        </div>
      </main>
    );

  if (error || !product)
    return (
      <main className="section">
        <div className="container">
          <div className="card pd-errorCard">
            <div className="pd-badge">Error</div>
            <p className="pd-error pd-errorText">{error || "Producto no encontrado."}</p>
            <div className="pd-errorActions">
              <Link className="btn btn-ghost" to="/products">
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </main>
    );

  return (
    <main className="section main-wrapper pd-page">
      <div className="container pd-container">
        <div className="pd-grid">
          {/* MEDIA */}
          <section className="pd-media card shadow-hover pd-media-sticky">
            <div
              className="pd-mediaMain"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {compareAt > price && <div className="pd-discount-badge">OFERTA</div>}

              {images.length > 0 ? (
                <img
                  className="pd-mainImg"
                  src={images[activeImgIndex]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  decoding="async"
                  fetchPriority={activeImgIndex === 0 ? "high" : "auto"}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                />
              ) : (
                <div className="pd-empty">Sin imagen</div>
              )}

              {images.length > 1 && (
                <>
                  <button type="button" className="pd-arrow pd-arrow-left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                    ‹
                  </button>
                  <button type="button" className="pd-arrow pd-arrow-right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                    ›
                  </button>
                </>
              )}

              {images.length > 1 && (
                <div className="pd-dots-container">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pd-dot ${idx === activeImgIndex ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImgIndex(idx);
                      }}
                      aria-label={`Ver imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* THUMBS */}
            <div className="pd-thumbs-desktop">
              {images.slice(0, 5).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt="thumb" loading="lazy" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                </button>
              ))}
            </div>
          </section>

          {/* INFO */}
          <aside className="pd-info fade-in-section">
            <div className="hero-top">
              <div className="gift-banner">
                <span className="gift-banner-ico">🎁</span> BONUS ACTIVADO: 2do Mando GRATIS
              </div>

              <div className="hero-proof">
                <span className="hero-pill-hot pulse-animation">🔥 Viral en TikTok</span>
                <div className="hero-proofText">
                  <b>{Number(soldCount).toLocaleString("es-AR")}</b> unidades vendidas
                </div>
              </div>

              <h1 className="hero-title">{product.name}</h1>

              <div className="hero-ratingRow">
                <Stars />
                <a href="#reviews-section" onClick={scrollToReviews} className="hero-reviews hero-reviews-link">
                  Ver opiniones
                </a>
              </div>

              <p className="hero-mini-desc">{MARKETING_CONTENT.miniDescription}</p>

              <div className="price-block-container shadow-hover">
                <div className="main-price-row">
                  <span className="hero-price">{formatARS(displayTotal)}</span>

                  {compareAt > price && (
                    <>
                      <span className="hero-compare">{formatARS(compareAt * totalQty)}</span>
                      <span className="hero-pill-off">AHORRAS {Math.round((1 - price / compareAt) * 100)}%</span>
                    </>
                  )}
                </div>

                <div className="transfer-card">
                  <div className="transfer-icon">⚡</div>
                  <div className="transfer-text">
                    <div className="transfer-label">O pagando con Transferencia:</div>
                    <div className="transfer-amount">
                      {formatARS(transferPrice)} <span className="transfer-tag">10% OFF EXTRA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pd-trust-icons">
                <div className="trust-icon-item">
                  <span>🛡️</span> Garantía asegurada
                </div>
                <div className="trust-icon-item">
                  <span>🚚</span> Envío Gratis
                </div>
                <div className="trust-icon-item">
                  <span>🎁</span> Regalo Incluido
                </div>
              </div>
            </div>

            <div className="pd-divider pd-divider--mt">Elegí tu opción</div>

            <div className="pd-bundles pd-bundles-pro">
              {/* OPCIÓN 1 */}
              <label className={`pd-bundleCard ${bundle === 1 ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="bundle"
                  checked={bundle === 1}
                  onChange={() => { setBundle(1); setQty(1); }}
                />

                <span className="pd-radio" aria-hidden="true" />
                <div className="pd-bundleContent">
                  <div className="pd-bundleTop">
                    <div className="pd-bundleTitle">
                      1 Consola <span className="pd-tag">Esencial</span>
                    </div>
                    <div className="pd-bundlePrice">{moneyARS(unitPrice)}</div>
                  </div>

                  <div className="pd-bundleSub">
                    Incluye un mando de regalo 🎁
                  </div>

                  <div className="pd-bundleBottom">
                    <span className="pd-miniBenefit">✅ Envío gratis</span>
                    <span className="pd-miniBenefit">✅ Cable incluido</span>
                  </div>
                </div>
              </label>

              {/* OPCIÓN 2 */}
              <label className={`pd-bundleCard ${bundle === 2 ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="bundle"
                  checked={bundle === 2}
                  onChange={() => { setBundle(2); setQty((q) => (q < 2 ? 2 : q)); }}
                />

                <span className="pd-radio" aria-hidden="true" />
                <div className="pd-bundleContent">
                  <div className="pd-bundleTop">
                    <div className="pd-bundleTitle">
                      Pack Regalo (2 u.)
                      <span className="pd-tag hot">Mejor valor</span>
                    </div>

                    <div className="pd-bundlePrice">
                      {moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}
                      <div className="pd-bundleCompare">{moneyARS(unitPrice * 2)}</div>
                    </div>
                  </div>

                  <div className="pd-bundleSub">
                    Ahorrás <b>{pack2Discount}%</b> • Ideal casa / regalo o trabajo
                  </div>

                  <div className="pd-bundleBottom">
                    <span className="pd-miniBenefit">🔥 Más conveniente</span>
                    <span className="pd-miniBenefit">✅ Envío gratis</span>
                  </div>
                </div>
              </label>

              <div className="pd-bundleHint">
                Tip: si elegís <b>Pack Regalo</b>, te queda 1 en casa y 1 para regalar (o una en el trabajo).
              </div>
            </div>


            <div className="scarcity-text scarcity-text--spaced">
              <span className="scarcity-icon">⚠️</span> ¡Quedan pocas unidades por alta demanda!
            </div>

            <div className="pd-ctaBlock">
              <button className="pd-ctaSecondary btn-breathing-intense" type="button" onClick={handleBuyNow} disabled={redirecting}>
                {redirecting ? "PROCESANDO PAGO..." : "COMPRAR Y RECLAMAR REGALO"}
              </button>

              <div className="pd-addToCartWrap">
                <button type="button" onClick={handleAddToCart} className="pd-ctaPrimary-outline">
                  Agregar al carrito
                </button>
              </div>
            </div>

            <div className="accordion-wrapper">
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsDescExpanded(!isDescExpanded)} type="button">
                  <span>Ficha Técnica</span>
                  <span>{isDescExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isDescExpanded ? "open" : ""}`}>
                  <p>{product.description || MARKETING_CONTENT.miniDescription}</p>

                  <div className="muted pd-shipNote">
                    🚚 <strong>Envío Rápido:</strong> Despachamos en 24hs.
                  </div>

                  <ul className="pd-specs-list">
                    {product.specs &&
                      Object.entries(product.specs).map(([key, val]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {val}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsShippingExpanded(!isShippingExpanded)} type="button">
                  <span>Envíos y Garantía</span>
                  <span>{isShippingExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isShippingExpanded ? "open" : ""}`}>
                  <ul className="pd-ship-list">
                    <li>
                      <strong>Envío Gratis:</strong> A todo el país (Correo Arg / Andreani).
                    </li>
                    <li>
                      <strong>Garantía Oficial:</strong> 90 días por fallas.
                    </li>
                    <li>
                      <strong>Compra Protegida:</strong> Tu dinero seguro con Mercado Pago.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* RESTO DE SECCIONES */}
        <div className="pd-sections">
          <ClinicalStatsSection />
          <AuthoritySection />
          <BreakthroughSection />
          <BeforeAfterSlider />
          <ComparisonTable />
          <ProblemSolutionSection />
          <WhatsIncludedSection />
          <BigMediaSection />
          <FaqSection />
          <TestimonialsSection />
        </div>
      </div>

      {showToast && (
        <div className="pd-toast-wrapper">
          <div className="pd-toast-content">
            <div className="pd-toast-main">
              <img src={images[0] || FALLBACK_IMG} alt="" className="pd-toast-img" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              <div className="pd-toast-info">
                <span className="pd-toast-status">✓ ¡Agregado!</span>
                <span className="pd-toast-name">{product.name}</span>
              </div>
              <button className="pd-toast-close" onClick={() => setShowToast(false)} type="button">
                ✕
              </button>
            </div>

            <div className="pd-toast-actions">
              <button className="pd-toast-btn-secondary" onClick={() => navigate("/cart")} type="button">
                IR AL CARRITO
              </button>
              <button className="pd-toast-btn-primary" onClick={() => navigate("/checkout")} type="button">
                FINALIZAR COMPRA
              </button>
            </div>
            <div className="pd-toast-progress"></div>
          </div>
        </div>
      )}

      {/* STICKY BAR */}
      <div className="sticky-mobile-bar-pro fade-in-section">
        <div className="sticky-pro-left">
          <span className="sticky-pro-label">Oferta termina en:</span>
          <div className="sticky-pro-price-row">
            <span className="sticky-timer-red">
              <CountdownTimer />
            </span>
          </div>
        </div>

        <button className="sticky-pro-btn btn-breathing" onClick={handleBuyNow} disabled={redirecting} type="button">
          {redirecting ? "..." : "COMPRAR"}
        </button>
      </div>
    </main>
  );
}
