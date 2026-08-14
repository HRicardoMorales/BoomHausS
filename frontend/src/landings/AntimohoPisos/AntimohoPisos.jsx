// src/landings/AntimohoPisos/AntimohoPisos.jsx
// ─────────────────────────────────────────────────────────────────────────
// Landing "Anti-Moho PRO" — réplica adaptada de clean-eez.com/pages/grouteez-header
// Componente dedicado (misma estructura que LuxCoveLED / DepiladoraIPL).
// Ruta: /lp/antimoho-pisos
//
// ⚠️ TODO ANTES DE PUBLICAR — buscá "PLACEHOLDER" / "EDITAR" en este archivo:
//   1. Reemplazar los <ImgPlaceholder> por fotos reales del producto
//      (guardalas en ./images/ y usá <img src={...} />).
//   2. Revisar precios de BUNDLES (son placeholders en ARS).
//   3. Completar CONTACT_EMAIL, GUARANTEE_DAYS y la historia de marca.
//   4. Cambiar REVIEWS_DATA por reseñas reales verificadas.
//   5. Dar de alta el producto en el admin con slug "antimoho-pisos" si querés
//      que traiga precio/stock reales desde la API (si no existe, la landing
//      sigue funcionando con los valores placeholder de acá abajo).
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../context/CartContext';
import { trackWithCapi } from '../../lib/metaPixel';
import api from '../../services/api';
import './AntimohoPisos.css';

/* ── Constantes de producto ──────────────────────────────────────────── */
const PRODUCT_SLUG   = 'antimoho-pisos';
const CHECKOUT_NAME  = 'Anti-Moho PRO — Kit para Pisos y Juntas'; // EDITAR
const BRAND_NAME     = 'RENOVA'; // Marca usada SOLO en esta landing (no BoomHausS)
const CONTACT_EMAIL  = 'contacto@renova.com'; // PLACEHOLDER — reemplazar
const GUARANTEE_DAYS = 30; // PLACEHOLDER — política real de devolución

// 🖼 PLACEHOLDER — se usa solo si el producto en la base no tiene imágenes
// cargadas todavía. En cuanto subas fotos reales en /admin/products, la
// landing las va a mostrar automáticamente (ver galería más abajo).
const FALLBACK_GALLERY = [
  { label: 'Foto 1 — Botella del producto sola' },
  { label: 'Foto 2 — Aplicando en las juntas' },
  { label: 'Foto 3 — Antes / Después' },
  { label: 'Foto 4 — Kit completo con cepillo' },
  { label: 'Foto 5 — Detalle de textura del piso' },
];

// 💰 PLACEHOLDER — precios en ARS, editables. compareAt = precio tachado.
const BUNDLES = [
  {
    id: 0,
    qty: 1,
    label: '1 Botella + Cepillo',
    badge: '',
    pctLabel: '10% OFF',
    price: 13990,
    compareAt: 15990,
  },
  {
    id: 1,
    qty: 2,
    label: '2 Botellas + Cepillo',
    badge: 'MÁS ELEGIDO',
    pctLabel: '15% OFF',
    price: 24990,
    compareAt: 31980,
  },
  {
    id: 2,
    qty: 3,
    label: '3 Botellas + Cepillo doble',
    badge: 'MAYOR AHORRO',
    pctLabel: '20% OFF',
    price: 34990,
    compareAt: 47970,
  },
];
const DEFAULT_BUNDLE_IDX = 1; // "Más elegido" preseleccionado, como el modelo

/* ── Íconos inline (reemplazan a los PNG del sitio modelo) ───────────── */
const IconShield = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IconDropletOff = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3s6 6.5 6 11a6 6 0 01-11.3 2.8" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </svg>
);
const IconStanding = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M12 8v6M12 14l-3.5 6M12 14l3.5 6M8 10l4-1.5 4 1.5" />
  </svg>
);
const IconHome = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" />
  </svg>
);
const IconTruck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="1.5" y="7" width="13" height="9" rx="1" />
    <path d="M14.5 10h4l3 3v3h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </svg>
);
const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 018 0v3.5" />
  </svg>
);
const IconPackage = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" />
  </svg>
);
const IconRefresh = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 12a9 9 0 0115.5-6.3L21 8M21 4v4h-4" />
    <path d="M21 12a9 9 0 01-15.5 6.3L3 16M3 20v-4h4" />
  </svg>
);
const IconSparkle = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
  </svg>
);
const IconCheckCircle = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.3 2.3L16 9.5" />
  </svg>
);

