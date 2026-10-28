import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import api from '../../services/api';
import mc from '../escultor-led';
import './LuxCoveLED.css';
import LandingFooter from '../../components/landing/LandingFooter.jsx';
import SafeImg from '../../components/SafeImg';
import { moneyARS } from '../../utils/pricing.js';
import { HERO_SIZES, THUMB_WIDTHS, ICON_WIDTHS } from '../../components/landing/imageSizes';
import {
  PRODUCT_SLUG, DEFAULT_PRICE, DEFAULT_COMPARE,
  BUNDLE_PRODUCT_IMG, EBOOK_IMG, BUNDLE_PRODUCT_NAME, BUNDLE_EBOOK_NAME,
  GIFT_CONFIGS, FOR_WHOM, PRODUCT_TABS, heroReviews,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import TrustBadges from './sections/TrustBadges';
import PaymentMethods from './sections/PaymentMethods';
import Testimonials from './sections/Testimonials';
import VideoStrip from './sections/VideoStrip';
import ResultsStats from './sections/ResultsStats';
import FeaturesGrid from './sections/FeaturesGrid';
import FeatureBlocks from './sections/FeatureBlocks';
import LightsCarousel from './sections/LightsCarousel';
import BeforeAfter from './sections/BeforeAfter';
import Comparison from './sections/Comparison';
import Guarantee from './sections/Guarantee';
import HowToUse from './sections/HowToUse';
import PhotoReviews from './sections/PhotoReviews';
import Faq from './sections/Faq';

/* Landing del Escultor LED. Este archivo arma el hero (galería, pack y
   compra) y la barra fija; el resto de las secciones vive en sections/ y
   los textos/URLs en data.js. */

/* C4 — Accordion icons (4 para los 4 tabs) */
const accordionIcons = [
  <svg key="clip" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 012 0v1h2V2a1 1 0 012 0v1" /><line x1="7" y1="8" x2="13" y2="8" /><line x1="7" y1="11" x2="13" y2="11" /><line x1="7" y1="14" x2="10" y2="14" /></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><polyline points="10,6 10,10 13,12" /></svg>,
  <svg key="heart" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" /></svg>,
  <svg key="shield" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" /><polyline points="7,10 9,12 13,8" /></svg>,
];

function ImgPlaceholder({ label, style = {} }) {
  return (
    <div className="led-img-placeholder" style={style}>{label}</div>
  );
}

/* ── Componente principal ─────────────────────────────────── */
export default function LuxCoveLED() {
  const [searchParams] = useSearchParams();
  // Lee ?regalo=<key> de la URL — si no hay param, usa el primero de GIFT_CONFIGS
  const giftKey = searchParams.get('regalo') || Object.keys(GIFT_CONFIGS)[0];
  const giftConfig = GIFT_CONFIGS[giftKey] || Object.values(GIFT_CONFIGS)[0];
  const REGALO_IMG         = giftConfig.img;
  const BUNDLE_REGALO_NAME = giftConfig.name;
  const heroImg            = giftConfig.heroImg;

  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  // Resetea la imagen activa cuando cambia la campaña (?regalo=). Ajuste de
  // estado durante el render en vez de useEffect: sin render intermedio.
  const [prevGiftKey, setPrevGiftKey] = useState(giftKey);
  if (prevGiftKey !== giftKey) {
    setPrevGiftKey(giftKey);
    setActiveImg(0);
  }
  const [openTab, setOpenTab] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx] = useState(0);   // hero review
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  useEffect(() => {
    // ViewContent se dispara una vez al montar. Usamos mc.checkoutName
    // como fallback estable — evita doble-fire cuando llega product de la
    // BD. Si querés precision perfecta con el nombre real de BD en Meta,
    // habria que retrasar el ViewContent al post-fetch (cambio de
    // comportamiento de tracking — se deja para otro sprint).
    trackWithCapi('ViewContent', {
      content_name: mc.checkoutName,
      content_type: 'product',
      currency:     'ARS',
      value:        DEFAULT_PRICE,
    });
  }, []);

  /* Sticky bar */
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

  useEffect(() => {
    document.body.classList.toggle('pdx-sticky-active', stickyVisible);
    return () => document.body.classList.remove('pdx-sticky-active');
  }, [stickyVisible]);

  const price = product?.price ?? DEFAULT_PRICE;
  const compareAt = product?.compareAtPrice ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 65;
  const soldOut = product?.stock === 0;
  // Nombre para mostrar en UI y carrito. Prioridad: BD > config fallback > literal.
  const displayName = product?.name || mc.checkoutName || 'Escultor Facial LED';


  const productImages = useMemo(() => [
    { src: heroImg || "https://pbs.twimg.com/media/HK-ZytcXMAAunJK?format=jpg&name=small", alt: `${displayName} — Vista principal` },
    { src: "https://pbs.twimg.com/media/HKA1hrNXQAAVdG0?format=jpg&name=large", alt: 'Beneficios del dispositivo' },
    { src: "https://pbs.twimg.com/media/HKA1jJVXYAA_oLr?format=jpg&name=large", alt: 'Resultados visibles' },
    { src: "https://pbs.twimg.com/media/HKA1kgxWgAAhXD1?format=jpg&name=large", alt: `${displayName} — Vista principal` },
    { src: "https://pbs.twimg.com/media/HKA1sUIWkAAKS81?format=jpg&name=large", alt: 'Beneficios del dispositivo' },
    { src: "https://pbs.twimg.com/media/HKA1uGXX0AAffQ0?format=jpg&name=large", alt: 'Resultados visibles' },
    { src: "https://pbs.twimg.com/media/HKA1vV5XcAA5yDM?format=jpg&name=large", alt: `${displayName} — Vista principal` },
    { src: "https://pbs.twimg.com/media/HKA14M6XkAATjmH?format=jpg&name=large", alt: 'Beneficios del dispositivo' },
    { src: "https://pbs.twimg.com/media/HKA1_2IXYAEiKWs?format=jpg&name=large", alt: 'Resultados visibles' },
  ], [heroImg, displayName]);

  const BUNDLES = useMemo(() => [
    {
      id: 0,
      label: "Pack Completo",
      badge: "MÁS POPULAR",
      perks: "Envío gratis · 3 cuotas sin interés",
      bundlePrice: price,
      comparePrice: compareAt,
      productThumbName: BUNDLE_PRODUCT_NAME,
      extras: [
        { id: "regalo", label: BUNDLE_REGALO_NAME, img: REGALO_IMG },
        { id: "ebook",  label: BUNDLE_EBOOK_NAME,  img: EBOOK_IMG  },
      ],
    },
  ], [price, compareAt, BUNDLE_REGALO_NAME, REGALO_IMG]);

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle];
    const productData = product || { _id: PRODUCT_SLUG, name: displayName, slug: PRODUCT_SLUG };
    addItem(
      { ...productData, name: displayName, imageUrl: productImages[0]?.src },
      1,
      {
        bundleTotal:    bundle.bundlePrice,
        compareAtPrice: bundle.comparePrice,
        gifts:          bundle.extras.map(e => e.label),
        bundleImgs:     bundle.extras.map(e => e.img).filter(Boolean),
      },
    );
    setShowCheckout(true);
  };

  if (!productReady) {
    return (
      <div className="led-loading-wrap">
        <div className="led-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <main className="led-wrap">
        <title>{`${displayName} | Amelor`}</title>

        <AnnouncementBar />

        {/* ══ S2 — HERO ══ */}
        <div className="led-hero">
          <div className="led-hero-inner">

            {/* Galería */}
            <div className="led-gallery">
              <div className="led-gallery-main">
                {productImages[activeImg]?.src
                  ? <SafeImg src={productImages[activeImg].src} alt={productImages[activeImg].alt} width={800} height={800} sizes={HERO_SIZES} priority />
                  : <ImgPlaceholder label={productImages[activeImg]?.alt} style={{ minHeight: 280 }} />
                }
              </div>
              <div className="led-thumbs">
                {productImages.map((img, i) => (
                  <div
                    key={i}
                    className={`led-thumb${i === activeImg ? ' led-thumb-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    {img.src
                      ? <SafeImg src={img.src} alt="" width={70} height={70} sizes="70px" widths={THUMB_WIDTHS} />
                      : <div className="led-img-placeholder" style={{ fontSize: 10, minHeight: 'unset', height: '100%' }}>{i + 1}</div>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="led-info">
              <div className="led-stars">
                <span style={{ color: '#FFC6C6' }}>★★★★★</span>
                <span className="led-stars-count">4.8 / 5</span>
                <span className="led-reviews-count">| Más de 10.000 clientes satisfechos</span>
              </div>

              <h1 className="led-product-title">{displayName} de Amelor</h1>

              <div className="led-pricing">
                <span className="led-price-original">{moneyARS(compareAt)}</span>
                <span className="led-price-sale">{moneyARS(price)}</span>
                <span className="led-badge-discount">{discountPct}% OFF</span>
                <span className="led-cuotas">3 cuotas sin interés de <strong>{moneyARS(Math.ceil(price / 3))}</strong></span>
              </div>

              <div className="led-target-section">
                <h2 className="led-target-title">¿Es para vos?</h2>
                <ul className="led-target-list">
                  {FOR_WHOM.map((item, i) => (
                    <li key={i}>→ {item}</li>
                  ))}
                </ul>
              </div>

              {/* Bundle selector */}
              <div className="led-bundles" role="radiogroup" aria-label="Elegí tu pack">
                {BUNDLES.map((b, i) => (
                  <label key={b.id} className={`led-bundle-opt${selectedBundle === i ? ' selected' : ''}`}>
                    <input type="radio" name="led-bundle" checked={selectedBundle === i} onChange={() => setSelectedBundle(i)} />
                    <div className="led-bundle-body">
                      <div className="led-bundle-top">
                        <div className="led-bundle-left">
                          <div className="led-bundle-label-row">
                            <span className="led-bundle-label">{b.label}</span>
                            {b.badge && <span className="led-bundle-badge">{b.badge}</span>}
                          </div>
                          <span className="led-bundle-perks">{b.perks}</span>
                        </div>
                        <div className="led-bundle-price-col">
                          <span className="led-bundle-price">{moneyARS(b.bundlePrice)}</span>
                          <span className="led-bundle-compare">{moneyARS(b.comparePrice)}</span>
                        </div>
                      </div>

                      {b.extras.length > 0 && (
                        <div className="led-bundle-extras-wrap">
                          <div className="led-bundle-thumbs">
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb">
                                {(BUNDLE_PRODUCT_IMG || productImages[0]?.src)
                                  ? <SafeImg src={BUNDLE_PRODUCT_IMG || productImages[0].src} alt={displayName} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
                                  : <span>💡</span>}
                              </div>
                              <span className="led-bundle-item-name">{b.productThumbName}</span>
                            </div>
                            <span className="led-bundle-plus">+</span>
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb">
                                {REGALO_IMG ? <SafeImg src={REGALO_IMG} alt={b.extras[0].label} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} /> : <span>🎁</span>}
                                <span className="led-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="led-bundle-item-name">{b.extras[0].label}</span>
                            </div>
                            <span className="led-bundle-plus">+</span>
                            <div className="led-bundle-item">
                              <div className="led-bundle-thumb led-bundle-thumb--ebook">
                                {EBOOK_IMG ? <SafeImg src={EBOOK_IMG} alt={b.extras[1].label} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} /> : <span>📖</span>}
                                <span className="led-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="led-bundle-item-name">{b.extras[1].label}</span>
                            </div>
                          </div>
                          <div className="led-bundle-shipping">🚚 Envío gratis a todo el país</div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="led-urgency">
                <span aria-hidden="true">🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="led-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              <TrustBadges />

              <PaymentMethods />

              {/* C5 — Review inline hero */}
              <div className="led-hero-review">
                <div className="led-hr-avatar">
                  <SafeImg src={heroReviews[hrIdx].avatar} alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="led-hr-content">
                  <div className="led-hr-top">
                    <strong className="led-hr-name">{heroReviews[hrIdx].name}</strong>
                    <span className="led-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
                  </div>
                  <p className="led-hr-text">"{heroReviews[hrIdx].text}"</p>
                </div>
                <button className="led-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
              </div>

              {/* C4 — Acordeón con íconos */}
              <div className="led-accordion">
                {PRODUCT_TABS.map((tab, i) => (
                  <div key={i} className="led-acc-item">
                    <button
                      className="led-acc-trigger"
                      onClick={() => setOpenTab(openTab === i ? null : i)}
                      aria-expanded={openTab === i}
                    >
                      <span className="led-acc-icon">{accordionIcons[i]}</span>
                      <span className="led-acc-title">{tab.title}</span>
                      <span className={`led-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
                    </button>
                    <div className={`led-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
                      <div className="led-acc-body-inner">
                        {tab.content.map((line, j) => <p key={j}>{line}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Testimonials />

        <VideoStrip />

        <ResultsStats />

        <FeaturesGrid onBuy={handleBuy} soldOut={soldOut} />

        <FeatureBlocks />

        <LightsCarousel />

        <BeforeAfter />

        <Comparison />

        <Guarantee onBuy={handleBuy} soldOut={soldOut} />

        <HowToUse />

        <PhotoReviews />

        <Faq />

      </main>{/* /led-wrap */}

      {/* Sticky CTA bar (mobile) */}
      <div className={`led-sticky-bar${stickyVisible ? ' led-visible' : ''}`} aria-hidden={!stickyVisible} inert={!stickyVisible}>
        <button className="led-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
        </button>
      </div>

      {/* ══ FOOTER ══ */}
      <LandingFooter variant="wine" tagline="Resultados de clínica. Desde tu casa." />

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#000000"
          primaryHover="#222222"
          accentColor="#c06b6b"
          fontFamily="'Montserrat', sans-serif"
        />
      )}
    </>
  );
}
