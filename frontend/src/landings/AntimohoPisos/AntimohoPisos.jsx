// src/landings/AntimohoPisos/AntimohoPisos.jsx
// ─────────────────────────────────────────────────────────────────────────
// Landing "Anti-Moho PRO" — réplica adaptada de clean-eez.com/pages/grouteez-header
// Ruta: /lp/antimoho-pisos
//
// Este archivo tiene el estado de compra (producto, kit, checkout, barra
// fija) y compone la página; cada bloque visual vive en sections/ (con su
// propio estado), los textos/precios en data.js y los íconos en icons.jsx.
//
// ⚠️ TODO ANTES DE PUBLICAR — buscá "PLACEHOLDER" / "EDITAR" en esta carpeta:
//   1. Reemplazar los <ImgPlaceholder> por fotos reales del producto
//      (o cargarlas en /admin/products: la galería las toma solas).
//   2. Revisar precios de BUNDLES en data.js (son placeholders en ARS).
//   3. Completar CONTACT_EMAIL, GUARANTEE_DAYS y la historia de marca.
//   4. Cambiar REVIEWS_DATA por reseñas reales verificadas.
//   5. Dar de alta el producto en el admin con slug "antimoho-pisos" si querés
//      que traiga precio/stock reales desde la API (si no existe, la landing
//      sigue funcionando con los valores placeholder).
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import api from '../../services/api';
import './AntimohoPisos.css';
import {
  PRODUCT_SLUG, CHECKOUT_NAME, GUARANTEE_DAYS,
  FALLBACK_GALLERY, BUNDLES, DEFAULT_BUNDLE_IDX,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import Header from './sections/Header';
import HeroGallery from './sections/HeroGallery';
import TrustBadges from './sections/TrustBadges';
import BundleSelector from './sections/BundleSelector';
import Stats from './sections/Stats';
import TrustRow from './sections/TrustRow';
import BeforeAfter from './sections/BeforeAfter';
import Comparison from './sections/Comparison';
import Features from './sections/Features';
import LongCopy from './sections/LongCopy';
import HowToUse from './sections/HowToUse';
import MiniFeatures from './sections/MiniFeatures';
import Founder from './sections/Founder';
import Reviews from './sections/Reviews';
import Guarantee from './sections/Guarantee';
import Faq from './sections/Faq';
import StickyBar from './sections/StickyBar';
import Footer from './sections/Footer';

/* Si el producto existe en la base con bundles cargados (ver
   seedAntimohoPisos.js o carga manual en /admin/products), esos
   bundles pisan a los BUNDLES placeholder — así editar precios en el
   admin se refleja acá sin tocar código. */
function bundlesFrom(product) {
  if (!Array.isArray(product?.bundles) || !product.bundles.length) return BUNDLES;
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

function galleryFrom(product) {
  if (!Array.isArray(product?.images) || !product.images.length) return FALLBACK_GALLERY;
  return product.images.map((src, i) => ({ src, alt: `${CHECKOUT_NAME} — foto ${i + 1}` }));
}

/* ── Componente principal ────────────────────────────────────────────── */
export default function AntimohoPisos() {
  const [product, setProduct] = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(DEFAULT_BUNDLE_IDX);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const ctaRef = useRef(null);
  const { addItem } = useCart();

  /* Intenta traer precio/stock real si el producto ya existe en el admin
     con este slug. Si no existe, sigue con los BUNDLES placeholder. */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then((r) => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  const effectiveBundles = useMemo(() => bundlesFrom(product), [product]);
  const galleryImages = useMemo(() => galleryFrom(product), [product]);

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

  if (!productReady) {
    return (
      <div className="amp-loading-wrap">
        <div className="amp-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <main className="amp-wrap">
        <title>Anti-Moho PRO | Pisos y juntas como nuevos | Amelor</title>

        <AnnouncementBar />
        <Header />

        {/* ══ HERO ══ */}
        <div className="amp-hero">
          <div className="amp-container amp-hero-inner">
            <HeroGallery images={galleryImages} />

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

              <TrustBadges />

              <div className="amp-brush-note">
                Cada kit incluye un cepillo especial para pisos (se engancha a un palo de
                escoba estándar, no incluido).
              </div>

              <BundleSelector bundles={effectiveBundles} selected={selectedBundle} onSelect={setSelectedBundle} />

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

        <Stats />
        <TrustRow />
        <BeforeAfter />
        <Comparison />
        <Features />
        <LongCopy />
        <HowToUse />
        <MiniFeatures />
        <Founder />
        <Reviews />
        <Guarantee />
        <Faq />
      </main>

      <StickyBar visible={stickyVisible} image={galleryImages[0]} bundle={bundle} />
      <Footer />

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