/* ── Datos de contenido (copy adaptado en español, tono BoomHausS) ─────── */
const TRUST_BADGES = [
  { icon: IconShield, text: `Garantía de ${GUARANTEE_DAYS} días` },
  { icon: IconDropletOff, text: 'Sin ácido clorhídrico ni cloro' },
  { icon: IconStanding, text: 'Limpiá de pie, sin arrodillarte' },
  { icon: IconHome, text: 'Pensado para el hogar argentino' },
];

const STATS = [
  { val: '+1.000', lbl: 'Familias que ya lo usaron' }, // PLACEHOLDER — actualizar con dato real
  { val: '4.8★', lbl: 'Puntaje promedio' },             // PLACEHOLDER
  { val: `${GUARANTEE_DAYS} días`, lbl: 'Garantía de devolución' },
  { val: 'AR', lbl: 'Envíos a todo el país' },
];

const TRUSTROW = [
  { icon: IconTruck, text: 'Envío a todo el país' },
  { icon: IconLock, text: 'Pago 100% seguro' },
  { icon: IconPackage, text: 'Seguimiento de envío' },
  { icon: IconShield, text: 'Devolución fácil' },
];

const FEATURES = [
  { icon: IconRefresh, title: 'Fórmula doble acción', desc: 'Afloja la suciedad incrustada en la junta y después ataca las manchas profundas, no solo la superficie.' },
  { icon: IconDropletOff, title: 'Sin cloro ni ácidos fuertes', desc: 'Limpia como un ácido pero sin los vapores irritantes del clorhídrico ni el olor a lavandina.' },
  { icon: IconStanding, title: 'Limpiá de pie', desc: 'El cepillo incluido se engancha a un palo de escoba estándar. Nada de horas de rodillas.' },
  { icon: IconSparkle, title: 'No decolora', desc: 'Restaura el color original de la junta en lugar de blanquearla de forma pareja e irreal.' },
];

const STEPS = [
  { num: '1', tag: 'Paso 1', title: 'Aplicá', desc: 'Rociá o volcá el producto directamente sobre las juntas o la zona con moho.' },
  { num: '2', tag: 'Paso 2', title: 'Cepillá de pie', desc: 'Trabajalo con el cepillo incluido, parado, dejando que la fórmula haga el trabajo pesado.' },
  { num: '3', tag: 'Paso 3', title: 'Enjuagá y mirá el resultado', desc: 'Pasá un trapo húmedo y listo: la junta vuelve a su color original.' },
];

const MINI_FEATURES = [
  { title: 'Elimina', desc: 'Saca años de suciedad y moho incrustado, no solo lo que se ve en la superficie.' },
  { title: 'Restaura', desc: 'Devuelve el color original de la junta, sin necesidad de rejuntar.' },
  { title: 'Facilita', desc: 'Limpiá de pie con el cepillo incluido — sin arrodillarte ni pasar horas frotando.' },
  { title: 'Mantiene', desc: 'Con una limpieza rápida y periódica, conservás el resultado por más tiempo.' },
];

// PLACEHOLDER — reemplazar por reseñas reales y verificadas antes de publicar
const REVIEWS_DATA = [
  { title: 'No lo podía creer', stars: 5, text: 'Probé un montón de productos para las juntas de la cocina y ninguno funcionó así. Con el cepillo fue mucho más fácil, no tuve que arrodillarme.', name: 'Cliente verificado' },
  { title: 'El mejor que probé', stars: 5, text: 'Las juntas del baño estaban negras. Apliqué, dejé actuar, cepillé y quedaron como nuevas. Muy recomendable.', name: 'Cliente verificado' },
  { title: 'Funciona de verdad', stars: 5, text: 'Tenía dudas porque ya había gastado plata en otros productos que no hacían nada. Este sí notó la diferencia en la primera pasada.', name: 'Cliente verificado' },
];

