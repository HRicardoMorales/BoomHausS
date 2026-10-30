import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import { fetchProductBySlug } from '../../services/productBySlug';
import './DepiladoraIPL.css';
import { moneyARS } from '../../utils/pricing.js';
import {
  PRODUCT_SLUG, CHECKOUT_NAME, DEFAULT_PRICE, DEFAULT_COMPARE,
  BUNDLE_RAZOR_IMG, BUNDLE_EBOOK_IMG,
  BUNDLE_PRODUCT_NAME, BUNDLE_RAZOR_NAME, BUNDLE_EBOOK_NAME,
  BENEFITS, FALLBACK_IMAGES,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import HeroGallery from './sections/HeroGallery';
import BundleSelector from './sections/BundleSelector';
import TrustBadges from './sections/TrustBadges';
import PaymentMethods from './sections/PaymentMethods';
import HeroReview from './sections/HeroReview';
import ProductAccordion from './sections/ProductAccordion';
import ZoneProgress from './sections/ZoneProgress';
import ResultsStats from './sections/ResultsStats';
import VideoStrip from './sections/VideoStrip';
import FeatureBlocks from './sections/FeatureBlocks';
import Comparison from './sections/Comparison';
import Reviews from './sections/Reviews';
import HowToUse from './sections/HowToUse';
import Guarantee from './sections/Guarantee';
import Faq from './sections/Faq';
import Footer from './sections/Footer';

/* Landing de la Depiladora IPL. Este archivo tiene el estado de compra
   (producto, pack, checkout, barra fija) y compone el hero; cada bloque
   visual vive en sections/ y los textos/URLs en data.js. */

/* ── Componente principal ─────────────────────────────────── */
export default function DepiladoraIPL() {
  const [product, setProduct]           = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef   = useRef(null);
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
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  useEffect(() => {
    document.body.classList.toggle('pdx-sticky-active', stickyVisible);
    return () => document.body.classList.remove('pdx-sticky-active');
  }, [stickyVisible]);

  const price      = product?.price ?? DEFAULT_PRICE;
  const compareAt  = product?.compareAtPrice ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 55;
  const soldOut    = product?.stock === 0;

  const BUNDLES = useMemo(() => [
    {
      id: 0,
      label: 'Pack Completo',
      badge: 'MÁS POPULAR',
      perks: 'Envío gratis · 3 cuotas sin interés',
      bundlePrice: price,
      comparePrice: compareAt,
      productThumbName: BUNDLE_PRODUCT_NAME,
      extras: [
        { id: 'razor', label: BUNDLE_RAZOR_NAME, img: BUNDLE_RAZOR_IMG },
        { id: 'ebook', label: BUNDLE_EBOOK_NAME,  img: BUNDLE_EBOOK_IMG },
      ],
    },
  ], [price, compareAt]);

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle];
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    addItem(
      { ...productData, name: CHECKOUT_NAME, imageUrl: productImages[0]?.src },
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

  const productImages = product?.images?.length
    ? product.images.map((src, i) => ({ src, alt: `Depiladora IPL — imagen ${i + 1}` }))
    : FALLBACK_IMAGES;

  if (!productReady) {
    return (
      <div className="ipl-loading-wrap">
        <div className="ipl-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <main className="ipl-wrap">
        <title>Depiladora IPL Profesional | Luz pulsada en casa | Amelor</title>

        {/* ══ S1 — ANNOUNCEMENT BAR ══ */}
        <AnnouncementBar />

        {/* ══ S2 — HERO ══ */}
        <div className="ipl-hero">
          <div className="ipl-hero-inner">

            <HeroGallery images={productImages} />

            {/* Info de compra */}
            <div className="ipl-info">
              <div className="ipl-stars">
                <span className="ipl-stars-icons">★★★★★</span>
                <span className="ipl-stars-count">4.9 / 5</span>
                <span className="ipl-reviews-count">| Más de 10.000 clientas satisfechas</span>
              </div>

              <h1 className="ipl-product-title">Depiladora IPL Profesional de Amelor</h1>

              <div className="ipl-pricing">
                <span className="ipl-price-original">{moneyARS(compareAt)}</span>
                <span className="ipl-price-sale">{moneyARS(price)}</span>
                <span className="ipl-badge-discount">{discountPct}% OFF</span>
                <span className="ipl-cuotas">3 cuotas sin interés de <strong>{moneyARS(Math.ceil(price / 3))}</strong></span>
              </div>

              <ul className="ipl-benefits">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="ipl-benefit-item">
                    <span className="ipl-benefit-check">✅</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <BundleSelector bundles={BUNDLES} selected={selectedBundle} onSelect={setSelectedBundle} />

              <div className="ipl-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              <TrustBadges />

              <PaymentMethods />

              <HeroReview />

              <ProductAccordion />
            </div>
          </div>
        </div>

        {/* ══ S3.5 — ANTES / DESPUÉS POR ZONA ══ */}
        <ZoneProgress />

        <ResultsStats />

        <VideoStrip />

        <FeatureBlocks />

        <Comparison />

        <Reviews />

        <HowToUse />

        <Guarantee onBuy={handleBuy} soldOut={soldOut} />

        <Faq />

      </main>{/* /ipl-wrap */}

      {/* Sticky CTA bar */}
      <div className={`ipl-sticky-bar${stickyVisible ? ' ipl-visible' : ''}`} aria-hidden={!stickyVisible} inert={!stickyVisible}>
        <button className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
        </button>
      </div>

      {/* Footer */}
      <Footer />

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#9F1239"
          primaryHover="#7f0f2e"
          accentColor="#F9A8D4"
          fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        />
      )}
    </>
  );
}
