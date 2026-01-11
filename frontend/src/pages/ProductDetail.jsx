import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

/* ========================================================================
   MARKETING CONTENT
   ======================================================================== */
const MARKETING_CONTENT = {
  // TEXTO 1: Título impactante traducido
  miniDescription: "Logra una figura más firme y definida en 4 semanas. Tecnología adelgazante de triple efecto: Radiofrecuencia + Cavitación Ultrasónica + Terapia de Luz Roja.",
  
  // TEXTO 1: Los puntos clave para poner debajo del precio (NUEVO)
  heroBullets: [
    "Disuelve la grasa rebelde y tensa la piel flácida.",
    "Luce y siéntete mejor en solo 4 semanas.",
    "Reduce visiblemente la apariencia de la celulitis.",
    "Estimula el drenaje linfático y elimina toxinas.",
    "Seguro, eficaz y respaldado por la ciencia.",
    "Úsalo solo 10 minutos, 3-4 veces por semana."
  ],

  stats: [
    { pct: "97%", text: "Piel más firme y tensa" },
    { pct: "85%", text: "Reducción de celulitis" },
    { pct: "92%", text: "Menos centímetros" }
  ],

  whatsIncluded: [
    { name: "Dispositivo BodySculpt Pro", icon: "💎" },
    { name: "Gel Conductor Premium (Regalo)", icon: "💧" },
    { name: "Cable de Carga Rápida", icon: "🔌" },
    { name: "Guía de Uso y Protocolos", icon: "📖" }
  ],

  // TEXTO 2: "Breakthrough Body Benefits" (Beneficios Revolucionarios)
  breakthroughBenefits: {
    title: "Beneficios Corporales Revolucionarios",
    subtitle: "Una solución completa para esculpir tu cuerpo.",
    items: [
      { 
        title: "Esculpe el Cuerpo", 
        desc: "Disuelve las células grasas y la piel flácida para una apariencia más esculpida y tonificada.",
        icon: "✨"
      },
      { 
        title: "Aumenta la Firmeza", 
        desc: "La potente tecnología LED roja promueve la producción de colágeno para una piel más elástica.",
        icon: "💪"
      },
      { 
        title: "Suavizado de Piel", 
        desc: "Mejora la textura y el tono de la piel, restaurando una apariencia más joven y suave.",
        icon: "🌸"
      },
      { 
        title: "Ataca la Celulitis", 
        desc: "Se dirige a las células grasas bajo la piel para reducir drásticamente la apariencia de celulitis.",
        icon: "🍑"
      },
      { 
        title: "Trata Estrías", 
        desc: "Promueve la curación general de la piel para atacar la apariencia de estrías y manchas.",
        icon: "⚡"
      },
      { 
        title: "Drenaje Linfático", 
        desc: "Fomenta el drenaje linfático para combatir la hinchazón, la retención de líquidos y eliminar toxinas.",
        icon: "💧"
      }
    ]
  },

  slider: {
    title: "Resultados en 30 Días",
    text: "Cambios reales usando el dispositivo 3 veces por semana.",
    labelBefore: "Día 1",
    labelAfter: "Día 30",
    imgBefore: "https://images.pexels.com/photos/4498157/pexels-photo-4498157.jpeg?auto=compress&cs=tinysrgb&w=800",
    imgAfter: "https://images.pexels.com/photos/4498156/pexels-photo-4498156.jpeg?auto=compress&cs=tinysrgb&w=800"
  },

  comparison: {
    title: "BodySculpt vs. Clínicas",
    text: "La misma tecnología, pero en la comodidad de tu casa.",
    brandName: "BoomHausS",
    competitorName: "Clínica",
    features: [
      { name: "Reducción de Grasa", us: true, others: true },
      { name: "Sin Dolor ni Cirugía", us: true, others: false },
      { name: "Trata Celulitis", us: true, others: false },
      { name: "Pago Único", us: true, others: false },
      { name: "Uso ilimitado", us: true, others: false },
    ]
  },

  bigMedia: {
    title: "Resultados de Clínica en tu Sofá",
    subtitle: "Así de fácil es usarlo: Mira cómo funciona en segundos.",
    src: "https://res.cloudinary.com/duyth9azk/video/upload/v1768099056/945f381d97174efb885363c4955a257d.HD-720p-2.1Mbps-54457348_duh0wz.mp4", 
    isVideo: true 
  },

  authority: {
    title: "Tecnología Aprobada",
    quote: "La sinergia de Cavitación y Radiofrecuencia es el 'estándar de oro' en modelado corporal no quirúrgico. Es seguro y eficaz.",
    name: "Dra. Carolina M.",
    job: "Médica Estética",
    img: "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  faq: [
    { q: "¿Sirve para el abdomen?", a: "¡Sí! Es ideal para abdomen, flancos (cintura), muslos, glúteos y brazos." },
    { q: "¿Es obligatorio usar gel?", a: "SÍ. El dispositivo NO funciona sin gel conductor. Incluimos uno de regalo." },
    { q: "¿Duele?", a: "No. Sentirás calor (RF) y un leve zumbido (Cavitación), pero es seguro y cómodo." },
    { q: "¿Tiene garantía?", a: "Sí, 90 días de garantía de satisfacción. Compra sin riesgos." },
  ],

  trustBadges: {
    payment: [
      { name: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
      { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
      { name: "Amex", src: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" },
      { name: "Mercado Pago", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Mercado_Pago_Link_Logo.png/1024px-Mercado_Pago_Link_Logo.png" }
    ],
    shipping: "Envío Gratis y Asegurado a todo el país",
    security: "Tus datos están protegidos con SSL de 256 bits."
  }
};

/* =========================
   COMPONENTES UI
========================= */

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
    const timer = setInterval(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span style={{fontVariantNumeric: 'tabular-nums'}}>{timeLeft}</span>;
}

function ClinicalStatsSection() {
  const { stats } = MARKETING_CONTENT;
  return (
    <div className="landing-section fade-in-section">
       <div className="landing-container">
          <h3 className="landing-center-title">Eficacia Comprobada</h3>
          <div className="stats-grid">
             {stats.map((s, i) => (
                <div key={i} className="stat-card hover-scale">
                   <div className="stat-circle">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray={`${parseInt(s.pct)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="percentage">{s.pct}</text>
                      </svg>
                   </div>
                   <p className="stat-text">{s.text}</p>
                </div>
             ))}
          </div>
       </div>
    </div>
  )
}

// ✅ PEGA ESTO (La nueva sección)
function BreakthroughSection() {
  const { breakthroughBenefits } = MARKETING_CONTENT;
  return (
    <div className="landing-section fade-in-section" style={{padding: '60px 0'}}>
      <div className="landing-container">
        <h3 className="landing-center-title">{breakthroughBenefits.title}</h3>
        <p className="landing-center-subtitle" style={{textAlign:'center', marginBottom:'40px', color:'#64748b'}}>{breakthroughBenefits.subtitle}</p>
        
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
        <div className="landing-section fade-in-section" style={{background: '#f8fafc', borderRadius: '24px'}}>
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
    )
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
            <span className="badge-pill">Evidencia Visual</span>
            <h3 className="landing-title">{slider.title}</h3>
            <p className="landing-p">{slider.text}</p>
        </div>
        <div className="split-media">
          <div className="ba-slider-container shadow-hover" ref={containerRef} onMouseMove={handleMove} onTouchMove={handleMove} onTouchStart={handleMove}>
            <img src={slider.imgAfter} alt="Después" className="ba-img" />
            <div className="ba-label ba-after">{slider.labelAfter}</div>
            <div className="ba-overlay" style={{ width: `${sliderPos}%` }}>
              <img src={slider.imgBefore} alt="Antes" className="ba-img" style={{ filter: "grayscale(30%) contrast(1.1)" }} />
              <div className="ba-label ba-before">{slider.labelBefore}</div>
            </div>
            <div className="ba-handle" style={{ left: `${sliderPos}%` }}><div className="ba-line"></div><div className="ba-circle">⟷</div></div>
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
            <div className="comp-header"><div className="comp-col-empty"></div><div className="comp-col-us">{comparison.brandName}</div><div className="comp-col-others">{comparison.competitorName}</div></div>
            {comparison.features.map((f, i) => (
              <div key={i} className="comp-row"><div className="comp-feature-name">{f.name}</div><div className="comp-check-us">✔</div><div className="comp-check-others" style={{opacity:0.3}}>✕</div></div>
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
        {/* Título y Subtítulo Pro */}
        <h2 className="video-title-pro">{bigMedia.title}</h2>
        <p className="video-subtitle-pro">{bigMedia.subtitle}</p>
        
        <div className="video-placeholder-container">
          {bigMedia.isVideo ? (
             <video src={bigMedia.src} autoPlay loop muted playsInline className="landing-video-real" />
          ) : (
             <img src={bigMedia.src} alt="Demo" className="landing-video-cover" />
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
            <span className="badge-pill">Tecnología 3-en-1</span>
            <h3 className="landing-title">El poder de 3 tecnologías</h3>
            <p className="landing-p">La combinación más potente para esculpir tu cuerpo.</p>
            <div className="tech-list">
                <div className="tech-item hover-lift">
                    <div className="tech-icon">💥</div>
                    <div><strong>Cavitación (Rompe Grasa)</strong><p>Ataca adipocitos difíciles.</p></div>
                </div>
                <div className="tech-item hover-lift">
                    <div className="tech-icon">🔥</div>
                    <div><strong>Radiofrecuencia (Tensa)</strong><p>Genera colágeno y firmeza.</p></div>
                </div>
                <div className="tech-item hover-lift">
                    <div className="tech-icon">🔴</div>
                    <div><strong>LED Rojo (Rejuvenece)</strong><p>Mejora la textura de la piel.</p></div>
                </div>
            </div>
        </div>
        <div className="split-media"><img src="https://images.pexels.com/photos/3823063/pexels-photo-3823063.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Solución" className="landing-img-rounded shadow-hover" /></div>
      </div>
    </div>
  );
}

function AuthoritySection() {
  const { authority } = MARKETING_CONTENT;
  return (
    <div className="landing-section authority-bg fade-in-section">
      <div className="landing-container authority-flex">
        <div className="authority-img-box"><img src={authority.img} alt="Experto" className="authority-img-fixed shadow-hover" /></div>
        <div className="authority-text">
            <div className="authority-stars">★★★★★</div>
            <p className="landing-p" style={{marginBottom:"0.5rem", fontStyle:'italic'}}>"{authority.quote}"</p>
            <div className="authority-sign"><strong>{authority.name}</strong><span>{authority.job}</span></div>
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
    <div className="landing-section fade-in-section">
      <h3 className="landing-center-title">Preguntas Frecuentes</h3>
      <div className="landing-container faq-container">{faq.map((item, i) => (<div key={i} className="faq-item"><button className={`faq-question ${openIndex === i ? "active" : ""}`} onClick={() => toggle(i)}>{item.q}<span className="faq-icon">{openIndex === i ? "−" : "+"}</span></button><div className="faq-answer" style={{ maxHeight: openIndex === i ? "300px" : "0" }}><p style={{paddingTop: '15px'}}>{item.a}</p></div></div>))}</div>
    </div>
  );
}

function TestimonialsSection() {
  const reviews = [
    { title: "¡Adiós celulitis!", author: "Mariana R.", text: "Después de 4 semanas noto la piel muchísimo más lisa.", image: "https://d3g5hqndtiniji.cloudfront.net/images/53b5c235-d817-4ded-b020-4408426b6e2b/f971c307-6b0c-40fd-8d90-33d093ce5829.jpg?d=300x400&crop=center" },
    { title: "Mi abdomen cambió", author: "Laura G.", text: "Me ayudó a tensar la piel mucho mejor que cualquier crema.", image: null },
    { title: "Potente y eficaz", author: "Sofía P.", text: "Se siente el calor de la radiofrecuencia trabajando.", image: "https://d3g5hqndtiniji.cloudfront.net/images/53b5c235-d817-4ded-b020-4408426b6e2b/e7960110-9e02-4be7-8d98-5dacf6279d4f.jpg?d=300x400&crop=center" },
    { title: "Envío rápido", author: "Valentina S.", text: "Llegó en perfecto estado y muy rápido.", image: "https://d3g5hqndtiniji.cloudfront.net/images/53b5c235-d817-4ded-b020-4408426b6e2b/2a5d89ca-a45a-4c5e-9862-e0cb97d0cf55.jpg?d=300x400&crop=center" },
    { title: "Súper fácil", author: "Micaela T.", text: "Lo uso mientras miro una serie. Es cómodo.", image: null },
    { title: "Excelente atención", author: "Andrea L.", text: "Me asesoraron muy bien por WhatsApp.", image: null }
  ];
  return (
    <div id="reviews-section" className="landing-section fade-in-section" style={{ background: "#f8fafc", padding: "60px 0" }}>
      <div className="landing-container">
        <div style={{ marginBottom: "40px", textAlign: "center" }}><h3 className="tm-main-title">Historias Reales</h3><p className="tm-subtitle">Más de 800 clientas felices.</p></div>
        <div className="reviews-grid">{reviews.map((r, i) => (<div key={i} className="tm-card hover-lift"><div className="tm-card-top"><span className="tm-card-title">{r.title}</span><span className="tm-stars">★★★★★</span></div><p className="tm-text">“{r.text}”</p>{r.image && (<div className="tm-review-img-box"><img src={r.image} alt="Review" className="tm-review-img" loading="lazy" /></div>)}<div className="tm-author"><span style={{fontWeight:'800'}}>{r.author}</span></div></div>))}</div>
      </div>
    </div>
  );
}

/* =========================
   HELPERS & MAIN
========================= */
function formatARS(n) { try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); } catch { return `$${n}`; } }
function Stars({ value = 4.9 }) { return (<div className="hero-stars"><span className="hero-star on">★</span><span className="hero-star on">★</span><span className="hero-star on">★</span><span className="hero-star on">★</span><span className="hero-star on">★</span> <span className="hero-ratingText">4.9/5</span></div>); }
function moneyARS(n) { const num = Number(n); if (Number.isNaN(num)) return "$0"; return `$${Math.round(num).toLocaleString("es-AR")}`; }

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const storeName = import.meta.env.VITE_STORE_NAME || "BoomHausS";

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
      try { setLoading(true); const res = await api.get(`/products/${id}`); if (res.data?.ok) setProduct(res.data.data); else setError("No se pudo cargar."); } catch (e) { setError("Error al cargar."); } finally { setLoading(false); }
    }
    fetchOne();
  }, [id]);

  const images = useMemo(() => { if (!product) return []; const arr = []; if (product.imageUrl) arr.push(product.imageUrl); if (Array.isArray(product.images)) product.images.forEach((x) => { if (x && typeof x === "string" && !arr.includes(x)) arr.push(x); }); return arr; }, [product]);
  const nextImage = () => { if (images.length > 0) setActiveImgIndex((prev) => (prev + 1) % images.length); };
  const prevImage = () => { if (images.length > 0) setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length); };
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => { if (!touchStart || !touchEnd) return; const distance = touchStart - touchEnd; if (distance > minSwipeDistance) nextImage(); if (distance < -minSwipeDistance) prevImage(); };

  const price = Number(product?.price) || 0;
  const compareAt = Number(product?.compareAtPrice) || (price ? Math.round(price * 2) : 0);
  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 894;
  
  const pack2Discount = 20;
  const unitPrice = price;
  const totalQty = qty;
  const promoOn = bundle === 2;
  const pairsQty = promoOn ? Math.floor(totalQty / 2) * 2 : 0;
  const remQty = totalQty - pairsQty;
  const displayTotal = promoOn ? Math.round(pairsQty * unitPrice * (1 - pack2Discount / 100) + remQty * unitPrice) : Math.round(totalQty * unitPrice);
  const transferPrice = Math.round(displayTotal * 0.90); 

  const contentId = useMemo(() => product?.sku || product?.productId || product?._id || (product?.id ? String(product.id) : null) || id || "BODY_SCULPT_1", [product, id]);

  useEffect(() => { if (!product) return; if (lastViewedRef.current === contentId) return; lastViewedRef.current = contentId; track("ViewContent", { content_ids: [String(contentId)], content_type: "product", value: Number(price) || 0, currency: "ARS" }); }, [product, contentId, price]);

  const handleBuyNow = () => { 
    if (!product) return; 
    setRedirecting(true);
    track("InitiateCheckout", { content_ids: [String(contentId)], content_type: "product", value: Number(displayTotal) || 0, currency: "ARS", num_items: Number(totalQty) || 1 }); 
    const linkMercadoPago = "https://link.mercadopago.com.ar/TU_LINK"; 
    setTimeout(() => { window.location.href = linkMercadoPago; }, 1500);
  };

  const handleAddToCart = () => { 
      if (!product) return; 
      track("AddToCart", { content_ids: [String(contentId)], content_type: "product", value: Number(displayTotal) || 0, currency: "ARS", num_items: Number(totalQty) || 1 }); 
      const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null; 
      addItem(product, totalQty, promo ? { promo } : undefined); 
      setShowToast(true); setTimeout(() => setShowToast(false), 5000); 
      window.dispatchEvent(new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } })); 
  };

  const scrollToReviews = (e) => { e.preventDefault(); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const arrowStyle = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", cursor: "pointer", zIndex: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", color: "#1e293b" };

  if (loading) return (<main className="section"><div className="container"><div className="pd-skeleton card"><div className="pd-skel-left" /><div className="pd-skel-right" /></div></div></main>);
  if (error || !product) return (<main className="section"><div className="container"><div className="card" style={{ padding: "1.1rem" }}><div className="pd-badge">Error</div><p className="pd-error" style={{ marginTop: "0.75rem" }}>{error || "Producto no encontrado."}</p><div style={{ marginTop: "0.9rem" }}><Link className="btn btn-ghost" to="/products">← Volver</Link></div></div></div></main>);

  return (
    <main className="section main-wrapper">
      <div className="container" style={{ marginTop: "20px" }}>
        
        {/* CORRECCIÓN: align-items: flex-start (CRUCIAL PARA ELIMINAR EL ESPACIO EN BLANCO) */}
        <div className="pd-grid" style={{ alignItems: "flex-start" }}>
          
          {/* MEDIA COLUMN: position: sticky PARA PC + height: auto PARA MÓVIL */}
          <section className="pd-media card shadow-hover" style={{ padding: 0, display: "flex", flexDirection: "column", border: 'none', position: 'sticky', top: '20px', zIndex: 90, height: 'auto' }}>
            <div className="pd-mediaMain" style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#f8fbff", cursor: "grab", touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <div className="pd-discount" style={{ zIndex: 10 }}>50% <span>OFF</span></div>
              
              {/* === SOLUCIÓN PARA QUE NO SE CORTE LA IMAGEN === */}
              {images.length > 0 ? (
                <img 
                    className="pd-mainImg" 
                    src={images[activeImgIndex]} 
                    alt={product.name} 
                    loading="lazy" 
                    onDragStart={(e) => e.preventDefault()} 
                    style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "contain", /* OBLIGA A QUE ENTRE TODA */
                        position: "absolute", 
                        inset: 0, 
                        pointerEvents: "none",
                        background: "white" /* Rellena huecos con blanco */
                    }} 
                />
              ) : (<div className="pd-empty">Sin imagen</div>)}
              {/* ============================================== */}

              {/* FLECHAS DE NAVEGACIÓN */}
              {images.length > 1 && (
                <>
                  <button type="button" style={{ ...arrowStyle, left: "15px" }} onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
                  <button type="button" style={{ ...arrowStyle, right: "15px" }} onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
                </>
              )}
              
              {/* DOTS */}
              {images.length > 1 && (
                  <div className="pd-dots-container">
                      {images.map((_, idx) => (
                          <div key={idx} className={`pd-dot ${idx === activeImgIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveImgIndex(idx); }} />
                      ))}
                  </div>
              )}
            </div>
            {/* THUMBS */}
            <div className="pd-thumbs-desktop">
               {images.slice(0, 5).map((img, idx) => (<button key={img} type="button" className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`} onClick={() => setActiveImgIndex(idx)}><img src={img} alt="thumb" /></button>))}
            </div>
          </section>

          {/* INFORMACIÓN DEL PRODUCTO */}
          <aside className="pd-info fade-in-section">
            <div className="hero-top">
              <div className="hero-proof" style={{marginBottom: "8px"}}>
                  <span className="hero-pill-hot pulse-animation">🔥 Viral en TikTok</span>
                  <div className="hero-proofText"><b>{Number(soldCount).toLocaleString("es-AR")}</b> unidades vendidas</div>
              </div>
              <h1 className="hero-title">{product.name}</h1>
              <div className="hero-ratingRow"><Stars /> <a href="#reviews-section" onClick={scrollToReviews} className="hero-reviews" style={{textDecoration:'underline', cursor:'pointer'}}>Ver 894 opiniones</a></div>
              <p className="hero-mini-desc">{MARKETING_CONTENT.miniDescription}</p>
              
              <div className="price-block-container shadow-hover">
                  <div className="main-price-row">
                      <span className="hero-price">{formatARS(displayTotal)}</span>
                      {compareAt > price && (<><span className="hero-compare">{formatARS(compareAt * totalQty)}</span><span className="hero-pill-off">50% OFF</span></>)}
                  </div>
                  
                  <div className="transfer-card">
                      <div className="transfer-icon">⚡</div>
                      <div className="transfer-text">
                          <div className="transfer-label">O pagando con Transferencia:</div>
                          <div className="transfer-amount">{formatARS(transferPrice)} <span className="transfer-tag">AHORRÁ 10% EXTRA</span></div>
                      </div>
                  </div>
              </div>

              <div className="pd-trust-icons">
                 <div className="trust-icon-item"><span>🛡️</span> Garantía 90 días</div>
                 <div className="trust-icon-item"><span>🚚</span> Envío Gratis</div>
                 <div className="trust-icon-item"><span>✅</span> Tecnología Segura</div>
              </div>
            </div>
            
            <div className="pd-divider" style={{marginTop:'1.5rem'}}>Elegí tu opción</div>
            <div className="pd-bundles">
              <label className={`pd-bundle hover-lift ${bundle === 1 ? "is-selected" : ""}`}><input type="radio" name="bundle" checked={bundle === 1} onChange={() => { setBundle(1); setQty(1); }} /><div className="pd-bundleBody"><div className="pd-bundleLeft"><div className="pd-bundleTitle">1 Dispositivo BodySculpt <span className="pd-miniTag">Kit Esencial</span></div><div className="pd-bundleSub">Incluye gel conductor de regalo</div></div><div className="pd-bundleRight">{moneyARS(unitPrice)}</div></div></label>
              <label className={`pd-bundle hover-lift ${bundle === 2 ? "is-selected" : ""}`}><input type="radio" name="bundle" checked={bundle === 2} onChange={() => { setBundle(2); setQty((q) => (q < 2 ? 2 : q)); }} /><div className="pd-bundleBody"><div className="pd-bundleLeft"><div className="pd-bundleTitle">Pack Doble (2 u.) <span className="pd-miniTag highlight">Mejor Valor</span></div><div className="pd-bundleSub"><b>Ahorrá</b> {pack2Discount}% + Envío Prioritario</div></div><div className="pd-bundleRight">{moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}<div className="pd-bundleCompare">{moneyARS(unitPrice * 2)}</div></div></div></label>
            </div>
            
            <div className="scarcity-text" style={{marginTop: '20px', marginBottom: '10px'}}>
                <span className="scarcity-icon">⚠️</span> ¡Atención! Quedan solo 3 unidades disponibles
            </div>

            <div>
                <button className="pd-ctaSecondary btn-breathing-intense" type="button" onClick={handleBuyNow} disabled={redirecting}>
                    {redirecting ? "PROCESANDO PAGO..." : "COMPRAR AHORA - ENVÍO GRATIS"}
                </button>
                <div style={{textAlign:'center', marginTop:'15px'}}>
                     <button type="button" onClick={handleAddToCart} className="pd-ctaPrimary-outline">Agregar al carrito</button>
                </div>
            </div>

            <div className="accordion-wrapper" style={{marginTop: '30px'}}>
                 <div className="accordion-item">
                    <button className="accordion-header" onClick={() => setIsDescExpanded(!isDescExpanded)}>
                        <span>Especificaciones y Tecnología</span>
                        <span>{isDescExpanded ? '−' : '+'}</span>
                    </button>
                    {isDescExpanded && (
                        <div className="accordion-content fade-in-section">
                             <p>{product.description || MARKETING_CONTENT.miniDescription}</p>
                             <ul style={{paddingLeft:'20px', marginTop:'15px', color:'#555', display:'flex', flexDirection:'column', gap:'8px'}}>
                                 <li><strong>Cavitación Ultrasónica:</strong> 1 MHz.</li>
                                 <li><strong>Radiofrecuencia (RF):</strong> 1 MHz multipolar.</li>
                                 <li><strong>LED Rojo:</strong> 625nm.</li>
                                 <li><strong>Uso:</strong> Corporal (No facial).</li>
                             </ul>
                        </div>
                    )}
                 </div>
                 <div className="accordion-item">
                    <button className="accordion-header" onClick={() => setIsShippingExpanded(!isShippingExpanded)}>
                        <span>Envíos y Garantía</span>
                        <span>{isShippingExpanded ? '−' : '+'}</span>
                    </button>
                    {isShippingExpanded && (
                        <div className="accordion-content fade-in-section">
                             <ul style={{paddingLeft:'20px', marginTop:'15px', color:'#555', display:'flex', flexDirection:'column', gap:'10px'}}>
                                 <li><strong>Envío Gratis:</strong> A todo el país.</li>
                                 <li><strong>Despacho Rápido:</strong> Procesamos en 24hs.</li>
                                 <li><strong>Garantía de 90 días:</strong> Por fallas de fábrica.</li>
                                 <li><strong>Compra Protegida:</strong> Vía Mercado Pago.</li>
                             </ul>
                        </div>
                    )}
                 </div>
            </div>

          </aside>
        </div>

        {/* === RESTO DE SECCIONES === */}
        <div style={{ marginTop: "4rem", display: "flex", flexDirection: "column", gap: "5rem", paddingBottom: "100px" }}>
          <ClinicalStatsSection />
          <BeforeAfterSlider />
          <AuthoritySection />
          <BreakthroughSection />
          <ComparisonTable />
          <ProblemSolutionSection />
          <WhatsIncludedSection />
          <BigMediaSection />
          <TestimonialsSection />
          <FaqSection />
        </div>
      </div>

      {showToast && (<div className="pd-toast-wrapper"><div className="pd-toast-content"><div className="pd-toast-main"><img src={images[0]} alt="" className="pd-toast-img" /><div className="pd-toast-info"><span className="pd-toast-status">✓ ¡Agregado!</span><span className="pd-toast-name">{product.name}</span></div><button className="pd-toast-close" onClick={() => setShowToast(false)}>✕</button></div><div className="pd-toast-actions"><button className="pd-toast-btn-secondary" onClick={() => navigate('/cart')}>IR AL CARRITO</button><button className="pd-toast-btn-primary" onClick={() => navigate('/checkout')}>FINALIZAR COMPRA</button></div><div className="pd-toast-progress"></div></div></div>)}

      {/* STICKY BAR */}
      <div className="sticky-mobile-bar-pro fade-in-section">
        <div className="sticky-pro-left">
            <span className="sticky-pro-label">Envío Gratis termina en:</span>
            <div className="sticky-pro-price-row">
               <span style={{fontWeight:'800', color:'#dc2626'}}><CountdownTimer /></span>
            </div>
        </div>
        <button className="sticky-pro-btn btn-breathing" onClick={handleBuyNow} disabled={redirecting}>
            {redirecting ? "..." : "COMPRAR AHORA"}
        </button>
      </div>

      <style>{`
/* === ARREGLO PRO ANIMADO (BIG MEDIA SECTION) === */
        
        /* Fondo con degradado radial y elementos animados */
        .full-width-bg { 
            /* Base: Degradado radial profundo para dar foco */
            background: radial-gradient(circle at 70% 30%, #0B5CFF 0%, #002a7a 100%);
            width: 100vw; 
            position: relative; 
            left: 50%; 
            right: 50%; 
            margin-left: -50vw; 
            margin-right: -50vw; 
            padding: 90px 0; /* Un poco más de aire */
            color: white;
            overflow: hidden; /* IMPORTANTE: Para contener las animaciones */
        }
        
        .landing-video-real { 
            width: 100%; 
            height: 100%; 
            object-fit: contain !important; /* Clave: Contener en vez de cubrir */
            background: #000; /* Fondo negro elegante para los espacios sobrantes */
            display: block;
        }

        /* Elemento animado 1 (Luz superior izquierda) */
        .full-width-bg::before {
            content: '';
            position: absolute;
            top: -20%;
            left: -10%;
            width: 600px;
            height: 600px;
            background: rgba(255, 255, 255, 0.1); /* Luz blanca sutil */
            border-radius: 50%;
            filter: blur(120px); /* Difuminado intenso */
            animation: floatBubble1 15s infinite alternate ease-in-out;
            z-index: 0;
            pointer-events: none;
        }

        /* Elemento animado 2 (Luz inferior derecha) */
        .full-width-bg::after {
            content: '';
            position: absolute;
            bottom: -20%;
            right: -10%;
            width: 500px;
            height: 500px;
            background: rgba(11, 92, 255, 0.3); /* Luz azul más intensa */
            border-radius: 50%;
            filter: blur(100px);
            animation: floatBubble2 18s infinite alternate-reverse ease-in-out;
            z-index: 0;
            pointer-events: none;
        }

        /* Asegurar que el contenido (texto y video) esté por encima del fondo animado */
        .landing-container.text-center {
            position: relative;
            z-index: 2;
        }

        /* Animaciones de flotación */
        @keyframes floatBubble1 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(50px, 50px) scale(1.1); }
        }
        @keyframes floatBubble2 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(-60px, -40px) scale(1.05); }
        }

        /* Tipografía del Título (Centrado asegurado) */
        .video-title-pro {
            text-align: center;
            font-size: 2.8rem;
            font-weight: 900;
            margin-bottom: 15px;
            letter-spacing: -1px;
            color: white;
            text-shadow: 0 4px 10px rgba(0,0,0,0.2); /* Sombra sutil al texto */
        }

        /* Tipografía del Subtítulo (Centrado asegurado) */
        .video-subtitle-pro {
            text-align: center;
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.95);
            margin-bottom: 50px;
            font-weight: 500;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.6;
        }
        
        /* Contenedor del video con sombra "Glow" intensa */
        .video-placeholder-container {
            border-radius: 24px;
            overflow: hidden;
            /* Sombra profunda + Borde translúcido brillante */
            box-shadow: 0 35px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15);
            max-width: 980px;
            margin: 0 auto;
            aspect-ratio: 16/9;
            background: #000;
            position: relative;
            transform: translateZ(0); /* Mejora rendimiento en algunos navegadores */
        }

        /* Ajuste para móvil */
        @media (max-width: 768px) {
            .full-width-bg { padding: 60px 0; }
            .full-width-bg::before, .full-width-bg::after { width: 300px; height: 300px; filter: blur(60px); } /* Orbes más pequeños */
            .video-title-pro { font-size: 2rem; }
            .video-subtitle-pro { font-size: 1.1rem; padding: 0 20px; margin-bottom: 35px; }
            .video-placeholder-container { border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); }
        }
        /* === ESTILOS ORIGINALES === */
        
        /* Animaciones & Helpers */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-section { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes pulseIntense { 0% { box-shadow: 0 0 0 0 rgba(11, 92, 255, 0.7); transform: scale(1); } 70% { box-shadow: 0 0 0 15px rgba(11, 92, 255, 0); transform: scale(1.02); } 100% { box-shadow: 0 0 0 0 rgba(11, 92, 255, 0); transform: scale(1); } }
        .btn-breathing-intense { animation: pulseIntense 2s infinite; }
        .btn-breathing { animation: breathe 3s ease-in-out infinite; }
        @keyframes breathe { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
        .hover-lift { transition: all 0.3s ease; } .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
        .shadow-hover { transition: box-shadow 0.3s ease; } .shadow-hover:hover { box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important; }
        .spin-on-hover { transition: transform 0.5s ease; } .included-item:hover .spin-on-hover { transform: rotateY(360deg); }
        .pulse-animation { animation: breathe 2s infinite; }

        /* Layout Principal */
        .section.main-wrapper { background: #fff; overflow-x: hidden; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
        
        /* GRID: align-items: flex-start para que la imagen no se estire */
        .pd-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 50px; align-items: flex-start; }
        @media (max-width: 990px) { .pd-grid { grid-template-columns: 1fr; gap: 30px; } }
        
        /* Media (Sticky en Desktop, Normal en Móvil) */
        @media (max-width: 990px) { .pd-media { position: relative !important; top: 0 !important; } }

        /* Galería (Dots & Thumbs) */
        .pd-dots-container { position: absolute; bottom: 20px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 10; pointer-events: none; }
        .pd-dot { width: 10px; height: 10px; background: rgba(0,0,0,0.2); border-radius: 50%; cursor: pointer; transition: all 0.3s; pointer-events: auto; border: 1px solid rgba(255,255,255,0.5); }
        .pd-dot.active { background: #0B5CFF; transform: scale(1.2); border-color: #0B5CFF; }
        .pd-thumbs-desktop { padding: 15px; background: #fff; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; overflow-x: auto; }
        @media (max-width: 768px) { .pd-thumbs-desktop { display: none; } }
        .pd-thumb { min-width: 70px; height: 70px; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; padding: 0; cursor: pointer; transition: all 0.2s; }
        .pd-thumb.is-active { border-color: #0B5CFF; box-shadow: 0 0 0 2px rgba(11, 92, 255, 0.2); }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; }

        /* Badges */
        .badge-pill { background: #e0f2fe; color: #0284c7; padding: 6px 14px; border-radius: 30px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; margin-bottom: 15px; }
        .hero-pill-hot { background: #FFF1F2; color: #E11D48; font-weight: 800; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-right: 10px; border: 1px solid #FECDD3; display: inline-flex; align-items: center; }
        .hero-pill-off { background: #111; color: white; font-size: 0.8rem; font-weight: 700; padding: 5px 10px; border-radius: 6px; margin-left: 10px; vertical-align: middle; }

        /* Pricing */
        .price-block-container { background: #f8fafc; padding: 25px; border-radius: 20px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .main-price-row { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
        .hero-price { font-size: 2.4rem; font-weight: 900; color: #111827; letter-spacing: -0.5px; line-height: 1; }
        .hero-compare { font-size: 1.3rem; color: #9CA3AF; text-decoration: line-through; margin-left: 5px; }
        .transfer-card { background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 15px; display: flex; align-items: center; gap: 15px; }
        .transfer-icon { font-size: 1.8rem; }
        .transfer-label { font-size: 0.9rem; color: #065f46; font-weight: 700; margin-bottom: 4px; }
        .transfer-amount { font-size: 1.35rem; color: #059669; font-weight: 900; display: flex; flex-direction: column; line-height: 1; }
        .transfer-tag { font-size: 0.75rem; background: #059669; color: white; padding: 4px 10px; border-radius: 20px; margin-top: 6px; width: fit-content; font-weight: 800; letter-spacing: 0.5px; }

        /* Scarcity */
        .scarcity-text { color: #dc2626; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px; animation: textFade 2s ease-in-out infinite; background: #fef2f2; padding: 10px; border-radius: 8px; border: 1px solid #fee2e2; }
        @keyframes textFade { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 30px; }
        .stat-card { text-align: center; padding: 20px; background: white; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .stat-circle { width: 100px; height: 100px; margin: 0 auto 15px; }
        .circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 250px; }
        .circle-bg { fill: none; stroke: #eee; stroke-width: 2; }
        .circle { fill: none; stroke-width: 2.5; stroke-linecap: round; animation: progress 1s ease-out forwards; stroke: #0B5CFF; }
        .percentage { fill: #0B5CFF; font-family: sans-serif; font-weight: 800; font-size: 0.55em; text-anchor: middle; }
        .stat-text { font-size: 1rem; color: #334155; font-weight: 700; line-height: 1.4; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; gap: 20px; } .stat-card { display: flex; align-items: center; text-align: left; gap: 20px; padding: 15px; } .stat-circle { margin: 0; width: 70px; height: 70px; } }

        /* Checklist Section */
        .why-choose-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        @media (max-width: 600px) { .why-choose-grid { grid-template-columns: 1fr; gap: 20px; } }
        .why-item { display: flex; gap: 15px; align-items: flex-start; }
        .why-check { background: #ecfdf5; color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; font-size: 1.1rem; }
        .why-text strong { display: block; color: #1e293b; font-size: 1.05rem; margin-bottom: 4px; }
        .why-text p { margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5; }

        /* Included */
        .included-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin-top: 30px; }
        .included-item { background: white; padding: 25px 15px; border-radius: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .included-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .included-name { font-size: 0.95rem; font-weight: 700; color: #334155; }

        /* Tech List */
        .tech-list { margin-top: 25px; display: flex; flex-direction: column; gap: 15px; }
        .tech-item { display: flex; gap: 15px; align-items: flex-start; background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .tech-icon { font-size: 1.8rem; background: #f0f9ff; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; flex-shrink: 0; }
        .tech-item strong { display: block; color: #1e293b; font-size: 1rem; margin-bottom: 5px; }
        .tech-item p { margin: 0; font-size: 0.9rem; color: #64748b; line-height: 1.5; }

        /* Accordions */
        .accordion-item { border-bottom: 1px solid #e2e8f0; }
        .accordion-header { width: 100%; display: flex; justify-content: space-between; padding: 20px 0; background: none; border: none; font-weight: 800; color: #1e293b; cursor: pointer; font-size: 1.05rem; align-items: center; }
        .accordion-content { padding-bottom: 25px; color: #475569; font-size: 0.95rem; line-height: 1.7; }

        /* Comparison Table */
        .comp-table { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 5px 20px rgba(0,0,0,0.05); margin-top: 25px; }
        .comp-header { display: flex; background: #f8fafc; padding: 20px 25px; border-bottom: 2px solid #e2e8f0; align-items: center; }
        .comp-col-empty { flex: 1.5; }
        .comp-col-us { flex: 1; text-align: center; font-weight: 900; font-size: 1.2rem; color: #0B5CFF; }
        .comp-col-others { flex: 1; text-align: center; font-weight: 700; font-size: 1rem; color: #94a3b8; }
        .comp-row { display: flex; padding: 18px 25px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .comp-row:last-child { border-bottom: none; }
        .comp-feature-name { flex: 1.5; font-weight: 600; color: #334155; font-size: 1rem; }
        .comp-check-us { flex: 1; text-align: center; color: #10b981; font-weight: 900; font-size: 1.4rem; }
        .comp-check-others { flex: 1; text-align: center; color: #ef4444; font-weight: 900; font-size: 1.4rem; opacity: 0.3; }
        .landing-center-subtitle { text-align: center; font-size: 1.1rem; color: #64748b; margin-bottom: 35px; max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.6; }

        /* Slider Antes/Después */
        .ba-slider-container { position: relative; width: 100%; max-width: 650px; margin: 0 auto; overflow: hidden; border-radius: 20px; cursor: ew-resize; box-shadow: 0 15px 35px rgba(0,0,0,0.1); user-select: none; aspect-ratio: 4/3; }
        .ba-img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
        .ba-overlay { position: absolute; top: 0; left: 0; height: 100%; overflow: hidden; border-right: 3px solid white; }
        .ba-overlay .ba-img { width: auto; height: 100%; max-width: none; }
        .ba-handle { position: absolute; top: 0; bottom: 0; width: 44px; margin-left: -22px; display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; }
        .ba-line { position: absolute; top: 0; bottom: 0; width: 3px; background: white; left: 50%; transform: translateX(-50%); box-shadow: 0 0 8px rgba(0,0,0,0.3); }
        .ba-circle { width: 50px; height: 50px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #0B5CFF; box-shadow: 0 5px 15px rgba(0,0,0,0.2); position: relative; z-index: 2; }
        .ba-label { position: absolute; top: 20px; background: rgba(0,0,0,0.75); color: white; padding: 8px 14px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; pointer-events: none; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px); }
        .ba-before { left: 20px; }
        .ba-after { right: 20px; }

        /* Authority Section */
        .authority-bg { background: #f0f9ff; border-left: 6px solid #0B5CFF; border-radius: 24px; padding: 50px; box-shadow: 0 15px 40px rgba(0,0,0,0.05); }
        .authority-flex { display: flex; gap: 40px; align-items: center; }
        .authority-img-fixed { width: 140px !important; height: 140px !important; border-radius: 50%; object-fit: cover; border: 5px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: block; }
        .authority-text { flex: 1; }
        .authority-stars { color: #fbbf24; font-size: 1.4rem; letter-spacing: 3px; margin-bottom: 20px; }
        .authority-sign { margin-top: 25px; }
        .authority-sign strong { display: block; color: #0f172a; font-size: 1.2rem; font-weight: 900; }
        .authority-sign span { font-size: 1rem; color: #64748b; font-weight: 600; }
        @media (max-width: 768px) { .authority-bg { padding: 30px; } .authority-flex { flex-direction: column; text-align: center; gap: 25px; } .authority-sign { margin-top: 20px; } }

        /* FAQ */
        .faq-item { width: 100%; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.03); transition: all 0.3s ease; }
        .faq-question { width: 100%; text-align: left; padding: 20px 25px; background: #fff; border: none; font-weight: 800; color: #1e293b; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 1.05rem; }
        .faq-question.active { background: #f8fafc; color: #0B5CFF; }
        .faq-answer { padding: 0 25px; overflow: hidden; background: white; color: #475569; line-height: 1.7; transition: all 0.3s ease; }
        .faq-question.active + .faq-answer { padding: 0 25px 25px 25px; }

        /* Sticky Bar Pro (Móvil) OPTIMIZADA */
        .sticky-mobile-bar-pro { 
            position: fixed; bottom: 20px; left: 15px; right: 15px; 
            background: rgba(255,255,255,0.98); backdrop-filter: blur(12px);
            padding: 12px 20px; z-index: 9999; 
            display: flex; align-items: center; justify-content: space-between; 
            border-radius: 60px; box-shadow: 0 15px 40px rgba(0,0,0,0.15); 
            border: 1px solid #e2e8f0; gap: 15px;
        }
        @media (min-width: 991px) { .sticky-mobile-bar-pro { display: none; } }
        .sticky-pro-left { display: flex; flex-direction: column; gap: 2px; }
        .sticky-pro-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .sticky-pro-price-row { display: flex; align-items: center; gap: 6px; }
        .sticky-pro-btn { 
            background: #0B5CFF; color: white; border: none; 
            padding: 14px 28px; border-radius: 40px; 
            font-weight: 800; font-size: 1rem; cursor: pointer; 
            box-shadow: 0 8px 25px rgba(11, 92, 255, 0.35); 
            transition: all 0.2s; white-space: nowrap;
        }
        .sticky-pro-btn:active { transform: scale(0.95); }

        /* Bundles & Buttons - Ajuste de espacio */
        .pd-bundles { display: flex; flex-direction: column; gap: 18px; margin-top: 25px; }
        .pd-bundle { border: 2px solid #e2e8f0; border-radius: 20px; padding: 18px 22px; cursor: pointer; transition: all 0.2s; position: relative; background: white; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .pd-bundle.is-selected { border-color: #0B5CFF; background: #eff6ff; box-shadow: 0 0 0 2px #0B5CFF inset; transform: scale(1.01); }
        .pd-bundleTitle { font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 12px; font-size: 1.1rem; flex-wrap: wrap; }
        .pd-miniTag { font-size: 0.75rem; background: #e2e8f0; padding: 4px 10px; border-radius: 20px; color: #475569; font-weight: 700; text-transform: uppercase; white-space: nowrap; flex-shrink: 0; }
        .pd-miniTag.highlight { background: #fef08a; color: #854d0e; }
        .pd-ctaSecondary { width: 100%; background: #0B5CFF; color: white; border: none; padding: 18px; border-radius: 16px; font-weight: 900; font-size: 1.2rem; cursor: pointer; letter-spacing: 0.5px; transition: all 0.3s; box-shadow: 0 10px 30px rgba(11, 92, 255, 0.3); }
        .pd-ctaSecondary:hover { background: #094ac9; box-shadow: 0 15px 40px rgba(11, 92, 255, 0.4); transform: translateY(-2px); }
        .pd-ctaPrimary-outline { background: none; border: 2px solid #e2e8f0; padding: 12px 25px; border-radius: 30px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
        .pd-ctaPrimary-outline:hover { border-color: #0B5CFF; color: #0B5CFF; }

        /* Reviews */
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 35px; margin-top: 50px; align-items: start; }
        @media (max-width: 990px) { .reviews-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .reviews-grid { grid-template-columns: 1fr; } }
        .tm-card { background: #fff; border: 1px solid #f1f1f1; border-radius: 24px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); display: flex; flex-direction: column; height: 100%; transition: all 0.3s ease; }
        .tm-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.05); }
        .tm-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .tm-card-title { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
        .tm-review-img-box { margin-bottom: 25px; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; height: 200px; }
        .tm-review-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s; }
        .tm-card:hover .tm-review-img { transform: scale(1.05); }

        /* === BREAKTHROUGH GRID (NUEVA SECCIÓN) === */
        .breakthrough-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        }
        .breakthrough-card {
            background: white;
            border: 1px solid #f1f5f9;
            border-radius: 24px;
            padding: 30px 25px;
            text-align: left; /* Alineado a la izquierda para mejor lectura */
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .breakthrough-icon {
            font-size: 2.5rem;
            background: #f0f9ff;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            align-self: flex-start;
        }
        .breakthrough-title {
            font-size: 1.2rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }
        .breakthrough-desc {
            font-size: 0.95rem;
            color: #64748b;
            line-height: 1.6;
            margin: 0;
        }

        @media (max-width: 990px) {
            .breakthrough-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .breakthrough-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}