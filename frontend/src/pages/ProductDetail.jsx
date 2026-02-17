// frontend/src/pages/ProductDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";
import Marquee from "../components/marquee.jsx";

/* ========================================================================
   MARKETING CONTENT — EDITABLE
   ======================================================================== */
const MARKETING_CONTENT = {
  miniDescription:
    "Tu cepillo queda al aire… y eso es un imán de gérmenes. Con el Porta Cepillo Dispenser Esterilizador mantenés los cepillos protegidos y más limpios entre usos, reduciendo el contacto con bacterias del baño. Además, te deja la pasta lista con un solo toque: más orden, más higiene y cero complicaciones..",

  trustBullets: [
    "🦷 Reduce bacterias, gérmenes y humedad",
    "⚡ Dispenser automático sin contacto",
    "🔋 Recargable",
    "🚚 Envío gratis a todo el país",
  ],

  whatsIncluded: [],

  storyBlocks: [
    {
      title: "CUIDA A LOS MAS IMPORTANTES PARA VOS",
      text:
        "Para los que querés de verdad, querés soluciones simples que sumen todos los días. Este porta cepillo ayuda a mantener los cepillos más protegidos, ordenados y listos para usar, sin complicaciones. Ideal para hijos, pareja o familiares que comparten baño: más higiene, más tranquilidad.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_950983-MLA104372170273_012026-F.webp",
      badge: "",
    },
    {
      title: "Tu cepillo no debería quedar expuesto",
      text:
        "Nada peor que dejar el cepillo “al aire”, juntando polvo y salpicaduras sin darte cuenta. Con el esterilizador, el cabezal queda más protegido y más higiénico para el próximo uso. Es tranquilidad diaria, sin pensarla.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_605052-MLA92075696569_092025-F.webp",
      badge: "",
    },
    {
      title: "Orden en el baño, rutina más simple",
      text:
        "Cuando cada cosa tiene su lugar, todo fluye: cepillos colgados, pasta integrada y baño más prolijo. Ideal para casa, depto, familia o compartir baño: queda bien, ocupa poco y te simplifica la mañana y la noche.",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_918000-MLA92075728129_092025-F.webp",
      badge: "",
    },
  ],

  certificate: {
    title: "COMPRA CON CONFIANZA",
    logoUrl:
      "https://static.vecteezy.com/system/resources/thumbnails/024/097/948/small/certification-of-authenticity-badge-100-percentoriginal-product-stamp-logo-sticker-patch-round-emblem-retro-vintage-hipster-illustration-vector.jpg",
    items: [
      { icon: "🔒", text: "Pago seguro (Mercado Pago)" },
      { icon: "✅", text: "Compra protegida" },
      { icon: "📦", text: "Seguimiento de envío" },
      { icon: "🤝", text: "Soporte por WhatsApp" },
    ],
  },

  comparison: {
    title: "ANTES VS DESPUÉS",
    cols: ["ANTES (SIN EL 3 EN 1)", "DESPUÉS (CON EL 3 EN 1)"],
    rows: [
      { k: "Orden en el baño", a: "Cepillos y pasta sueltos / desorden", b: "Todo en un solo lugar, prolijo" },
      { k: "Uso diario", a: "Apretás el tubo con la mano (se ensucia)", b: "Presionás el cepillo y sale la pasta" },
      { k: "Limpieza", a: "Salpicaduras / restos alrededor", b: "Menos mugre, más fácil de limpiar" },
      { k: "Ahorro de pasta", a: "Sale de más y se desperdicia", b: "Dosificación más pareja" },
      { k: "Espacio", a: "Ocupa lugar en la mesada", b: "Liberás espacio (todo compacto)" },
    ],
  },

  howTo: {
    title: "CÓMO SE USA",
    image: {
      url: "https://http2.mlstatic.com/D_NQ_NP_2X_730119-MLA92075368185_092025-F.webp",
      alt: "Cómo se usa la antena en 3 pasos",
    },
  },

  faqTitle: "PREGUNTAS FRECUENTES",
  faq: [
    {
      q: "¿Cómo se instala?",
      a: "Se pega a la pared con adhesivo (sin perforar). Limpiá bien la superficie, pegalo, presioná unos segundos y dejalo asentar antes de usar.",
    },
    {
      q: "¿Sirve para cualquier cepillo dental?",
      a: "Sí, es compatible con la mayoría de cepillos manuales y muchos eléctricos (según tamaño del mango).",
    },
    {
      q: "¿Cómo funciona la esterilización?",
      a: "El esterilizador ayuda a mantener el cabezal del cepillo más protegido del ambiente. En algunos modelos se activa automáticamente al cerrar la tapa.",
    },
    {
      q: "¿Hay que cargarlo? ¿Cuánto dura la batería?",
      a: "Depende del modelo: algunos son recargables por USB y otros usan pilas. En uso normal suele durar varios días/semanas antes de necesitar carga/cambio.",
    },
    {
      q: "¿Incluye la pasta dental o el cepillo?",
      a: "No, el producto es el porta cepillos con dispenser/esterilizador. La pasta y los cepillos se venden por separado.",
    },
    {
      q: "¿El dispenser sirve para cualquier pasta?",
      a: "Funciona con la mayoría de pastas en tubo estándar. Solo colocás el pico del tubo en el adaptador y presionás el cepillo para dosificar.",
    },
    {
      q: "¿Se puede usar en baño con humedad?",
      a: "Sí, está pensado para baño. Igual, para que el adhesivo quede firme, instalalo sobre una superficie lisa y bien seca.",
    },
    {
      q: "¿Cómo se limpia?",
      a: "Pasale un paño húmedo por fuera y, cada tanto, retirás los accesorios lavables para enjuagar y secar antes de volver a colocar.",
    },
  ],

  reviewsTitle: "TESTIMONIOS",
  reviewsSubtitle: "Esto dicen nuestros clientes",
  reviewsCarousel: [
    {
      title: "MÁS HIGIÉNICO",
      rating: 5,
      text:
        "Antes los cepillos quedaban expuestos todo el día. Con esto quedan más protegidos y el baño se siente más limpio en general.",
      name: "Carla Benítez",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_847065-MLA93209847143_092025-F.webp",
    },
    {
      title: "SE NOTA EL CAMBIO",
      rating: 5,
      text:
        "Me daba cosa tener los cepillos a la intemperie. Ahora quedan guardados y siento que ayuda a mantener mejor la higiene diaria.",
      name: "Julián Rivas",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_827742-MLA97357658814_112025-F.webp",
    },
    {
      title: "CEPILLOS MÁS PROTEGIDOS",
      rating: 5,
      text:
        "Lo compré por un tema de higiene. Quedó todo más ordenado pero lo principal es que los cepillos no quedan expuestos.",
      name: "Romina Sosa",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_914883-MLA104359225539_012026-F.webp",
    },
    {
      title: "ME DEJÓ TRANQUILO",
      rating: 5,
      text:
        "Soy bastante obsesivo con la limpieza del baño. Tener los cepillos resguardados me deja mucho más tranquilo con la higiene.",
      name: "Nicolás Ferreira",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_991593-MLA97567338889_112025-F.webp",
    },
    {
      title: "AYUDA EN CASA",
      rating: 4,
      text:
        "En casa somos varios y los cepillos quedaban todos juntos. Ahora están separados y más protegidos. Eso era lo que buscaba.",
      name: "Micaela Páez",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_681590-MLA97122685113_112025-F.webp",
    },
    {
      title: "BAÑO MÁS LIMPIO",
      rating: 5,
      text:
        "Me gustó porque mantiene los cepillos lejos de salpicaduras. No es magia, pero claramente ayuda a mantener mejor la higiene.",
      name: "Sergio Ledesma",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_604768-MLA105021350975_012026-F.webp",
    },
    {
      title: "BUENA IDEA",
      rating: 5,
      text:
        "No quería seguir dejando los cepillos en un vaso. Con esto quedan guardados y siento que es una mejora real para la higiene.",
      name: "Lucía Giménez",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_615857-MLA104463732564_012026-F.webp",
    },
    {
      title: "PARA LA FAMILIA",
      rating: 5,
      text:
        "Lo puse pensando en mis hijos. Que cada cepillo quede en su lugar y más protegido me parece lo más importante.",
      name: "Federico Albornoz",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_735168-MLA104575340271_012026-F.webp",
    },
    {
      title: "SE NOTA PROTEGIDO",
      rating: 4,
      text:
        "Los cepillos quedan más resguardados y eso se siente. Me gusta porque el baño queda más ‘sanitario’ sin exagerar.",
      name: "Mariana Quiroga",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_612380-MLA103990675067_012026-F.webp",
    },
    {
      title: "MEJOR PARA HIGIENE",
      rating: 5,
      text:
        "Desde que lo tengo, dejé de dejar los cepillos expuestos. Es un cambio simple, pero para higiene diaria suma un montón.",
      name: "Gustavo Molina",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_901052-MLA104463601083_012026-F.webp",
    },
    {
      title: "MÁS TRANQUILIDAD",
      rating: 5,
      text:
        "A mí me importaba la parte higiénica. Los cepillos quedan protegidos y siento más tranquilidad con lo que uso todos los días.",
      name: "Valentina Ortiz",
      img: "https://http2.mlstatic.com/D_NQ_NP_2X_850550-MLA98741967278_112025-F.webp",
    },
  ],

  about: {
    title: "QUIÉNES SOMOS",
    img:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    text:
      "En BoomHausS nos enfocamos en traer productos que realmente solucionen problemas del día a día, con envío rápido, atención humana y una experiencia de compra simple. Nuestro objetivo es que compres con confianza y recibas exactamente lo que ves.",
    bullets: [
      "✅ Atención por WhatsApp",
      "📦 Envíos a todo el país",
      "🔒 Pagos seguros",
      "⭐ Enfoque en calidad y experiencia",
    ],
  },
};

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="24" fill="#cbd5e1">
      Imagen no disponible
    </text>
  </svg>