const FAQS = [
  { q: '¿Sirve para pisos de cerámica y porcelanato?', a: 'Sí, está pensado para juntas y pisos de cerámica y porcelanato en cocinas, baños y entradas. Te recomendamos probar primero en una zona chica y poco visible.' },
  { q: '¿Tiene cloro o ácido clorhídrico?', a: 'No. La fórmula no lleva lavandina ni ácido clorhídrico, así que no genera los vapores irritantes típicos de esos productos.' },
  { q: '¿Tengo que fregar de rodillas?', a: 'No. El kit incluye un cepillo que se engancha a un palo de escoba estándar (no incluido) para que puedas limpiar parado.' },
  { q: '¿Sirve en mármol o piedra natural?', a: 'No está recomendado para piedra natural. Es apto para cerámica y porcelanato. Ante la duda, probá primero en un sector oculto.' },
  { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Hacemos envíos a todo el país. El tiempo estimado depende de tu localidad — lo vas a ver confirmado al finalizar la compra.' }, // EDITAR con tiempos reales
  { q: '¿Qué pasa si no quedo conforme?', a: `Contás con ${GUARANTEE_DAYS} días desde la compra para contactarnos si no estás conforme con el resultado.` },
];

/* ── Sub-componentes ─────────────────────────────────────────────────── */
function ImgPlaceholder({ label, style = {} }) {
  return (
    <div className="amp-img-placeholder" style={style}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5a2 2 0 00-2.8 0L4 19" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function BrandLogo() {
  return <>{BRAND_NAME}<sup className="amp-logo-tm">™</sup></>;
}

function fmtARS(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

/* ── Countdown de la barra roja (reinicia — típico de "oferta activa") ─ */
function useCountdown(hours = 6) {
  const [msLeft, setMsLeft] = useState(hours * 3600 * 1000);
  useEffect(() => {
    const t = setInterval(() => {
      setMsLeft((prev) => (prev <= 1000 ? hours * 3600 * 1000 : prev - 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [hours]);
  const totalSec = Math.floor(msLeft / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/* ── Componente principal ────────────────────────────────────────────── */
export default function AntimohoPisos() {
  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(DEFAULT_BUNDLE_IDX);
  const [openFaq, setOpenFaq] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const ctaRef = useRef(null);
  const { addItem } = useCart();
  const clock = useCountdown(6);

  /* Intenta traer precio/stock real si el producto ya existe en el admin
     con este slug. Si no existe, sigue con los BUNDLES placeholder. */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then((r) => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  /* Si el producto existe en la base con bundles cargados (ver
     seedAntimohoPisos.js o carga manual en /admin/products), esos
     bundles pisan a los BUNDLES placeholder de este archivo — así
     editar precios en el admin se refleja acá sin tocar código. */
  const effectiveBundles = useMemo(() => {
    if (Array.isArray(product?.bundles) && product.bundles.length) {
      return product.bundles.map((b, i) => ({
        id: i,
        qty: b.qty,
        label: b.label || `${b.qty} unidad${b.qty > 1 ? 'es' : ''}`,
        badge: b.badge || (b.popular ? 'MÁS ELEGIDO' : ''),
        pctLabel: b.compareAt > b.price
          ? `${Math.round(((b.compareAt - b.price) / b.compareAt) * 100)}% OFF`
          : '',
        price: b.price,
        compareAt: b.compareAt || b.price,
      }));
    }
    return BUNDLES;
  }, [product]);

  const galleryImages = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length) {
      return product.images.map((src, i) => ({ src, alt: `${CHECKOUT_NAME} — foto ${i + 1}` }));
    }
    return FALLBACK_GALLERY;
  }, [product]);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: CHECKOUT_NAME,
      content_type: 'product',
      currency: 'ARS',
      value: effectiveBundles[Math.min(DEFAULT_BUNDLE_IDX, effectiveBundles.length - 1)]?.price || 0,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sticky bar — visible solo después de pasar el CTA del hero (mobile) */
  useEffect(() => {
    if (!productReady || !ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastCta = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setStickyVisible(pastCta);
      },
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  const bundle = effectiveBundles[selectedBundle] || effectiveBundles[0];

  const handleBuy = () => {
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    addItem(
      { ...productData, name: `${CHECKOUT_NAME} — ${bundle.label}` },
      1,
      {
        bundleTotal: bundle.price,
        compareAtPrice: bundle.compareAt,
      },
    );
    setShowCheckout(true);
  };

  /* El botón del sticky bar no compra directo: lleva arriba, a los
     bundles, para que el usuario elija el kit antes de comprar. */
  const scrollToBundles = () => {
    document.getElementById('amp-bundles')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!productReady) {
    return (
      <div className="amp-loading-wrap">
        <div className="amp-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <div className="amp-wrap">

        {/* ══ TOPBAR + SALEBAR ══ */}
        <div className="amp-topbar">
          <span>Envío a todo el país en compras superiores a $50.000</span>
          <span className="amp-sep">|</span>
          <span>Miles de familias ya confían en {BRAND_NAME}</span>
        </div>
        <div className="amp-salebar">
          <span>Oferta activa: hasta 40% OFF · Por tiempo limitado</span> {/* EDITAR: ajustar % o el bundle de mayor descuento para que coincida */}
          <span className="amp-salebar-clock">⏱ {clock}</span>
        </div>

        {/* ══ HEADER ══ */}
        <div className="amp-header">
          <div className="amp-logo"><BrandLogo /></div>
          <div className="amp-cart-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6" />
            </svg>
          </div>
        </div>

        {/* ══ HERO ══ */}
        <div className="amp-hero">
          <div className="amp-container amp-hero-inner">

            {/* Galería — usa fotos reales del producto si ya las cargaste
                en /admin/products; si no, muestra los placeholders */}
            <div className="amp-gallery">
              <div className="amp-gallery-main">
                {galleryImages[activeImg]?.src
                  ? <img src={galleryImages[activeImg].src} alt={galleryImages[activeImg].alt} />
                  : <ImgPlaceholder label={galleryImages[activeImg]?.label} style={{ minHeight: 320 }} />
                }
              </div>
              <div className="amp-thumbs">
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className={`amp-thumb${i === activeImg ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {img.src
                      ? <img src={img.src} alt={img.alt} />
                      : <ImgPlaceholder label={String(i + 1)} />
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="amp-info">
              <div className="amp-stars-row">
                <span>★★★★★</span>
                <span className="amp-stars-count">Miles de hogares ya lo probaron</span> {/* PLACEHOLDER */}
              </div>

              <h1 className="amp-h1">Dejá tus juntas y pisos como nuevos, sin esfuerzo.</h1>

              <p className="amp-subtitle">
                Anti-Moho PRO usa una fórmula de doble acción para levantar la suciedad
                incrustada en las juntas — limpiando sin cloro ni ácidos agresivos, y con
                la posibilidad de limpiar de pie. Elegí tu kit y ahorrá.
              </p>

              <div className="amp-trust-badges">
                {TRUST_BADGES.map((b, i) => (
                  <div key={i} className="amp-trust-badge">
                    <b.icon />
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>

              <div className="amp-brush-note">
                Cada kit incluye un cepillo especial para pisos (se engancha a un palo de
                escoba estándar, no incluido).
              </div>

              {/* Bundle picker */}
              <div className="amp-bundles" id="amp-bundles">
                {effectiveBundles.map((b, i) => (
                  <label
                    key={b.id}
                    className={`amp-bundle-opt${selectedBundle === i ? ' selected' : ''}`}
                    onClick={() => setSelectedBundle(i)}
                  >
                    <input type="radio" name="amp-bundle" checked={selectedBundle === i} onChange={() => setSelectedBundle(i)} />
                    <div className="amp-bundle-thumb">
                      <ImgPlaceholder label={`x${b.qty}`} />
                    </div>
                    <div className="amp-bundle-body">
                      <div>
                        <div className="amp-bundle-label-row">
                          <span className="amp-bundle-label">{b.label}</span>
                          {b.badge && <span className="amp-bundle-badge">{b.badge}</span>}
                        </div>
                        <span className="amp-bundle-off">{b.pctLabel}</span>
                      </div>
                      <div className="amp-bundle-price-col">
                        <span className="amp-bundle-price">{fmtARS(b.price)}</span>
                        <span className="amp-bundle-compare">{fmtARS(b.compareAt)}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button ref={ctaRef} id="comprar" className="amp-cta-btn" onClick={handleBuy}>
                Añadir al carrito
              </button>

              <div className="amp-truststrip">
                <span>Garantía {GUARANTEE_DAYS} días</span>
                <span className="amp-sep">·</span>
                <span>Pago seguro</span>
                <span className="amp-sep">·</span>
                <span>Envíos a todo el país</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div className="amp-stats-section">
          <div className="amp-container amp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i}>
                <span className="amp-stat-val">{s.val}</span>
                <span className="amp-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ TRUST ROW (reemplaza "As Seen On" — sin menciones de prensa reales) ══ */}
        <div className="amp-trustrow-section">
          <div className="amp-container">
            <span className="amp-trustrow-title">Comprá con confianza</span>
            <div className="amp-trustrow-grid">
              {TRUSTROW.map((t, i) => (
                <div key={i} className="amp-trustrow-item">
                  <t.icon />
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ANTES / DESPUÉS ══ */}
        <div className="amp-sec">
          <div className="amp-container">
            <span className="amp-eyebrow">Antes / Después</span>
            <h2 className="amp-sec-h2">Mirá cómo devuelve la vida a tus juntas</h2>
            <p className="amp-sec-sub">Años de suciedad acumulada, eliminados — sin rejuntar ni reemplazar nada.</p>
            <div className="amp-ba-grid">
              {['Piso de cocina', 'Juntas de baño', 'Entrada de casa'].map((label, i) => (
                <div key={i} className="amp-ba-card">
                  <span className="amp-ba-tag before">Antes</span>
                  <span className="amp-ba-tag after">Después</span>
                  <ImgPlaceholder label={`Foto antes/después — ${label}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ COMPARATIVA ══ */}
        <div className="amp-sec amp-mist">
          <div className="amp-container">
            <span className="amp-eyebrow">Cómo limpia</span>
            <h2 className="amp-sec-h2">Limpia profundo, no solo la superficie</h2>
            <div className="amp-vs-grid">
              <div className="amp-vs-card bad">
                <h3>Limpiadores comunes</h3>
                <p>La lavandina y los aerosoles de todos los días solo aclaran la superficie de la junta. La suciedad queda en los poros, así que vuelve a verse opaca en cuestión de días.</p>
              </div>
              <div className="amp-vs-card good">
                <h3>Anti-Moho PRO — Doble acción</h3>
                <p>Primero afloja la suciedad de la superficie y después ataca las manchas profundas, así que la mugre sale desde el fondo de la junta, no solo de arriba.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ FEATURES 4-GRID ══ */}
        <div className="amp-sec">
          <div className="amp-container">
            <h2 className="amp-sec-h2">Por qué elegir Anti-Moho PRO</h2>
            <div className="amp-feat-grid" style={{ marginTop: 24 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="amp-feat-card">
                  <div className="amp-feat-icon"><f.icon /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ COPY LARGO + CTA ══ */}
        <div className="amp-sec amp-mist">
          <div className="amp-container amp-copy-sec">
            <h2 className="amp-copy-h">Tu piso no está arruinado — nunca se limpió como corresponde</h2>
            <p>
              Si tus juntas se ven oscuras, opacas o manchadas por más que las frotes, no
              es que estén gastadas. Los productos de todos los días solo aclaran la{' '}
              <em>superficie</em> — la suciedad sigue metida en los poros, así que vuelve
              a verse sucia a los pocos días. Limpiás, y limpiás, y nunca cambia demasiado.
            </p>
            <p>
              <strong>Anti-Moho PRO funciona distinto.</strong> Su fórmula de doble acción
              levanta la suciedad incrustada — desde el fondo de la junta, no solo de
              arriba — y ayuda a recuperar el color original. Sin cloro, sin vapores
              irritantes y sin tener que levantar ni una baldosa.
            </p>
            <p className="amp-copy-note">Probá siempre primero en una zona chica y poco visible. No recomendado para piedra natural.</p>
            <div className="amp-copy-cta-wrap">
              <a href="#comprar" className="amp-inline-cta">Quiero mi piso como nuevo</a>
            </div>
          </div>
        </div>

        {/* ══ CÓMO USAR ══ */}
        <div className="amp-sec">
          <div className="amp-container">
            <h2 className="amp-sec-h2">Tres pasos para juntas como nuevas</h2>
            <div className="amp-steps-grid" style={{ marginTop: 24 }}>
              {STEPS.map((s) => (
                <div key={s.num} className="amp-step">
                  <div className="amp-step-num">{s.num}</div>
                  <span className="amp-step-tag">{s.tag}</span>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="amp-copy-cta-wrap">
              <a href="#comprar" className="amp-inline-cta">Conseguir juntas como nuevas</a>
            </div>
          </div>
        </div>

        {/* ══ MINI FEATURES ══ */}
        <div className="amp-sec amp-mist">
          <div className="amp-container amp-mini-grid">
            {MINI_FEATURES.map((m, i) => (
              <div key={i} className="amp-mini-card">
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MARCA / HISTORIA ══ */}
        {/* EDITAR: reemplazar por la historia real de la marca/fundador */}
        <div className="amp-founder-sec">
          <div className="amp-container amp-founder-grid">
            <ImgPlaceholder label="Foto del equipo / fundador de BoomHausS" />
            <div>
              <span className="amp-founder-eyebrow">Por qué existe {BRAND_NAME}</span>
              <h2 className="amp-founder-h2">Creamos Anti-Moho PRO para que dejes de pelear con las juntas.</h2>
              <p>
                Sabemos lo que es probar producto tras producto y terminar igual, de
                rodillas, con un cepillito que no rinde. Por eso armamos un kit que
                combina una fórmula pensada para juntas y pisos con un cepillo que te
                permite limpiar de pie.
              </p>
              <p>
                Queremos que puedas recuperar tus pisos sin gastar en un rejuntado ni
                pasarte la tarde entera arrodillado.
              </p>
            </div>
          </div>
        </div>

        {/* ══ REVIEWS ══ */}
        <div className="amp-sec">
          <div className="amp-container">
            <span className="amp-eyebrow" style={{ color: '#FFC65C' }}>★★★★★</span>
            <h2 className="amp-sec-h2">Lo que dicen quienes ya lo probaron</h2>
            <p className="amp-sec-sub">Reseñas de clientes reales. *Ejemplos — reemplazar por reseñas verificadas antes de publicar.</p>
            <div className="amp-reviews-grid">
              {REVIEWS_DATA.map((r, i) => (
                <div key={i} className="amp-review-card">
                  <div className="amp-review-stars">{'★'.repeat(r.stars)}</div>
                  <h4>{r.title}</h4>
                  <p>&ldquo;{r.text}&rdquo;</p>
                  <div className="amp-review-name">{r.name}</div>
                  <div className="amp-review-verified"><IconCheckCircle /> Compra verificada</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ GARANTÍA ══ */}
        <div className="amp-sec amp-mist">
          <div className="amp-container">
            <div className="amp-guarantee-box">
              <IconShield className="amp-guarantee-icon" />
              <h3>Garantía de {GUARANTEE_DAYS} días</h3>
              <p>
                Probá Anti-Moho PRO en tus juntas más sucias. Si no quedás conforme con
                el resultado, contactanos dentro de los {GUARANTEE_DAYS} días. {/* EDITAR política real */}
              </p>
            </div>
          </div>
        </div>

        {/* ══ FAQ ══ */}
        <div className="amp-sec">
          <div className="amp-container">
            <h2 className="amp-sec-h2">Preguntas frecuentes</h2>
            <div className="amp-faq-list" style={{ marginTop: 24 }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="amp-faq-item">
                  <button
                    className="amp-faq-trigger"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="amp-faq-q">{faq.q}</span>
                    <span className={`amp-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
                  </button>
                  <div className={`amp-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                    <div className="amp-faq-body-inner">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* /amp-wrap */}

      {/* ══ Sticky CTA bar (mobile) ══ */}
      <div className={`amp-sticky-bar${stickyVisible ? ' amp-visible' : ''}`} aria-hidden={!stickyVisible}>
        <div className="amp-sticky-thumb">
          {galleryImages[0]?.src
            ? <img src={galleryImages[0].src} alt={CHECKOUT_NAME} />
            : <ImgPlaceholder label="" />
          }
        </div>
        <div className="amp-sticky-info">
          <div className="amp-sticky-name">{bundle.label}</div>
          <div className="amp-sticky-price"><strong>{fmtARS(bundle.price)}</strong> · Garantía {GUARANTEE_DAYS} días</div>
        </div>
        <button className="amp-cta-btn" onClick={scrollToBundles}>Elegir opción</button>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="amp-footer">
        <div className="amp-container">
          <div className="amp-footer-logo"><BrandLogo /></div>
          <p className="amp-footer-tag">Limpieza que se nota, sin vueltas.</p> {/* EDITAR tagline */}
          <p className="amp-footer-contact">Para consultas generales, escribinos a {CONTACT_EMAIL}</p>
          <p className="amp-footer-legal">© {new Date().getFullYear()} {BRAND_NAME} · Todos los derechos reservados.</p>
        </div>
      </footer>

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#0E2747"
          primaryHover="#163a63"
          accentColor="#157A42"
          fontFamily="'Inter', system-ui, sans-serif"
        />
      )}
    </>
  );
}
