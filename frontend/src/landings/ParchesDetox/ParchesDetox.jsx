import { useState, useEffect, useRef } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import { fetchProductBySlug } from '../../services/productBySlug';
import mc from '../parches-detox';
import './ParchesDetox.css';
import { moneyARS } from '../../utils/pricing.js';
import {
  PRODUCT_SLUG, CHECKOUT_NAME, DEFAULT_PRICE, DEFAULT_COMPARE,
  BENEFITS, BUNDLES, FALLBACK_IMAGES,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import HeroGallery from './sections/HeroGallery';
import BundleSelector from './sections/BundleSelector';
import TrustBadges from './sections/TrustBadges';
import PaymentMethods from './sections/PaymentMethods';
import HeroReview from './sections/HeroReview';
import ProductAccordion from './sections/ProductAccordion';
import VideoStrip from './sections/VideoStrip';
import ResultsStats from './sections/ResultsStats';
import FeatureBlocks from './sections/FeatureBlocks';
import ImageBanners from './sections/ImageBanners';
import Reviews from './sections/Reviews';
import HowToUse from './sections/HowToUse';
import Guarantee from './sections/Guarantee';
import Faq from './sections/Faq';
import Footer from './sections/Footer';

/* Landing de los Parches Detox. Este archivo tiene el estado de compra
   (producto, kit, checkout, barra fija) y compone el hero; cada bloque
   visual vive en sections/ (con su propio estado) y los textos/URLs en data.js. */

/* ── Componente principal ─────────────────────────────────── */
export default function ParchesDetoxLanding() {
  const [product, setProduct]             = useState(null);
  const [productReady, setProductReady]   = useState(false);
  const [showCheckout, setShowCheckout]   = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef      = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    fetchProductBySlug(PRODUCT_SLUG)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: CHECKOUT_NAME,
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
        setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  useEffect(() => {
    document.body.classList.toggle('pdx-sticky-active', stickyVisible);
    return () => document.body.classList.remove('pdx-sticky-active');
  }, [stickyVisible]);

  const soldOut = product?.stock === 0;

  /* Precio del hero = bundle seleccionado */
  const activeBundle = BUNDLES[selectedBundle] || BUNDLES[0];
  const price      = activeBundle?.price ?? DEFAULT_PRICE;
  const compareAt  = activeBundle?.compareAt ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 40;

  const productImages = product?.images?.length
    ? product.images.map((src, i) => ({ src, alt: `Parches Detox — imagen ${i + 1}` }))
    : FALLBACK_IMAGES;

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle] || BUNDLES[0];
    if (!bundle) return;
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    const mainImg = productImages[0]?.src;
    addItem(
      { ...productData, name: CHECKOUT_NAME, imageUrl: mainImg },
      bundle.qty || 1,
      {
        bundleTotal:    bundle.price,
        compareAtPrice: bundle.compareAt,
        gifts:          bundle.giftQty ? [`+${bundle.giftQty} ${bundle.giftQty === 1 ? 'caja' : 'cajas'} de REGALO 🎁`] : [],
        bundleImgs:     bundle.img ? [bundle.img] : (mainImg ? [mainImg] : undefined),
      },
    );
    setShowCheckout(true);
  };

  if (!productReady) {
    return (
      <div className="pdx-loading-wrap">
        <div className="pdx-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <main className="pdx-wrap">
        <title>{mc.pageTitle}</title>

        {/* ══ S1 — ANNOUNCEMENT BAR ══ */}
        <AnnouncementBar />

        {/* ══ S2 — HERO ══ */}
        <div className="pdx-hero">
          <div className="pdx-hero-inner">

            {/* Galería */}
            <HeroGallery images={productImages} />

            {/* Info de compra */}
            <div className="pdx-info">
              <div className="pdx-stars">
                <span className="pdx-stars-icons">★★★★★</span>
                <span className="pdx-stars-count">4.8 / 5</span>
                <span className="pdx-reviews-count">| Más de 10.000 noches transformadas</span>
              </div>

              <h1 className="pdx-product-title">Parches Desintoxicantes Plantares Detox </h1>

              <div className="pdx-pricing">
                <span className="pdx-price-original">{moneyARS(compareAt)}</span>
                <span className="pdx-price-sale">{moneyARS(price)}</span>
                <span className="pdx-badge-discount">{discountPct}% OFF</span>
                <span className="pdx-cuotas">3 cuotas sin interés de <strong>{moneyARS(Math.ceil(price / 3))}</strong></span>
              </div>

              <ul className="pdx-benefits">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="pdx-benefit-item">
                    <span className="pdx-benefit-icon">{b.icon}</span>
                    <span className="pdx-benefit-text">{b.text}</span>
                  </li>
                ))}
              </ul>

              <div className="pdx-benefits-divider">
                <div className="pdx-benefits-divider-line" />
                <span className="pdx-benefits-divider-label">Elegí tu kit</span>
                <div className="pdx-benefits-divider-line" />
              </div>

              {/* Bundle selector */}
              <BundleSelector selected={selectedBundle} onSelect={setSelectedBundle} images={productImages} ctaRef={ctaRef} />

              <div className="pdx-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 12 unidades</span>
              </div>

              <button className="pdx-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
              </button>

              {/* Trust badges */}
              <TrustBadges />

              {/* Medios de pago */}
              <PaymentMethods />

              {/* Hero review */}
              <HeroReview />

              {/* Acordeón */}
              <ProductAccordion />
            </div>
          </div>
        </div>

        {/* ══ S3 — VIDEO STRIP ══ */}
        <VideoStrip />

        {/* ══ S4 — STATS CIRCULARES ══ */}
        <ResultsStats />

        {/* ══ S6 — S7B — BLOQUES IMAGEN + TEXTO ══ */}
        <FeatureBlocks />

        {/* ══ S9/S8 — INGREDIENTES + BANNER KINOKI ══ */}
        <ImageBanners />

        {/* ══ S10 — RESEÑAS CARRUSEL ══ */}
        <Reviews />

        {/* ══ S11 — CÓMO USARLO ══ */}
        <HowToUse />

        {/* ══ S12 — GARANTÍA ══ */}
        <Guarantee onBuy={handleBuy} soldOut={soldOut} />

        {/* ══ S13 — FAQ ══ */}
        <Faq />

      </main>{/* /pdx-wrap */}

      {/* Sticky CTA bar */}
      <div className={`pdx-sticky-bar${stickyVisible ? ' pdx-visible' : ''}`} aria-hidden={!stickyVisible} inert={!stickyVisible}>
        <button className="pdx-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'QUIERO PROBAR ESTA NOCHE 🌙'}
        </button>
      </div>

      {/* Footer */}
      <Footer />

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#1B4D3E"
          primaryHover="#153D30"
          accentColor="#22C55E"
          accentBg="#F0FAF4"
          accentBorder="#86EFAC"
          accentText="#14532D"
          fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        />
      )}
    </>
  );
}