`);

function StarsInline({ rating = 5 }) {
  return (
    <span className="stars-inline" aria-label={`${rating} estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`s ${i < rating ? "on" : ""}`}>★</span>
      ))}
    </span>
  );
}

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

function moneyARS(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

function clampPct(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(99, x));
}

/* =========================
   Countdown
========================= */
function CountdownTimer({ storageKey = "pd_countdown", minutes = 18 }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    const target =
      saved && saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;

    sessionStorage.setItem(storageKey, String(target));

    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, minutes]);

  const totalSec = Math.floor(left / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return <span className="cd">{mm}:{ss}</span>;
}

/* =========================
   Sections
========================= */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="sec-head">
      <h2 className="sec-title">{title}</h2>
      {subtitle ? <div className="sec-sub">{subtitle}</div> : null}
    </div>
  );
}

function CertificateStrip() {
  const { certificate } = MARKETING_CONTENT;

  return (
    <section className="pd-strip pd-strip--pro">
      <SectionHeader title={certificate.title} />

      <div className="pd-certRow">
        <div className="pd-certSeal" aria-label="Certificación">
          {certificate.logoUrl ? (
            <img
              src={certificate.logoUrl}
              alt="Certificación"
              className="pd-certLogo"
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="pd-certLogoPlaceholder">Logo</div>
          )}
        </div>

        <div className="pd-certMeta">
          <div className="pd-certKicker">CERTIFICACIÓN / CONFIANZA</div>
          <div className="pd-certLine">
            <span className="pd-certDot" />
            <span className="pd-certSmall">
              Pagos seguros • Compra protegida • Seguimiento
            </span>
          </div>
        </div>
      </div>

      <div className="pd-stripGrid pd-stripGrid--pro">
        {certificate.items.map((x, i) => (
          <div key={i} className="pd-stripItem pd-stripItem--pro">
            <span className="pd-stripIcon">{x.icon}</span>
            <span className="pd-stripText">{x.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonTablePro() {
  const { comparison } = MARKETING_CONTENT;

  return (
    <section className="pd-block">
      <SectionHeader title={comparison.title} />

      <div className="cmp-desktop">
        <div className="cmp-wrap cmp-anim cols-2">
          <div className="cmp-head">
            <div className="cmp-k"></div>
            <div className="cmp-col cmp-a">{comparison.cols[0]}</div>
            <div className="cmp-col">{comparison.cols[1]}</div>
          </div>

          {comparison.rows.map((r, i) => (
            <div key={i} className="cmp-row">
              <div className="cmp-k">{r.k}</div>
              <div className="cmp-col cmp-a">{r.a}</div>
              <div className="cmp-col">{r.b}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cmp-mobile">
        <div className="cmp-cards">
          {comparison.rows.map((r, i) => (
            <div key={i} className="cmp-card">
              <div className="cmp-card-k">{r.k}</div>

              <div className="cmp-card-grid">
                <div className="cmp-pill">
                  <div className="cmp-pill-label">{comparison.cols[0]}</div>
                  <div className="cmp-pill-val">{r.a}</div>
                </div>

                <div className="cmp-pill good">
                  <div className="cmp-pill-label">{comparison.cols[1]}</div>
                  <div className="cmp-pill-val">{r.b}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToSteps() {
  const { howTo } = MARKETING_CONTENT;

  return (
    <section className="pd-block" id="howto">
      <SectionHeader title={howTo.title} />

      <div className="how-imgWrap hover-float">
        <img
          src={howTo.image?.url}
          alt={howTo.image?.alt || howTo.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
      </div>
    </section>
  );
}

function AuthorityCard() {
  return (
    <section className="pd-block" id="authority">
      <SectionHeader
        title="LO QUE DICEN LOS PROFESIONALES"
        subtitle="Recomendación basada en higiene diaria"
      />

      <div className="authCard">
        <div className="authTop">
          <div className="authAvatar">
            <img
              src="https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Profesional de salud"
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </div>

          <div className="authMeta">
            <div className="authTag">RECOMENDACIÓN PROFESIONAL</div>
            <div className="authName">Dra. Laura Martínez</div>
            <div className="authRole">Odontóloga · Higiene oral</div>
          </div>
        </div>

        <p className="authQuote">
          “Un porta cepillos con esterilización UV puede ayudar a reducir la carga bacteriana del cepillo
          entre usos, especialmente en baños húmedos. Si además mantiene los cepillos separados y secos,
          mejora la higiene diaria y ayuda a evitar malos olores.”
        </p>

        <div className="authFoot">
          <span className="authDot" />
          <span className="authFootText">
            Recomendación general de higiene. No reemplaza el cepillado correcto ni controles odontológicos.
          </span>
        </div>
      </div>
    </section>
  );
}

function FaqSectionPro() {
  const [openIndex, setOpenIndex] = useState(null);
  const { faq, faqTitle } = MARKETING_CONTENT;

  return (
    <section className="pd-block" id="faq-section">
      <SectionHeader title={faqTitle} />
      <div className="faq-pro">
        {faq.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`faq-pro-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="faq-pro-q"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-pro-ico">{isOpen ? "−" : "+"}</span>
              </button>
              <div className="faq-pro-a">
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StoryBlocks() {
  const blocks = MARKETING_CONTENT.storyBlocks;
  return (
    <section className="pd-flow">
      {blocks.map((b, i) => (
        <div key={i} className="flow-row">
          <div className="flow-text">
            <div className="flow-badge">{b.badge}</div>
            <h3 className="flow-title">{b.title}</h3>
            <p className="flow-p">{b.text}</p>
          </div>

          <div className="flow-media">
            <div className="flow-imgBox hover-float">
              <img
                src={b.img}
                alt={b.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function MiniReviewsBar({ productImg }) {
  const data = (MARKETING_CONTENT.reviewsCarousel || []).slice(0, 5);
  const [active, setActive] = useState(0);

  const go = (idx) => {
    if (!data.length) return;
    const n = data.length;
    setActive((idx + n) % n);
  };

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => go(active + 1), 7000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, data.length]);

  if (!data.length) return null;

  return (
    <div className="mrb">
      <div className="mrb-viewport">
        <div
          className="mrb-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {data.map((r, i) => {
            const avatar = r.img || productImg || FALLBACK_IMG;
            return (
              <div className="mrb-slide" key={i}>
                <div className="mrb-card">
                  <div className="mrb-left">
                    <img
                      className="mrb-avatar"
                      src={avatar}
                      alt={r.name || "Cliente"}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </div>

                  <div className="mrb-mid">
                    <div className="mrb-text">{r.text}</div>

                    <div className="mrb-bottom">
                      <div className="mrb-name">{r.name}</div>
                      <div className="mrb-stars">
                        <StarsInline rating={r.rating || 5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mrb-nav">
        <button type="button" className="mrb-arrow" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div className="mrb-dots">
          {data.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`mrb-dot ${i === active ? "on" : ""}`}
              onClick={() => go(i)}
              aria-label={`Ir a reseña ${i + 1}`}
            />
          ))}
        </div>

        <button type="button" className="mrb-arrow" onClick={() => go(active + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>
    </div>
  );
}

function ReviewsCarouselPro({ productImg }) {
  const data = MARKETING_CONTENT.reviewsCarousel;
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  const go = (idx) => {
    const n = data.length;
    const next = (idx + n) % n;
    setActive(next);
    const el = rowRef.current?.querySelectorAll(".rv-slide")?.[next];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onScroll = () => {
    if (!rowRef.current) return;
    const slides = Array.from(rowRef.current.querySelectorAll(".rv-slide"));
    const center = rowRef.current.scrollLeft + rowRef.current.clientWidth / 2;

    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const sCenter = s.offsetLeft + s.clientWidth / 2;
      const dist = Math.abs(center - sCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  };

  return (
    <section className="pd-block" id="reviews-section">
      <SectionHeader title={MARKETING_CONTENT.reviewsTitle} subtitle={MARKETING_CONTENT.reviewsSubtitle} />

      <div className="rv-wrap">
        <button type="button" className="rv-nav rv-prev" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div className="rv-row" ref={rowRef} onScroll={onScroll}>
          {data.map((r, i) => {
            const img = r.img || productImg || FALLBACK_IMG;
            return (
              <article key={i} className="rv-slide">
                <div className="rv-card">
                  <div className="rv-imgBox">
                    <img
                      src={img}
                      alt={r.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                    <div className="rv-quote">❞</div>
                  </div>

                  <div className="rv-body">
                    <StarsInline rating={r.rating} />
                    <div className="rv-title">{r.title}</div>
                    <p className="rv-text">{r.text}</p>
                    <div className="rv-name">{r.name}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" className="rv-nav rv-next" onClick={() => go(active + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className="rv-dots">
        {data.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`rv-dot ${i === active ? "on" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir al testimonio ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  const { about } = MARKETING_CONTENT;
  return (
    <section className="pd-block" id="about">
      <SectionHeader title={about.title} />
      <div className="about-grid">
        <div className="about-img hover-float">
          <img
            src={about.img}
            alt="BoomHausS equipo"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
        <div className="about-text">
          <p className="about-p">{about.text}</p>
          <div className="about-bul">
            {about.bullets.map((b, i) => (
              <div className="about-li" key={i}>{b}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const WaveSvg = ({ fill = "#F8FBFF" }) => (
  <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
    <path
      fill={fill}
      d="M0,64L48,74.7C96,85,192,107,288,101.3C384,96,480,64,576,53.3C672,43,768,53,864,58.7C960,64,1056,64,1152,53.3C1248,43,1344,21,1392,10.7L1440,0L1440,120L0,120Z"
    />
  </svg>
);

const Band = ({
  variant = "light",
  topFill,
  bottomFill,
  noTop = false,
  noBottom = false,
  children,
}) => {
  return (
    <section className={`pd-band pd-band--${variant}`}>
      {!noTop && (
        <div className="pd-wave pd-wave--top">
          <WaveSvg fill={topFill} />
        </div>
      )}

      <div className="container pd-band-inner">{children}</div>

      {!noBottom && (
        <div className="pd-wave pd-wave--bottom">
          <WaveSvg fill={bottomFill} />
        </div>
      )}
    </section>
  );
};

/* =========================
   Main
========================= */
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
      } catch {
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
    60350;

  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 2105;

  const pack2Discount = 10;
  const unitPrice = price;

  const promoOn = bundle === 2;
  const totalQty = promoOn ? Math.max(2, qty) : 1;

  const displayTotal = promoOn
    ? Math.round(totalQty * unitPrice * (1 - pack2Discount / 100))
    : Math.round(totalQty * unitPrice);

  const oldTotal = Math.round(compareAt * totalQty);

  const contentId = useMemo(
    () =>
      product?.sku ||
      product?.productId ||
      product?._id ||
      (product?.id ? String(product.id) : null) ||
      id ||
      "PRODUCT",
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

    setTimeout(() => navigate("/checkout"), 350);
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
          <div className="card">Cargando…</div>
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

  // ✅ para el nuevo hero (como la captura)
  const discountPct = clampPct(Math.round((1 - unitPrice / compareAt) * 100));
  const heroViews = product?.viewingNow ?? product?.socialProofLive ?? 13;

  return (
    <main className="section main-wrapper pd-page">
      <div className="pd-page">
        <Marquee
          speed={18}
          items={[
            "Envío gratis a todo el país",
            "Pagá contra entrega / transferencia",
            "Compra segura",
            "Soporte por WhatsApp",
          ]}
        />
      </div>

      <div className="container pd-container">
        <div className="pd-grid">
          {/* MEDIA */}
          <section className="card pd-media pd-media-sticky">
            <div
              className="pd-mediaMain pd-mediaMain--bigger"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {images.length > 0 ? (
                <img
                  className="pd-mainImg pd-mainImg--force"
                  src={images[activeImgIndex]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading={activeImgIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
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
                <div className="">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={` ${idx === activeImgIndex ? "" : ""}`}
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

            {images.length > 1 && (
              <div className="pd-thumbs-row">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`}
                    onClick={() => setActiveImgIndex(idx)}
                    aria-label={`Miniatura ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt="thumb"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* INFO */}
          <aside className="pd-info">
            {/* ====== CAMBIO: HERO COMPACTO COMO LA IMAGEN ====== */}
            <div className="hero-top hero-top--compact">
              {/* (mini carrusel: ya lo tenés en MEDIA) */}

              {/* Trust badges row (como la captura) */}
              <div className="hero-trustline hero-trustline--logos" aria-label="Reseñas verificadas">
                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    {/* Trustpilot simple star */}
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M12 2l3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9L12 2z" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Trustpilot</span>
                    <span className="trust-sub"><b>4.8</b> · Verified</span>
                  </div>
                </div>

                <span className="hero-trustSep" />

                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    {/* Facebook "f" */}
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.3l.7-3H13V9c0-.6.4-1 1-1z" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Facebook</span>
                    <span className="trust-sub"><b>4.9</b> · Reviews</span>
                  </div>
                </div>

                <span className="hero-trustSep" />

                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    {/* Google "G" simple */}
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M12 10.2v3.6h5.1c-.5 2.1-2.3 3.6-5.1 3.6A5.4 5.4 0 1 1 12 6.6c1.4 0 2.6.5 3.6 1.3l2.4-2.4A8.9 8.9 0 1 0 12 20.9c5 0 8.6-3.5 8.6-8.5 0-.6-.1-1.1-.2-1.6H12z" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Google</span>
                    <span className="trust-sub"><b>4.8</b> · Ratings</span>
                  </div>
                </div>
              </div>



              {/* social proof chico arriba del título (como “Mabel H. + de 100.000 compraron”) */}
              <div className="hero-proof hero-proof--compact">
                <div className="hero-proofText">
                  <b>{Number(soldCount).toLocaleString("es-AR")}</b> personas compraron
                </div>
              </div>

              <h1 className="hero-title hero-title--compact">{product.name}</h1>

              <div className="hero-ratingRow hero-ratingRow--compact">
                <StarsInline rating={5} />
                <span className="hero-ratingText">4.7</span>
                <a href="#reviews-section" onClick={scrollToReviews} className="hero-reviews hero-reviews-link">
                  ({Number(274).toLocaleString("es-AR")} reseñas)
                </a>
              </div>

              {/* Subtítulo corto (como “La piel sana comienza desde dentro”) */}
              <div className="hero-subtitle">
                Más higiene y orden todos los días
              </div>

              {/* ✅ Bullets: compactas, tipo check */}
              <ul className="hero-bullets-compact">
                {(MARKETING_CONTENT.trustBullets || []).slice(0, 4).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              {/* Precio: antes tachado + ahora grande + descuento */}
              <div className="hero-priceRow">
                <span className="hero-was">{moneyARS(compareAt)}</span>
                <span className="hero-now">{moneyARS(unitPrice)}</span>
                <span className="hero-off">Descuento {discountPct}%</span>
              </div>

              {/* CTA grande 2 líneas (como la captura) */}
              <button
                className="hero-ctaBig"
                type="button"
                onClick={handleBuyNow}
                disabled={redirecting}
              >
                {redirecting ? "PROCESANDO..." : "Pagar Contra Reembolso"}
                <span>Envío GRATIS en 24/48Hs</span>
              </button>

              {/* viewing pill */}
              <div className="hero-viewingPill" aria-live="polite">
                <span className="hero-dot" aria-hidden="true" />
                <b>{heroViews}</b>&nbsp;personas están viendo este producto
              </div>
            </div>
            {/* ====== FIN CAMBIO HERO COMPACTO ====== */}

            {/* ✅ Mini reseñas: ya las tenés abajo del grid como MiniReviewsBar, NO TOCAMOS */}

            {/* ✅ CABA: PAGO AL RECIBIR (se mantiene igual) */}
            <div className="pd-codBanner" role="note" aria-label="Pago al recibir en CABA">
              <div className="pd-codLeft">
                <div className="pd-codIcon">📍</div>
                <div className="pd-codText">
                  <div className="pd-codTitle">CABA: PAGÁ AL RECIBIR</div>
                  <div className="pd-codSub">
                    Disponible en <b>Punto de encuentro</b> o <b>Retiro</b>. Lo elegís al finalizar la compra.
                  </div>
                </div>
              </div>

              <div className="pd-codBadge">SOLO CABA</div>
            </div>

            {/* <div className="pd-divider pd-divider--mt">Elegí tu pack</div>

            <div className="pd-deliveryNotice">
              <div className="pd-deliveryIcon" aria-hidden="true">⚡</div>

              <div className="pd-deliveryText">
                <div className="pd-deliveryTop">
                  <span className="pd-deliveryTitle">FULL</span>
                  <span className="pd-deliveryMsg">Llega Mañana!</span>
                </div>
                <div className="pd-deliverySub">Comprando dentro de las próximas 2 horas</div>
              </div>
            </div>

            <div className="pd-bundles pd-bundles-pro">
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
                      1 unidad <span className="pd-tag">Pack básico</span>
                    </div>

                    <div className="pd-bundlePrice">
                      {moneyARS(unitPrice)}
                      <div className="pd-bundleCompare">{moneyARS(compareAt)}</div>
                      <div className="pd-bundleSave">
                        Ahorrás {clampPct(Math.round((1 - unitPrice / compareAt) * 100))}%
                      </div>
                    </div>
                  </div>

                  <div className="pd-bundleSub">
                    Precio final con envío gratis.
                  </div>

                  <div className="pd-bundleBottom">
                    <span className="pd-miniBenefit">🚚 Envío gratis</span>
                    <span className="pd-miniBenefit">🧲 facil instalacion</span>
                    <span className="pd-miniBenefit">🔌 Recargable</span>
                  </div>
                </div>
              </label>
            </div> */}

            {/* ✅ CTA BLOCK: lo dejamos, pero lo compactamos visualmente (solo CSS) */}
            <div className="pd-ctaBlock">
              {/* <button
                className="pd-ctaSecondary btn-breathing-intense"
                type="button"
                onClick={handleBuyNow}
                disabled={redirecting}
              >
                {redirecting ? "PROCESANDO..." : "COMPRAR AHORA"}
              </button> */}

              <div className="pd-ctaSub">
                Vas a ver el total final antes de pagar • Envío gratis • Pago seguro
              </div>

              <div className="pd-addToCartWrap">
                <button type="button" onClick={handleAddToCart} className="pd-ctaPrimary-outline">
                  Agregar al carrito
                </button>

                <button
                  type="button"
                  className="pd-howLink"
                  onClick={() => document.getElementById("howto")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Ver cómo se instala →
                </button>
              </div>
            </div>

            <div className="accordion-wrapper">
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsDescExpanded(!isDescExpanded)} type="button">
                  <span>Ficha técnica</span>
                  <span>{isDescExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isDescExpanded ? "open" : ""}`}>
                  <p>{product.description || MARKETING_CONTENT.miniDescription}</p>

                  <ul className="pd-specs-list">
                    {product.specs &&
                      Object.entries(product.specs).map(([key, val]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {val}
                        </li>
                      ))}

                    {!product.specs && (
                      <>
                        <li><strong>Ganancia:</strong> 50 dBi</li>
                        <li><strong>Largo cable:</strong> 5 metros</li>
                        <li><strong>Resolución:</strong> 4K / 1080p</li>
                        <li><strong>Conector:</strong> coaxial universal</li>
                        <li><strong>Uso:</strong> interior / exterior</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsShippingExpanded(!isShippingExpanded)} type="button">
                  <span>Envíos y compra protegida</span>
                  <span>{isShippingExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isShippingExpanded ? "open" : ""}`}>
                  <ul className="pd-ship-list">
                    <li><strong>Envío gratis:</strong> a todo el país.</li>
                    <li><strong>Compra protegida:</strong> tu pago se procesa de forma segura.</li>
                    <li><strong>Soporte:</strong> te ayudamos si necesitás guía para instalar.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <MiniReviewsBar productImg={images?.[0] || FALLBACK_IMG} />

        <div className="pd-bands">
          <Band
            variant="light"
            topFill="transparent"
            bottomFill="var(--pd-blue)"
            noTop
          >
            <div className="pd-sections-new">
              <StoryBlocks />
            </div>
          </Band>

          <Band
            variant="blue"
            topFill="var(--pd-light)"
            bottomFill="var(--pd-light)"
          >
            <div className="pd-sections-new">
              <CertificateStrip />
              <HowToSteps />
              <AuthorityCard />
            </div>
          </Band>

          <Band
            variant="light"
            topFill="var(--pd-blue)"
            bottomFill="var(--pd-blue)"
          >
            <div className="pd-sections-new">
              
              <ReviewsCarouselPro productImg={images?.[0] || FALLBACK_IMG} />
            </div>
          </Band>

          <Band
            variant="blue"
            topFill="var(--pd-light)"
            bottomFill="var(--pd-light)"
          >
            <div className="pd-sections-new">
              <FaqSectionPro />
              <AboutSection />
            </div>
          </Band>
        </div>
      </div>

      {showToast && (
        <div className="pd-toast-wrapper">
          <div className="pd-toast-content">
            <div className="pd-toast-main">
              <img
                src={images[0] || FALLBACK_IMG}
                alt=""
                className="pd-toast-img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
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
          </div>
        </div>
      )}

      <div className="sticky-pro">
        <div className="sticky-pro-left">
          <div className="sticky-count">
            <span className="sticky-countLabel">TERMINA EN</span>
            <CountdownTimer storageKey={`pd_countdown_${id}`} minutes={18} />
          </div>

          <div className="sticky-prices">
            <span className="sticky-old">{formatARS(oldTotal)}</span>
            <span className="sticky-now">{formatARS(displayTotal)}</span>
          </div>
        </div>

        <button className="sticky-pro-btn2" onClick={handleBuyNow} disabled={redirecting} type="button">
          {redirecting ? "..." : "LO QUIERO!"}
        </button>
      </div>

      {/* ✅ CSS */}
      <style>{`
      .pd-grid > * { min-width: 0; }  
      aside.pd-info { min-width: 0; width: 100%; max-width: 100%; }

      /* === Product page: hero image full-bleed on mobile (only the main image) === */
      @media (max-width: 980px){
        .pd-page, body { 
          overflow-x: clip !important; 
          width: 100% !important;
          position: relative;
        }

        .pd-mediaMain--bigger{
          width: calc(100% + 40px) !important; 
          max-width: none !important;
          margin-left: -20px !important;       
          margin-right: -20px !important;
          border-radius: 0 !important;
          height: auto !important;
          aspect-ratio: 1 / 1 !important;      
          background: #fff !important;
          display: block !important;
          position: relative !important;
        }

        .pd-mainImg--hero{
          position: static !important;
          width: 100% !important;
          height: auto !important;
          max-height: none !important;
          object-fit: contain !important;
          padding: 0 !important;
          background: transparent !important;
          display: block !important;
        }

        .pd-dots-container{
          position: static !important;
          padding: 10px 0 12px !important;
        }

        .pd-mainImg--force{
          position: absolute !important;
          top: 0; left: 0;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important; 
        }
        
        .pd-info {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 4px !important;
          box-sizing: border-box !important;
        }
      }

      /* ====== CAMBIO CSS: HERO COMPACTO COMO LAS IMÁGENES ====== */
      .hero-top--compact{
        padding: 6px 2px 0 !important;
      }

      .hero-trustline{
        display:flex;
        justify-content:center;
        align-items:center;
        gap: 10px;
        text-align:center;
        font-size: 12px;
        opacity: .95;
        margin: 6px 0 8px;
      }

      .hero-trustItem b{ font-weight: 900; }
      .hero-trustSep{
        width: 1px;
        height: 26px;
        background: rgba(0,0,0,.12);
      }

      .hero-proof--compact{
        margin: 6px 0 2px;
        display:flex;
        justify-content:center;
      }
      .hero-proof--compact .hero-proofText{
        font-weight: 900;
        color: rgba(11,18,32,.78);
      }

      .hero-title--compact{
        margin: 0 !important;
        text-align: center !important;
        font-size: 32px !important;
        line-height: 1.05 !important;
        font-weight: 1100 !important;
      }

      .hero-ratingRow--compact{
        justify-content: center !important;
        gap: 10px !important;
        margin-top: 6px !important;
      }
      .hero-reviews-link{
        text-decoration: none !important;
        opacity: .85;
      }

      .hero-subtitle{
        text-align:center;
        font-weight: 900;
        font-size: 16px;
        margin-top: 8px;
      }

      .hero-bullets-compact{
        margin: 6px 0 6px;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .hero-bullets-compact li{
        display:grid;
        grid-template-columns: 18px 1fr;
        gap: 10px;
        font-size: 15px;
        line-height: 1.25;
        align-items: start;
      }
      .hero-bullets-compact li::before{
        content: "✓";
        width:18px;
        height:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        border: 1px solid rgba(0,0,0,.22);
        border-radius: 999px;
        font-size: 12px;
        margin-top: 2px;
      }

      .hero-priceRow{
        display:flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        margin: 6px 0 2px;
      }
      .hero-was{
        text-decoration: line-through;
        opacity: .45;
        font-size: 18px;
        font-weight: 900;
      }
      .hero-now{
        font-size: 34px;
        font-weight: 1100;
      }
      .hero-off{
        font-size: 18px;
        font-weight: 1100;
        color: rgba(220,38,38,.95);
      }

      .hero-ctaBig{
        width:100%;
        border-radius: 14px;
        border: 2px solid rgba(0,0,0,.18);
        padding: 14px 12px;
        font-size: 18px;
        font-weight: 1100;
        display:flex;
        flex-direction:column;
        gap: 4px;
        align-items:center;
        justify-content:center;
        text-align:center;
        background: #dc2626;      /* rojo como captura */
        color: #fff;
        box-shadow: 0 18px 55px rgba(220,38,38,.20);
        margin-top: 8px;
      }
      .hero-ctaBig span{
        font-size: 14px;
        font-weight: 900;
        opacity: .95;
      }

      .hero-viewingPill{
        width:100%;
        border-radius: 12px;
        padding: 10px 12px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap: 8px;
        font-size: 14px;
        background: rgba(220,38,38,.08);
        border: 1px solid rgba(220,38,38,.12);
        margin-top: 10px;
        font-weight: 850;
      }
      .hero-dot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display:inline-block;
        background: #ef4444;
        box-shadow: 0 10px 25px rgba(239,68,68,.25);
      }

      @media (max-width: 520px){
        .hero-title--compact{ font-size: 30px !important; }
        .hero-now{ font-size: 32px; }
      }
      /* ====== FIN CAMBIO CSS HERO COMPACTO ====== */

      /* ===== TITULOS PRO ===== */
      .sec-head{
        text-align: center;
        margin: 26px 0 14px;
      }
      .sec-title{
        margin: 0;
        font-weight: 1100;
        letter-spacing: .06em;
        text-transform: uppercase;
        font-size: 1.55rem;
        color: rgba(11,18,32,.92);
      }
      @media (min-width: 900px){
        .sec-title{ font-size: 1.85rem; }
      }
      .sec-sub{
        margin-top: 8px;
        color: rgba(11,18,32,.60);
        font-weight: 850;
      }

      /* ===== IMAGEN PRINCIPAL MÁS GRANDE ===== */
      .pd-media { padding: 0 !important; }
      .pd-mediaMain--bigger{
        position: relative;
        width: 100%;
        background: #f8fafc;
        overflow: hidden;
        border-radius: 0px;
        height: 520px;
      }
      @media (max-width: 980px){
        .pd-mediaMain--bigger{ height: 420px; }
      }
      @media (max-width: 520px){
        .pd-mediaMain--bigger{ height: 390px; }
      }

      /* thumbs */
      .pd-thumbs-row{
        display:flex;
        gap: 10px;
        padding: 12px;
        border-top: 1px solid rgba(0,0,0,0.06);
        overflow-x: auto;
        background: #fff;
      }
      .pd-thumb{
        min-width: 72px;
        width: 72px;
        height: 72px;
        border-radius: 14px;
        overflow:hidden;
        border: 2px solid rgba(2,8,23,.10);
        background: #f1f5f9;
        padding: 0;
      }
      .pd-thumb.is-active{
        border-color: rgba(11,92,255,.85);
        box-shadow: 0 0 0 3px rgba(11,92,255,.18);
      }
      .pd-thumb img{ width:100%; height:100%; object-fit: cover; display:block; }

      /* hero */
      .hero-mini-desc{ color: rgba(11,18,32,.72); line-height: 1.7; margin: 10px 0 8px; }
      .inc-inline{ display:flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 6px; }
      .inc-chip{
        display:flex; align-items:center; gap: 8px;
        background: rgba(234,241,255,.78);
        border: 1px solid rgba(11,92,255,.14);
        padding: 10px 12px;
        border-radius: 14px;
        font-weight: 850;
        color: rgba(11,18,32,.78);
      }

      /* anim helper */
      .hover-float{
        transition: transform .18s ease, box-shadow .18s ease;
        will-change: transform;
      }
      .hover-float:hover{
        transform: translateY(-4px);
        box-shadow: 0 18px 50px rgba(10,20,40,.14);
      }
      @keyframes popIn{
        from{ opacity: 0; transform: translateY(10px) scale(.98); }
        to{ opacity: 1; transform: translateY(0) scale(1); }
      }

      /* story title */
      .flow-title{
        text-align: center;
        text-transform: uppercase;
        letter-spacing: .05em;
        font-size: 1.25rem;
        font-weight: 1100;
        margin: 0 0 12px;
      }
      @media (min-width: 900px){
        .flow-title{ font-size: 1.45rem; }
      }
      .flow-p{ margin: 0; color: rgba(11,18,32,.72); line-height: 1.7; font-weight: 650; text-align: center; }

      .pd-sections-new{ margin-top: 40px; padding-bottom: 40px; }
      .pd-flow{ display:flex; flex-direction: column; gap: 28px; }
      .flow-row{
        display:grid;
        grid-template-columns: 1.1fr .9fr;
        gap: 22px;
        align-items: center;
      }
      @media (max-width: 900px){
        .flow-row{ grid-template-columns: 1fr; }
      }
      .flow-text{ display:flex; flex-direction: column; align-items: center; }
      .flow-badge{
        display:inline-flex;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(11,92,255,.10);
        border: 1px solid rgba(11,92,255,.18);
        font-weight: 1100;
        color: rgba(11,18,32,.78);
        margin-bottom: 10px;
      }

      .flow-imgBox{
        width: 100%;
        max-width: 520px;
        aspect-ratio: 1 / 1;
        border-radius: 0px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.08);
        background: #fff;
        margin-left: auto;
      }
      @media (max-width: 900px){
        .flow-imgBox{ margin: 0 auto; max-width: 520px; }
      }
      .flow-imgBox img{
        width:100%;
        height:100%;
        object-fit: cover;
        display:block;
      }

      /* ===== CERTIFICATE PRO ===== */
      .pd-strip--pro{
        margin: 34px 0 10px;
        background: #ffffff;
        border: 1px solid rgba(2,8,23,.10);
        border-radius: 22px;
        padding: 18px 16px 16px;
        box-shadow: 0 22px 70px rgba(10,20,40,.10);
        position: relative;
        overflow: hidden;
      }

      .pd-strip--pro::before{
        content:"";
        position:absolute;
        left: 0; right: 0; top: 0;
        height: 4px;
        background: linear-gradient(90deg, rgba(11,92,255,.95), rgba(16,185,129,.85));
      }

      .pd-certRow{
        display:flex;
        align-items:center;
        justify-content:center;
        gap: 12px;
        margin: 10px 0 16px;
        flex-wrap: wrap;
      }

      .pd-certSeal{
        width: 92px;
        height: 92px;
        border-radius: 999px;
        background: #fff;
        border: 2px solid rgba(2,8,23,.10);
        box-shadow: 0 18px 50px rgba(10,20,40,.12);
        display:grid;
        place-items:center;
        padding: 10px;
        position: relative;
      }

      .pd-certSeal::after{
        content:"";
        position:absolute;
        inset: 6px;
        border-radius: 999px;
        border: 1px dashed rgba(2,8,23,.16);
        pointer-events:none;
      }

      .pd-certLogo{
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 999px;
        display:block;
      }

      .pd-certMeta{
        display:flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-start;
        max-width: 420px;
      }

      .pd-certKicker{
        font-weight: 1100;
        letter-spacing: .08em;
        text-transform: uppercase;
        font-size: .78rem;
        color: rgba(11,18,32,.62);
      }

      .pd-certLine{
        display:flex;
        align-items:center;
        gap: 8px;
      }

      .pd-certDot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(16,185,129,1);
        box-shadow: 0 10px 25px rgba(16,185,129,.35);
      }

      .pd-certSmall{
        font-weight: 900;
        color: rgba(11,18,32,.72);
        font-size: .92rem;
      }

      .pd-stripGrid--pro{
        display:grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      @media (min-width: 900px){
        .pd-stripGrid--pro{
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .pd-stripItem--pro{
        display:flex;
        gap: 10px;
        align-items:center;
        background: rgba(248,250,252,.95);
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 16px;
        padding: 12px 12px;
        font-weight: 950;
        color: rgba(11,18,32,.78);
        box-shadow: 0 14px 40px rgba(10,20,40,.06);
        transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
      }

      .pd-stripItem--pro:hover{
        transform: translateY(-3px);
        border-color: rgba(11,92,255,.22);
        box-shadow: 0 20px 60px rgba(10,20,40,.10);
      }

      .pd-stripIcon{
        width: 34px;
        height: 34px;
        border-radius: 12px;
        display:grid;
        place-items:center;
        background: rgba(11,92,255,.10);
        border: 1px solid rgba(11,92,255,.14);
        flex-shrink: 0;
      }

      .pd-stripText{
        line-height: 1.2;
      }

      /* ===== COMPARATIVA ===== */
      .cmp-wrap{
        min-width: 0; 
        width: 100%;
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 18px 55px rgba(10,20,40,.10);
        overflow: hidden;
      }

      @media (min-width: 900px){
        .cmp-wrap{ min-width: 680px; }
      }

      .cmp-head, .cmp-row{
        display:grid;
        grid-template-columns: 1.2fr 1fr 1fr 1fr;
        align-items:center;
      }
      .cmp-head{
        background: linear-gradient(180deg, rgba(234,241,255,.95), rgba(234,241,255,.65));
        border-bottom: 1px solid rgba(2,8,23,.06);
        font-weight: 1100;
      }
      .cmp-row{
        border-bottom: 1px solid rgba(2,8,23,.06);
        transition: background .18s ease, transform .18s ease;
      }
      .cmp-row:hover{ background: rgba(11,92,255,.06); transform: translateY(-1px); }
      .cmp-row:last-child{ border-bottom: none; }
      .cmp-k, .cmp-col{ padding: 14px 12px; color: rgba(11,18,32,.78); font-weight: 900; font-size: .92rem; }
      .cmp-a{ color: rgba(11,92,255,.95); font-weight: 1100; }
      .cmp-anim{ animation: popIn .35s ease both; }

      /* how img */
      .how-imgWrap{
        width: 100%;
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.10);
        background: #fff;
        box-shadow: 0 22px 70px rgba(10,20,40,.12);
      }
      .how-imgWrap img{
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }

      /* cols */
      .cols-2 .cmp-head,
      .cols-2 .cmp-row{
        grid-template-columns: 1.2fr 1fr 1fr;
      }

      /* ✅ table/cards switch */
      .cmp-desktop { display: block; }
      .cmp-mobile { display: none; }
      @media (max-width: 820px){
        .cmp-desktop { display: none; }
        .cmp-mobile { display: block; }
      }

      /* ===== AUTHORITY CARD ===== */
      .authCard{
        background: linear-gradient(180deg, rgba(234,241,255,.75), rgba(255,255,255,.95));
        border: 1px solid rgba(11,92,255,.16);
        border-radius: 22px;
        padding: 35px;
        box-shadow: 0 22px 70px rgba(10,20,40,.14);
        animation: popIn .35s ease both;
      }

      .authTop{
        display:flex;
        align-items:center;
        gap: 12px;
      }

      .authAvatar{
        width: 58px;
        height: 58px;
        border-radius: 999px;
        overflow: hidden;
        border: 2px solid rgba(11,92,255,.25);
        background: #fff;
        box-shadow: 0 12px 35px rgba(11,92,255,.18);
        flex-shrink: 0;
      }

      .authAvatar img{
        width:100%;
        height:100%;
        object-fit: cover;
        display:block;
      }

      .authMeta{
        min-width: 0;
        display:flex;
        flex-direction: column;
        gap: 3px;
      }

      .authTag{
        width: fit-content;
        font-weight: 1100;
        font-size: .78rem;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: rgba(11,92,255,.95);
        background: rgba(11,92,255,.10);
        border: 1px solid rgba(11,92,255,.18);
        padding: 6px 10px;
        border-radius: 999px;
      }

      .authName{
        font-weight: 1100;
        color: rgba(11,18,32,.92);
        line-height: 1.15;
      }

      .authRole{
        color: rgba(11,18,32,.62);
        font-weight: 900;
        font-size: .92rem;
      }

      .authQuote{
        margin: 12px 0 0;
        color: rgba(11,18,32,.78);
        line-height: 1.65;
        font-weight: 650;
        background: rgba(255,255,255,.8);
        border: 1px solid rgba(2,8,23,.06);
        border-radius: 18px;
        padding: 14px 14px;
      }

      .authFoot{
        display:flex;
        align-items:flex-start;
        gap: 10px;
        margin-top: 10px;
        color: rgba(11,18,32,.55);
        font-weight: 850;
        font-size: .88rem;
      }

      .authDot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(16,185,129,.95);
        box-shadow: 0 10px 25px rgba(16,185,129,.25);
        margin-top: 4px;
        flex-shrink: 0;
      }

      /* FAQ */
      .faq-pro{ display:flex; flex-direction: column; gap: 10px; }
      .faq-pro-item{
        background: #fff;
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 18px;
        overflow:hidden;
        box-shadow: 0 18px 55px rgba(10,20,40,.09);
      }
      .faq-pro-q{
        width:100%;
        display:flex;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 16px;
        background: transparent;
        border: none;
        cursor:pointer;
        font-weight: 1100;
        color: rgba(11,18,32,.9);
        text-align:left;
      }
      .faq-pro-ico{ font-size: 22px; color: rgba(11,92,255,.95); }
      .faq-pro-a{
        max-height: 0;
        overflow: hidden;
        transition: max-height .25s ease;
        padding: 0 16px;
        color: rgba(11,18,32,.72);
        font-weight: 650;
      }
      .faq-pro-item.open .faq-pro-a{
        max-height: 260px;
        padding-bottom: 16px;
      }
      .faq-pro-a p{ margin: 0; }

      /* stars */
      .stars-inline{ display:inline-flex; gap: 2px; justify-content: center; }
      .stars-inline .s{ opacity: .25; font-size: 14px; }
      .stars-inline .s.on{ opacity: 1; color: #F5B301; }

      /* Reviews carousel */
      .rv-wrap{ position: relative; margin-top: 14px; }
      .rv-row{
        display:flex;
        gap: 16px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding: 10px 6px 16px;
        -webkit-overflow-scrolling: touch;
      }
      .rv-slide{ scroll-snap-align: center; flex: 0 0 auto; width: min(520px, 88vw); }
      .rv-card{
        background: #fff;
        border: 1px solid rgba(2,8,23,.10);
        border-radius: 22px;
        box-shadow: 0 22px 70px rgba(10,20,40,.16);
        overflow: hidden;
      }
      .rv-imgBox{ position: relative; width: 100%; aspect-ratio: 4 / 3; background: #f1f5f9; }
      .rv-imgBox img{ width:100%; height:100%; object-fit: cover; display:block; }
      .rv-quote{
        position: absolute;
        right: 14px;
        bottom: 14px;
        width: 46px;
        height: 46px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        display:grid;
        place-items:center;
        font-weight: 1100;
        box-shadow: 0 16px 40px rgba(239,68,68,.35);
      }
      .rv-body{ padding: 16px 16px 18px; display:flex; flex-direction: column; gap: 8px; text-align: center; }
      .rv-title{ font-weight: 1100; text-transform: uppercase; letter-spacing: .05em; color: rgba(11,18,32,.92); }
      .rv-text{ margin: 0; color: rgba(11,18,32,.70); line-height: 1.6; font-weight: 650; }
      .rv-name{ margin-top: 4px; font-weight: 900; color: rgba(11,18,32,.62); }

      .rv-nav{
        position:absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px; height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(2,8,23,.10);
        background: rgba(255,255,255,.95);
        box-shadow: 0 18px 55px rgba(10,20,40,.18);
        cursor:pointer;
        display:grid;
        place-items:center;
        font-size: 24px;
        z-index: 10;
      }
      .rv-prev{ left: -8px; }
      .rv-next{ right: -8px; }
      @media (max-width: 560px){ .rv-nav{ display:none; } }

      .rv-dots{ display:flex; justify-content: center; gap: 8px; margin-top: 10px; }
      .rv-dot{
        width: 8px; height: 8px;
        border-radius: 999px;
        border: none;
        background: rgba(2,8,23,.18);
        cursor:pointer;
        transition: transform .18s ease, background .18s ease;
      }
      .rv-dot.on{ background: rgba(11,92,255,.95); transform: scale(1.25); }

      /* About */
      .about-grid{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        align-items: center;
      }
      @media (max-width: 900px){
        .about-grid{ grid-template-columns: 1fr; }
      }
      .about-img{
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.10);
        box-shadow: 0 22px 70px rgba(10,20,40,.14);
        background: #fff;
      }
      .about-img img{
        width:100%;
        height: 100%;
        max-height: 340px;
        object-fit: cover;
        display:block;
      }
      .about-text{ text-align: left; }
      @media (max-width: 900px){
        .about-text{ text-align: center; }
      }
      .about-p{
        margin: 0 0 12px;
        color: rgba(11,18,32,.72);
        line-height: 1.7;
        font-weight: 650;
      }
      .about-bul{
        display:flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (max-width: 900px){
        .about-bul{ align-items: center; }
      }
      .about-li{
        display:inline-flex;
        gap: 10px;
        align-items:center;
        background: rgba(234,241,255,.78);
        border: 1px solid rgba(11,92,255,.14);
        padding: 10px 12px;
        border-radius: 14px;
        font-weight: 900;
        color: rgba(11,18,32,.78);
        width: fit-content;
      }

      /* Sticky */
      .sticky-pro{
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 14px;
        z-index: 9999;
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(255,255,255,.98);
        border: 1px solid rgba(2,8,23,.10);
        border-radius: 20px;
        padding: 12px 14px;
        box-shadow: 0 22px 70px rgba(10,20,40,.18);
        backdrop-filter: blur(12px);
      }
      @media (min-width: 991px){ .sticky-pro{ display:none; } }

      .sticky-pro-left{ display:flex; flex-direction: column; gap: 8px; }
      .sticky-count{ display:flex; align-items:center; gap: 8px; font-weight: 900; color: rgba(11,18,32,.70); white-space: nowrap; }
      .sticky-countLabel{ font-size: .78rem; color: rgba(11,18,32,.55); font-weight: 1100; letter-spacing: .06em; }
      .cd{ font-variant-numeric: tabular-nums; color: #dc2626; font-weight: 1100; }

      .sticky-prices{ display:flex; align-items: baseline; gap: 10px; }
      .sticky-old{ color: rgba(11,18,32,.45); font-weight: 900; text-decoration: line-through; font-size: .88rem; }
      .sticky-now{ font-weight: 1100; color: rgba(11,18,32,.92); font-size: 1.08rem; }

      .sticky-pro-btn2{
        border: none;
        background: #0B5CFF;
        color:#fff;
        font-weight: 1100;
        border-radius: 16px;
        padding: 14px 18px;
        cursor:pointer;
        box-shadow: 0 14px 38px rgba(11,92,255,.30);
        white-space: nowrap;
        transition: transform .12s ease;
        text-transform: uppercase;
        letter-spacing: .04em;
      }
      .sticky-pro-btn2:active{ transform: scale(.98); }

      .pd-addToCartWrap{
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
      }

      .pd-howLink{
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 auto !important;
        width: fit-content;
        cursor: pointer;
        font-weight: 1100;
        color: rgba(11,92,255,.95);
        text-decoration: underline;
        text-underline-offset: 4px;
        letter-spacing: .2px;
      }

      .pd-howLink:hover{
        opacity: .85;
        transform: translateY(-1px);
        transition: .15s ease;
      }

      /* ===== MINI RESEÑAS ===== */
      .mrb{
        margin-top: 14px;
        background: rgba(2,8,23,.03);
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 16px;
        padding: 12px 12px 10px;
        box-shadow: 0 14px 40px rgba(10,20,40,.08);
      }

      .mrb-viewport{
        overflow: hidden;
        border-radius: 14px;
      }

      .mrb-track{
        display: flex;
        width: 100%;
        transition: transform .28s ease;
        will-change: transform;
      }

      .mrb-slide{
        flex: 0 0 100%;
        width: 100%;
      }

      .mrb-card{
        display: flex;
        gap: 10px;
        align-items: center;
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 14px;
        padding: 10px 10px;
      }

      .mrb-avatar{
        width: 34px;
        height: 34px;
        border-radius: 999px;
        object-fit: cover;
        border: 1px solid rgba(2,8,23,.10);
        background: #e2e8f0;
        flex-shrink: 0;
      }

      .mrb-mid{
        flex: 1;
        min-width: 0;
      }

      .mrb-text{
        font-size: .88rem;
        color: rgba(11,18,32,.78);
        font-weight: 650;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .mrb-bottom{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
        gap: 10px;
      }

      .mrb-name{
        font-size: .82rem;
        font-weight: 900;
        color: rgba(11,18,32,.60);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mrb-stars .stars-inline .s{ font-size: 12px; }
      .mrb-stars{ flex-shrink: 0; }

      .mrb-nav{
        display: grid;
        grid-template-columns: 34px 1fr 34px;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .mrb-arrow{
        width: 34px;
        height: 28px;
        border-radius: 10px;
        border: 1px solid rgba(2,8,23,.10);
        background: rgba(255,255,255,.92);
        box-shadow: 0 10px 24px rgba(10,20,40,.10);
        cursor: pointer;
        font-size: 18px;
        display: grid;
        place-items: center;
      }

      .mrb-dots{
        display: flex;
        justify-content: center;
        gap: 6px;
      }

      .mrb-dot{
        width: 6px;
        height: 6px;
        border-radius: 999px;
        border: none;
        background: rgba(2,8,23,.22);
        cursor: pointer;
        transition: transform .15s ease, background .15s ease;
      }
      .mrb-dot.on{
        background: rgba(11,92,255,.95);
        transform: scale(1.25);
      }

      /* ===== Delivery Notice ===== */
      .pd-deliveryNotice{
        margin: 14px 0 10px;
        display:flex;
        gap: 12px;
        align-items:center;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(34,197,94,.25);
        background: linear-gradient(180deg, rgba(34,197,94,.10), rgba(34,197,94,.06));
        box-shadow: 0 12px 28px rgba(16,185,129,.10);
      }

      .pd-deliveryIcon{
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display:grid;
        place-items:center;
        background: rgba(34,197,94,.14);
        border: 1px solid rgba(34,197,94,.22);
        font-size: 18px;
        flex-shrink: 0;
      }

      .pd-deliveryText{ display:flex; flex-direction: column; gap: 3px; }
      .pd-deliveryTop{ display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }

      .pd-deliveryTitle{
        font-weight: 1100;
        font-size: .86rem;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: rgba(22,101,52,.95);
        background: rgba(34,197,94,.14);
        border: 1px solid rgba(34,197,94,.22);
        padding: 4px 8px;
        border-radius: 999px;
      }

      .pd-deliveryMsg{
        font-weight: 1100;
        color: rgba(11,18,32,.92);
      }

      .pd-deliverySub{
        font-size: .86rem;
        font-weight: 850;
        color: rgba(22,101,52,.90);
      }

      /* ===== PAGO AL RECIBIR (CABA) ===== */
      .pd-codBanner{
        margin: 14px 0 12px;
        padding: 12px 14px;
        border-radius: 18px;
        border: 1px solid rgba(245,158,11,.25);
        background: linear-gradient(180deg, rgba(255,251,235,.95), rgba(255,251,235,.70));
        box-shadow: 0 18px 55px rgba(10,20,40,.10);
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 12px;
      }

      .pd-codLeft{
        display:flex;
        align-items:center;
        gap: 12px;
        min-width: 0;
      }

      .pd-codIcon{
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display:grid;
        place-items:center;
        background: rgba(245,158,11,.16);
        border: 1px solid rgba(245,158,11,.22);
        font-size: 18px;
        flex-shrink: 0;
      }

      .pd-codText{
        display:grid;
        gap: 2px;
        min-width: 0;
      }

      .pd-codTitle{
        font-weight: 1100;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: rgba(11,18,32,.92);
        font-size: .95rem;
        line-height: 1.1;
      }

      .pd-codSub{
        color: rgba(11,18,32,.68);
        font-weight: 850;
        font-size: .9rem;
        line-height: 1.35;
      }

      .pd-codBadge{
        background: rgba(69, 138, 5, 0.95);
        color: #fff;
        font-weight: 1100;
        padding: 8px 10px;
        border-radius: 999px;
        letter-spacing: .04em;
        text-transform: uppercase;
        font-size: .78rem;
        box-shadow: 0 14px 34px rgba(11, 245, 81, 0.28);
        white-space: nowrap;
      }

      @media (max-width: 520px){
        .pd-codBanner{ padding: 12px; }
        .pd-codBadge{ font-size: .72rem; padding: 7px 9px; }
        .pd-codTitle{ font-size: .9rem; }
        .pd-codSub{ font-size: .86rem; }
      }
      `}</style>
    </main>
  );
}
