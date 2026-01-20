import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

/* ========================================================================
   MARKETING CONTENT (ANTENA TDA 4K)
   ======================================================================== */
const MARKETING_CONTENT = {
  miniDescription:
    "¿Seguís pagando fortunas por ver la tele? Cortá con los gastos fijos. Con la Antena TDA 4K Power-50, accedés a todos los canales de aire (Telefe, El Trece, TV Pública, Deportv y más) en calidad Full HD 1080p y 4K totalmente GRATIS. Gracias a su ganancia de 50 dBi y su cable extra-largo de 5 metros, capta señal donde otras no llegan. Conectala, escaneá y disfrutá.",

  heroBullets: [
    "📺 Canales HD y 4K GRATIS de por vida.",
    "🚀 Potencia Extrema 50 dBi (Mejor señal).",
    "🔌 Cable de 5 Metros (Llega a la ventana).",
    "🧲 Base Magnética de alta adherencia.",
    "🌦️ Apta Interior y Exterior (Resiste lluvia).",
    "✅ Sin contratos ni mensualidades.",
  ],

  stats: [
    { pct: "100%", text: "Gratis Mensual" },
    { pct: "50 dBi", text: "Alta Potencia" },
    { pct: "4K", text: "Soporte UHD" },
  ],

  whatsIncluded: [
    { name: "Antena TDA 50 dBi", icon: "📡" },
    { name: "Cable Coaxial 5m", icon: "🔌" },
    { name: "Adaptador Fichas", icon: "⚙️" },
    { name: "Base Magnética", icon: "🧲" },
  ],

  breakthroughBenefits: {
    title: "Televisión Premium, Costo Cero",
    subtitle: "La solución definitiva para ver la tele sin pagar abonos.",
    items: [
      {
        title: "Chau Facturas",
        desc: "Nunca más pagues un abono mensual por ver los canales de aire nacionales.",
        icon: "💸",
      },
      {
        title: "Señal Donde Sea",
        desc: "Con 5 metros de cable, podés ponerla cerca de la ventana o afuera para máxima señal.",
        icon: "📡",
      },
      {
        title: "Calidad Cristalina",
        desc: "Soporta transmisiones en 1080p y 4K. Olvídate de la 'lluvia' o imagen borrosa.",
        icon: "💎",
      },
      {
        title: "Base Magnética",
        desc: "Se pega firmemente a cualquier metal o detrás de la TV. Queda fija y prolija.",
        icon: "🧲",
      },
      {
        title: "Todo Terreno",
        desc: "Diseñada para interiores, pero sellada para aguantar lluvia en exteriores.",
        icon: "🌧️",
      },
      {
        title: "Instalación Fácil",
        desc: "Es conectar la ficha al TV, poner 'Búsqueda de Canales' y listo.",
        icon: "⚡",
      },
    ],
  },

  slider: {
    title: "Señal Analógica vs. Digital",
    text: "La diferencia es abismal. Pasá de ver con lluvia a ver en HD puro.",
    labelBefore: "Antena Vieja (Lluvia)",
    labelAfter: "Antena TDA 4K (Full HD)",
    imgBefore:
      "https://pbs.twimg.com/media/G_FUDEBWYAA03b0?format=jpg&name=360x360", // Estática/Lluvia
    imgAfter:
      "https://pbs.twimg.com/media/G_FUB7oWkAAHb9e?format=jpg&name=360x360", // TV Clara
  },

  comparison: {
    title: "Nuestra Antena vs. Cable",
    text: "Hacé la cuenta de cuánto ahorrás al año.",
    brandName: "Antena TDA 4K",
    competitorName: "Empresa de Cable",
    features: [
      { name: "Costo Mensual $0", us: true, others: false },
      { name: "Calidad Full HD / 4K", us: true, others: true },
      { name: "Sin Contratos", us: true, others: false },
      { name: "Portátil (Llevála de viaje)", us: true, others: false },
      { name: "Instalación en 1 minuto", us: true, others: false },
    ],
  },

  authority: {
    title: "Instalador de TV y Redes",
    quote:
      "Mucha gente gasta fortunas en cable solo para ver el noticiero y fútbol de aire. Esta antena de 50 dBi es la más potente que probé de las portátiles. El cable de 5 metros hace toda la diferencia para agarrar señal.",
    name: "Martín G.",
    job: "Técnico en Telecomunicaciones",
    img: "https://images.pexels.com/photos/3862627/pexels-photo-3862627.jpeg?auto=compress&cs=tinysrgb&w=600",
  },

  faq: [
    {
      q: "¿Sirve para cualquier TV?",
      a: "Funciona directo en cualquier TV LED/Smart fabricado después de 2014 (que ya traen sintonizador TDA integrado). Si tenés una TV 'de tubo' muy vieja, necesitás un decodificador aparte.",
    },
    {
      q: "¿Qué canales agarra?",
      a: "Depende de tu zona, pero generalmente: Telefe HD, El Trece HD, América, Canal 9, TV Pública, Deportv, Encuentro, C5N, LN+, etc.",
    },
    {
      q: "¿Necesito internet o WiFi?",
      a: "NO. Funciona satelitalmente con las torres de transmisión de aire. No consume datos ni internet.",
    },
    {
      q: "¿El cable es largo?",
      a: "Sí, trae 5 metros de cable coaxial reforzado, ideal para alejarla de la TV y acercarla a una ventana para mejor señal.",
    },
    {
      q: "¿Sirve para el Mundial/Fútbol?",
      a: "Sí, podés ver todos los partidos que transmita la TV Pública o canales de aire en HD sin delay.",
    },
  ],

  trustBadges: {
    payment: [], // Se usan los íconos por defecto
    shipping: "Envío Rápido a todo el país",
    security: "Garantía de Recepción.",
  },
};

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="24" fill="#cbd5e1">
      Antena 50dBi
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
        <h3 className="landing-center-title">Tecnología de Punta</h3>
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

