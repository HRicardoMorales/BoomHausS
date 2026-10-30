import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { preload } from 'react-dom';
import montserratLatin from '@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import { fetchProductBySlug } from '../../services/productBySlug';
import mc from '../escultor-led';
import './LuxCoveLED.css';
import LandingFooter from '../../components/landing/LandingFooter.jsx';
import { moneyARS } from '../../utils/pricing.js';
import {
  PRODUCT_SLUG, DEFAULT_PRICE, DEFAULT_COMPARE,
  BUNDLE_PRODUCT_IMG, EBOOK_IMG, BUNDLE_PRODUCT_NAME, BUNDLE_EBOOK_NAME,
  GIFT_CONFIGS, FOR_WHOM,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import HeroGallery from './sections/HeroGallery';
import BundleSelector from './sections/BundleSelector';
import HeroReview from './sections/HeroReview';
import ProductAccordion from './sections/ProductAccordion';
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

/* Landing del Escultor LED. Este archivo tiene el estado de compra (producto,
   pack, checkout, barra fija) y compone el hero; cada bloque visual vive en
   sections/ y los textos/URLs en data.js. */

/* LCP: el título del hero (el elemento LCP) usa Montserrat, y el navegador
   solo descubre la fuente al maquetar ese texto (después de que llega el
   producto). Pedirla al evaluar el chunk la adelanta ~400 ms con CPU ×4 y el
   título no espera la fuente para su pintado final. Mismo archivo hasheado que
   pide el @font-face de fonts-montserrat.css (latin; latin-ext solo si hace
   falta). `preload` de React 19 deduplica e inserta el <link> en <head>. */
preload(montserratLatin, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

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
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    fetchProductBySlug(PRODUCT_SLUG)
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

            <HeroGallery images={productImages} activeIdx={activeImg} onSelect={setActiveImg} />

            {/* Info de compra */}
            <div className="led-info">
              <div className="led-stars">
                <span className="led-stars-icons">★★★★★</span>
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

              <BundleSelector
                bundles={BUNDLES}
                selected={selectedBundle}
                onSelect={setSelectedBundle}
                productImg={BUNDLE_PRODUCT_IMG || productImages[0]?.src}
                productAlt={displayName}
                giftImg={REGALO_IMG}
                ebookImg={EBOOK_IMG}
              />

              <div className="led-urgency">
                <span aria-hidden="true">🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="led-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              <TrustBadges />

              <PaymentMethods />

              <HeroReview />

              <ProductAccordion />
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