// ✅ NUEVA SECCIÓN: PAIN POINT (Sustituye a Big Media y va arriba)
function PainPointSection() {
  return (
    <div className="landing-section pain-point-bg fade-in-section">
      <div className="landing-container split-layout">
        <div className="split-text">
          <div className="pain-label">⚠️ ATENCIÓN</div>
          <h2 className="pain-title">¿CANSADO DE REGALAR TU DINERO EN RECIBOS DE CABLE?</h2>

          <p className="pain-text">
            Olvídate de las facturas a fin de mes. Con nuestra <b>Antena Premium</b>, el entretenimiento es 100% GRATIS y LEGAL.
          </p>

          <p className="pain-text">
            ¿Por qué seguir pagando por algo que puedes tener <b>GRATIS</b>? Potencia, Calidad y Definición 4K en un solo dispositivo.
          </p>

          <div className="pain-benefits">
            <div className="pain-benefit-item">
              <span>🚫</span> Sin técnicos
            </div>
            <div className="pain-benefit-item">
              <span>🚫</span> Sin herramientas
            </div>
            <div className="pain-benefit-item">
              <span>🛠️</span> Sin complicaciones
            </div>
          </div>
        </div>

        <div className="split-media">
          {/* Imagen/GIF simulado de cortar el cable o TV gratis */}
          <div className="pain-media-container shadow-hover">
            <img
              src="https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Libertad de TV"
              className="pain-img"
            />
            <div className="pain-overlay-badge">
              💸 Ahorro Garantizado
            </div>
          </div>
        </div>
      </div>

      {/* Estilos locales para esta sección */}
      <style>{`
        .pain-point-bg {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }
        .pain-label {
            background: #dc2626;
            color: white;
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 0.8rem;
            margin-bottom: 12px;
            letter-spacing: 0.05em;
        }
        .pain-title {
            font-size: 2rem;
            font-weight: 900;
            color: #1e293b;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
        }
        .pain-text {
            font-size: 1.1rem;
            color: #475569;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        .pain-benefits {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 1.5rem;
        }
        .pain-benefit-item {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 700;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .pain-media-container {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
        }
        .pain-img {
            width: 100%;
            height: auto;
            display: block;
        }
        .pain-overlay-badge {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 10px;
            font-weight: 800;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        @media (max-width: 768px) {
            .pain-title { font-size: 1.5rem; }
        }
      `}</style>
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
        <h3 className="landing-center-title">Contenido de la Caja</h3>
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
          <span className="badge-pill">Calidad de Imagen</span>
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

function ProblemSolutionSection() {
  return (
    <div className="landing-section fade-in-section">
      <div className="landing-container split-layout reverse-mobile">
        <div className="split-text">
          <span className="badge-pill">Ahorro Inteligente</span>
          <h3 className="landing-title">¿Por qué pasarte a TDA?</h3>
          <p className="landing-p">
            La televisión de aire evolucionó. Ya no es "agarrar mal". Ahora es digital, HD y totalmente gratis.
          </p>

          <div className="tech-list">
            <div className="tech-item hover-lift">
              <div className="tech-icon">💸</div>
              <div>
                <strong>Ahorro Total</strong>
                <p>Dejá de tirar plata en servicios de cable que casi no usás.</p>
              </div>
            </div>

            <div className="tech-item hover-lift">
              <div className="tech-icon">🔭</div>
              <div>
                <strong>Largo Alcance</strong>
                <p>El cable de 5mts te permite buscar la señal perfecta.</p>
              </div>
            </div>

            <div className="tech-item hover-lift">
              <div className="tech-icon">📺</div>
              <div>
                <strong>Universal</strong>
                <p>Compatible con cualquier TV moderno sin aparatos extra.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="split-media ps-split-media">
          <div className="gift-card hover-lift" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
            <h3 className="gift-card-title">¡Pack Casa Completa! 🏠</h3>
            <p className="gift-card-text">
              Llevando 2 unidades (una para el living, otra para la habitación) tenés un
              <b> 10% de DESCUENTO EXTRA</b>.
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
      author: "Carlos M.",
      location: "San Martín, GBA",
      rating: 5,
      verified: true,
      title: "Chau Cablevisión",
      text:
        "Me cansé de que me aumenten todos los meses. Compré esta antena, la pegué atrás de la tele con el imán y agarró como 30 canales en HD. Telefe y el Trece se ven mejor que con el deco.",
      image: null,
    },
    {
      date: "Hace 4 días",
      author: "Romina S.",
      location: "Caballito, CABA",
      rating: 5,
      verified: true,
      title: "Funciona perfecto en departamento",
      text:
        "Vivo en un 3er piso interno y tenía miedo que no agarre. El cable largo me salvó, la acerqué a la ventana y listo. Imagen 10 puntos.",
      image: null,
    },
    {
      date: "Hace 1 semana",
      author: "Gustavo P.",
      location: "La Plata",
      rating: 4,
      verified: true,
      title: "Buena potencia",
      text:
        "Probé una antena barata antes y se cortaba. Esta tiene una base pesada y se nota que tiene más potencia. Agarro canales de deportes y noticias sin drama.",
      image: null,
    },
    {
      date: "Hace 1 semana",
      author: "Mariana L.",
      location: "Córdoba Capital",
      rating: 5,
      verified: true,
      title: "Fácil de instalar",
      text:
        "Literalmente la enchufé y puse autoprogramación. En 5 minutos estaba viendo la novela en HD. Recomendada.",
      image: null,
    },
    {
      date: "Hace 2 semanas",
      author: "Esteban R.",
      location: "Rosario",
      rating: 5,
      verified: true,
      title: "Excelente para el mundial",
      text:
        "La compré para ver los partidos sin el delay de internet y es un caño. Cero cortes.",
      image: null,
    },
    {
      date: "Hace 3 semanas",
      author: "Fernanda T.",
      location: "Tigre",
      rating: 4,
      verified: true,
      title: "Buen producto",
      text:
        "Llegó rápido. La calidad de los materiales se ve buena, el cable es grueso. Lo único es que hay que buscarle la ubicación justa, pero una vez que la encontrás, vuela.",
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
              <span className="rh-big-score">4.7</span>
              <div className="rh-stars-col">
                <span className="rh-stars">★★★★★</span>
                <span className="rh-count">Base en 843 opiniones</span>
              </div>
            </div>
          </div>

          <div className="rh-right">
            <div className="rh-bar-row">
              <span className="rh-star-label">5 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w80"></div>
              </div>
              <span className="rh-pct">80%</span>
            </div>
            <div className="rh-bar-row">
              <span className="rh-star-label">4 ★</span>
              <div className="rh-bar-bg">
                <div className="rh-bar-fill w15"></div>
              </div>
              <span className="rh-pct">15%</span>
            </div>
            {/* Barras menores... */}
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
      <span className="hero-ratingText">4.8/5</span>
    </div>
  );
}

function moneyARS(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}
function ChannelLogosSection() {
  // Usamos dominios oficiales para obtener los logos automáticamente
  const channels = [
    { name: "Telefe", url: "https://logo.clearbit.com/telefe.com" },
    { name: "El Trece", url: "https://logo.clearbit.com/eltrecetv.com.ar" },
    { name: "TN", url: "https://logo.clearbit.com/tn.com.ar" },
    { name: "TV Pública", url: "https://www.google.com/s2/favicons?domain=tvpublica.com.ar&sz=128" }, // Google Backup
    { name: "América TV", url: "https://logo.clearbit.com/americatv.com.ar" },
    { name: "Canal 9", url: "https://logo.clearbit.com/elnueve.com.ar" },
    { name: "Cine.Ar", url: "https://www.google.com/s2/favicons?domain=cine.ar&sz=128" }, // Google Backup
    { name: "Deportv", url: "https://www.google.com/s2/favicons?domain=deportv.gov.ar&sz=128" },
  ];

  return (
    <div className="landing-section fade-in-section" style={{ padding: '2.5rem 0', background: '#ffffff' }}>
      <div className="landing-container">

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <p className="landing-center-subtitle" style={{
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontWeight: 800,
            color: '#94a3b8',
            marginBottom: '10px'
          }}>
            GRILLA DE CANALES DIGITALES
          </p>
          <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>
            Cine, Deportes y Noticias <span style={{ color: '#10b981' }}>en Full HD</span>
          </h3>
        </div>

        <div className="channel-grid">
          {channels.map((c, i) => (
            <div key={i} className="channel-item" title={c.name}>
              {/* Intentamos cargar la imagen, si falla mostramos texto */}
              <img
                src={c.url}
                alt={c.name}
                className="channel-img"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'; // Oculta imagen rota
                  e.target.nextSibling.style.display = 'block'; // Muestra texto
                }}
              />
              <span className="channel-fallback-text" style={{ display: 'none' }}>{c.name}</span>
            </div>
          ))}

          {/* Item Extra: "+30 Canales" */}
          <div className="channel-item more-channels">
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>+30</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Señales<br />Más</span>
          </div>
        </div>
      </div>

      <style>{`
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          align-items: center;
          justify-items: center;
          max-width: 900px;
          margin: 0 auto;
        }
        .channel-item {
          width: 100%;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .channel-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          background: #fff;
          border-color: #cbd5e1;
        }
        .channel-img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          filter: grayscale(100%);
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        .channel-item:hover .channel-img {
          filter: grayscale(0%);
          opacity: 1;
        }
        .channel-fallback-text {
            font-size: 0.8rem;
            font-weight: 800;
            color: #475569;
            text-align: center;
            line-height: 1.2;
        }
        .more-channels {
           display: flex;
           gap: 8px;
           background: #eef2ff;
           border: 1px dashed #818cf8;
        }

        @media (max-width: 768px) {
          .channel-grid {
             grid-template-columns: repeat(3, 1fr);
             gap: 12px;
          }
          .channel-item {
             height: 55px;
             padding: 8px;
          }
        }
      `}</style>
    </div>
  );
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
    (price ? Math.round(price * 1.50) : 0); // Mark-up más alto para este producto
  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 2105;

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
      "ANTENA_TDA_4K",
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

  // ✅ LOGICA DE COMPRA
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

    setTimeout(() => {
      navigate('/checkout');
    }, 500);
  };

  // ✅ LOGICA AGREGAR AL CARRITO
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
  // Lógica para el mensaje de envío
  const getShippingMessage = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Domingo, 6 = Sábado

    // Si es fin de semana, ponemos algo genérico para no mentir
    if (day === 0 || day === 6) return "Llega el Lunes/Martes";

    // Si es día de semana antes de las 3 PM
    if (hour < 15) return "Llega Mañana";

    // Si ya pasó el corte del correo
    return "Despacho Inmediato";
  };

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
              <div className="gift-banner" style={{ background: '#10b981', color: 'white' }}>
                <span className="gift-banner-ico">✅</span> STOCK DISPONIBLE: ENVÍO INMEDIATO
              </div>

              <div className="hero-proof">
                <span className="hero-pill-hot pulse-animation">🔥 Tendencia en Hogar</span>
                <div className="hero-proofText">
                  <b>{Number(soldCount).toLocaleString("es-AR")}</b> personas dejaron de pagar cable
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
              {/* === NUEVO AVISO DE ENVÍO === */}
              <div className="shipping-notice-card">
                <div className="shipping-icon-box">
                  <span className="shipping-icon">⚡</span>
                </div>
                <div className="shipping-text-col">
                  <div className="shipping-title">
                    <span className="shipping-highlight">Full</span> {getShippingMessage()}
                  </div>
                  <div className="shipping-subtitle">
                    Comprando dentro de las próximas <b>2 horas</b>
                  </div>
                </div>
              </div>
              {/* ============================ */}

              <div className="pd-trust-icons">
                <div className="trust-icon-item">
                  <span>📡</span> Señal HD
                </div>
                <div className="trust-icon-item">
                  <span>🚚</span> Envío Gratis
                </div>
                <div className="trust-icon-item">
                  <span>💰</span> Ahorro Total
                </div>
              </div>
            </div>

            <div className="pd-divider pd-divider--mt">Elegí tu Pack</div>

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
                      1 Antena <span className="pd-tag">Pack Living</span>
                    </div>
                    <div className="pd-bundlePrice">{moneyARS(unitPrice)}</div>
                  </div>

                  <div className="pd-bundleSub">
                    Ideal para probar o para 1 TV
                  </div>

                  <div className="pd-bundleBottom">
                    <span className="pd-miniBenefit">✅ Envío gratis</span>
                    <span className="pd-miniBenefit">✅ Base + Cable 5m</span>
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
                      Pack Casa Completa (2 u.)
                      <span className="pd-tag hot">Oferta</span>
                    </div>

                    <div className="pd-bundlePrice">
                      {moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}
                      <div className="pd-bundleCompare">{moneyARS(unitPrice * 2)}</div>
                    </div>
                  </div>

                  <div className="pd-bundleSub">
                    Llevate 2 (Living + Cuarto) con <b>10% OFF</b>
                  </div>

                  <div className="pd-bundleBottom">
                    <span className="pd-miniBenefit">🔥 El más elegido</span>
                    <span className="pd-miniBenefit">✅ Envío gratis</span>
                  </div>
                </div>
              </label>

              <div className="pd-bundleHint">
                Tip: La mayoría lleva el <b>Pack Casa Completa</b> para tener señal en el cuarto y el comedor.
              </div>
            </div>


            <div className="scarcity-text scarcity-text--spaced">
              <span className="scarcity-icon">⚠️</span> ¡Quedan pocas unidades por alta demanda!
            </div>

            <div className="pd-ctaBlock">
              <button className="pd-ctaSecondary btn-breathing-intense" type="button" onClick={handleBuyNow} disabled={redirecting}>
                {redirecting ? "PROCESANDO..." : "COMPRAR Y AHORRAR"}
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
                    {/* Specs hardcodeadas si faltan en DB */}
                    {!product.specs && (
                      <>
                        <li><strong>Ganancia:</strong> 50 dBi</li>
                        <li><strong>Largo Cable:</strong> 5 Metros</li>
                        <li><strong>Resolución:</strong> 4K / 1080p</li>
                        <li><strong>Conector:</strong> Coaxial Universal</li>
                        <li><strong>Uso:</strong> Interior / Exterior</li>
                      </>
                    )}
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
                      <strong>Garantía de Señal:</strong> Si no te funciona, tenés devolución gratis.
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
          {/* ✅ AQUÍ ESTÁ LA NUEVA SECCIÓN DE "DOLOR" AL PRINCIPIO */}
          <PainPointSection />
          <ChannelLogosSection />
          <AuthoritySection />
          <BreakthroughSection />
          <BeforeAfterSlider />
          <ComparisonTable />
          <ProblemSolutionSection />
          <WhatsIncludedSection />
          {/* ❌ BIG MEDIA ELIMINADO */}
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

      <style>{`
        .pd-toast-wrapper {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            animation: slideInToast 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pd-toast-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03);
            padding: 16px;
            border-radius: 18px;
            width: 320px;
            max-width: 90vw;
        }
        .pd-toast-main {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .pd-toast-img {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            object-fit: cover;
            background: #f1f5f9;
        }
        .pd-toast-info {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .pd-toast-status {
            font-size: 0.8rem;
            font-weight: 800;
            color: #10b981;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .pd-toast-name {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 180px;
        }
        .pd-toast-close {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0 4px;
        }
        .pd-toast-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .pd-toast-btn-primary, .pd-toast-btn-secondary {
            border: none;
            border-radius: 10px;
            padding: 10px;
            font-size: 0.75rem;
            font-weight: 800;
            cursor: pointer;
            text-align: center;
            transition: transform 0.1s;
        }
        .pd-toast-btn-primary {
            background: #0B5CFF;
            color: white;
            box-shadow: 0 4px 12px rgba(11, 92, 255, 0.2);
        }
        .pd-toast-btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }
        .pd-toast-btn-primary:active, .pd-toast-btn-secondary:active {
            transform: scale(0.96);
        }
        .pd-toast-progress {
            height: 3px;
            background: #10b981;
            width: 0%;
            margin-top: 10px;
            border-radius: 2px;
            animation: toastProgress 5s linear forwards;
        }
        @keyframes slideInToast {
            from { opacity: 0; transform: translateY(-20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
        @media (max-width: 600px) {
            .pd-toast-wrapper {
            top: auto;
            bottom: 20px;
            right: 20px;
            left: 20px;
            width: auto;
            display: flex;
            justify-content: center;
            }
            .pd-toast-content {
            width: 100%;
            }
        }
        .pd-discount-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #dc2626;
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 0.8rem;
            z-index: 10;
        }
        .sticky-timer-red {
            color: #dc2626;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
        }
            .shipping-notice-card {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #f0fdf4; /* Verde muy suave */
            border: 1px solid #bbf7d0;
            padding: 12px 16px;
            border-radius: 12px;
            margin-top: 15px;
            margin-bottom: 15px;
            animation: fadeIn 0.5s ease;
        }

        .shipping-icon-box {
            background: #dcfce7;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .shipping-icon {
            font-size: 1.2rem;
            animation: pulseGreen 2s infinite;
        }

        .shipping-text-col {
            display: flex;
            flex-direction: column;
        }

        .shipping-title {
            font-size: 0.95rem;
            font-weight: 800;
            color: #166534; /* Verde oscuro */
            line-height: 1.2;
        }

        .shipping-highlight {
            font-style: italic;
            font-weight: 900;
            text-transform: uppercase;
            color: #16a34a;
        }

        .shipping-subtitle {
            font-size: 0.8rem;
            color: #15803d;
            opacity: 0.9;
        }

        @keyframes pulseGreen {
            0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
            100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
      `}</style>
    </main>
  );
}