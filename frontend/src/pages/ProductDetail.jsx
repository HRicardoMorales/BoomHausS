// frontend/src/pages/ProductDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from '../hooks/useCart';
import { trackWithCapi } from "../lib/metaPixel";
import { LANDING_CONFIGS } from "../landings/index.js";
import genericProductConfig from "../landings/generic.js";
import { CheckoutSheet } from "./CheckoutSheet";
import StatsCircles from "../components/landing/StatsCircles";
import RatingSummary from "../components/product/RatingSummary";
import CountdownTimer from "../components/landing/CountdownTimer";
import "./ProductDetail.css";
import { formatARS, moneyARS, clampPct } from "../components/product/format";
import UnavailableProductPage from "../components/product/UnavailableProductPage";
import WhatsAppTab from "../components/landing/WhatsAppTab";
import BoxContents from "../components/product/BoxContents";
import HowToSteps from "../components/product/HowToSteps";
import AuthorityCard from "../components/product/AuthorityCard";
import FaqSectionPro from "../components/product/FaqSectionPro";
import VideoStripSection from "../components/product/VideoStripSection";
import StoryBlocks from "../components/product/StoryBlocks";
import MiniReviewsBar from "../components/landing/MiniReviewsBar";
import AboutSection from "../components/product/AboutSection";
import UpsellSheet from "../components/product/UpsellSheet";
import SocialCommentsSection from "../components/product/SocialCommentsSection";
import GuaranteeSection from "../components/product/GuaranteeSection";
import { Band } from "../components/product/Bands";
import WaveSeparator from "../components/landing/WaveSeparator";
import Reveal from "../components/motion/Reveal";
import ProductGallery from "../components/product/ProductGallery";
import VariantSelector from "../components/product/VariantSelector";
import PaymentIcons from "../components/product/PaymentIcons";
import BundlePicker from "../components/product/BundlePicker";
import {
  resolveLandingConfig,
  resolveGalleryImages,
  variantFallbackProduct,
  cartItemName,
  mainItemOptions,
  pickMiniReviews,
} from "../components/product/landingConfig";
import { useProduct } from "../hooks/product/useProduct";
import { useLandingVariants } from "../hooks/product/useLandingVariants";
// Último import a propósito: estas reglas venían de un <style> inline al final
// del árbol y tienen que seguir ganando el empate de orden.
import "./ProductDetail.page.css";
import { SITE_NAME } from "../seo/routeSeo.js";

/* ========================================================================
   MARKETING CONTENT — /lp/:slug usa su config de src/landings/index.js.
   /products/:id usa la ficha genérica (landings/generic.js): antes caía en
   el config del porta cepillos y cualquier producto mostraba sus bullets,
   reseñas, FAQ y upsell.
   Para agregar una landing: copiá src/landings/TEMPLATE.js y registrala
   en src/landings/index.js.
   ======================================================================== */

// Azul de las bandas oscuras (.pd-band--blue): color de las olas entre bandas.
const NAVY = "#0b172a";

/* =========================
   Main
========================= */
export default function ProductDetailRoute() {
  const { id, slug } = useParams();
  // `key` por producto: al pasar de /lp/a a /lp/b (misma ruta, otro slug) React
  // reutilizaba la instancia y la nueva landing arrancaba con la variante, el
  // pack y la foto elegidos en la anterior.
  return <ProductDetail key={slug ? `lp:${slug}` : `id:${id}`} id={id} slug={slug} />;
}

function ProductDetail({ id, slug }) {
  const { addItem } = useCart();

  // Config de la landing: /lp/:slug usa la suya; /products/:id la genérica.
  const MCRaw = (slug && LANDING_CONFIGS[slug]) || genericProductConfig;

  const {
    variantIdx: selectedVariantIdx,
    colorIdx: selectedColorIdx,
    bundleIdx: selectedBundleIdx,
    activeVariant,
    activeColorVariant,
    selectVariant,
    selectColor,
    selectBundle,
  } = useLandingVariants(MCRaw);

  // Si la variante tiene su propio producto en la base, se trae ese.
  const fetchSlug = slug ? activeVariant?.productSlug || MCRaw.productSlug || slug : null;
  const { product, error, loading, hasLoaded, retry } = useProduct({ id, slug: fetchSlug });

  const MC = useMemo(
    () => resolveLandingConfig(MCRaw, activeVariant, product),
    [MCRaw, activeVariant, product]
  );
  const miniReviews = useMemo(() => pickMiniReviews(MC), [MC]);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUpsellSheet, setShowUpsellSheet] = useState(false);

  const handleSelectVariant = (idx) => {
    if (idx === selectedVariantIdx) return;
    selectVariant(idx);
    setActiveImgIndex(0);
  };

  const images = useMemo(
    () => resolveGalleryImages(product, activeVariant, activeColorVariant),
    [product, activeVariant, activeColorVariant]
  );

  const price = Number(product?.price) || 0;
  const compareAt = Number(product?.originalPrice) || Number(product?.compareAtPrice) || 0;

  // Con packs configurados, el pack elegido manda en cantidad y totales.
  const activeBundleData = MC.bundles ? MC.bundles[selectedBundleIdx] : null;
  const totalQty = activeBundleData ? activeBundleData.qty : 1;
  const displayTotal = activeBundleData ? activeBundleData.price : Math.round(price);
  const oldTotal = activeBundleData ? activeBundleData.compareAt : Math.round(compareAt * totalQty);

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

  const lastViewedRef = useRef(null);
  useEffect(() => {
    if (!product) return;
    if (lastViewedRef.current === contentId) return;
    lastViewedRef.current = contentId;

    // lastViewedRef guarda el guard: un ViewContent por producto por render
    // aunque el user vuelva atrás y adelante.
    trackWithCapi("ViewContent", {
      content_ids:  [String(contentId)],
      content_type: "product",
      value:        Number(price) || 0,
      currency:     "ARS",
    });
  }, [product, contentId, price]);

  // Producto sintético cuando la variante trae imágenes en el config pero no
  // está cargada en la base (404): el carrito funciona igual.
  const fallbackProduct = product
    ? null
    : variantFallbackProduct({ config: MC, activeVariant, bundleIdx: selectedBundleIdx, slug });
  const hasVariantFallback = !!fallbackProduct;
  const effectiveProduct = product || fallbackProduct;
  const blockingError = error && !(error.status === 404 && hasVariantFallback) ? error : null;

  const cartProduct = effectiveProduct
    ? {
        ...effectiveProduct,
        name:
          cartItemName({
            baseName: MC.checkoutName || effectiveProduct.name,
            activeVariant,
            activeColorVariant,
            qty: totalQty,
          }) ||
          MC.checkoutName ||
          effectiveProduct.name,
      }
    : null;

  const addMainItem = () =>
    addItem(cartProduct, totalQty, mainItemOptions(activeBundleData, { price, compareAt }));

  const handleBuyNow = () => {
    if (!effectiveProduct) return;
    // Con upsell configurado, primero se ofrecen los accesorios.
    if (MC.upsell) {
      setShowUpsellSheet(true);
      return;
    }
    addMainItem();
    setShowCheckout(true);
  };

  const handleUpsellConfirm = (bundle) => {
    setShowUpsellSheet(false);
    addMainItem();
    if (bundle?.bundles) {
      bundle.bundles.forEach(b => {
        // Si el API falló usamos los datos de fallback del config como producto sintético
        const acc = b.accProduct ?? (b.item?.fallbackPrice
          ? { _id: b.item.slug, name: b.item.name, price: b.item.fallbackPrice, imageUrl: b.item.fallbackImage || "" }
          : null);
        if (acc) addItem(acc, 1, b.compareAtPrice ? { compareAtPrice: b.compareAtPrice } : undefined);
      });
    } else if (bundle?.accProduct) {
      addItem(bundle.accProduct, 1);
    }
    setShowCheckout(true);
  };

  if (loading && !hasLoaded)
    return (
      <main className="section">
        <div className="container">
          <div className="card">Cargando…</div>
        </div>
      </main>
    );

  if (blockingError || !effectiveProduct) {
    return (
      <UnavailableProductPage
        isNetworkError={blockingError?.kind === "network"}
        onRetry={retry}
      />
    );
  }

  // ✅ para el nuevo hero (como la captura)
  const discountPct = clampPct(Math.round((1 - price / compareAt) * 100));

  return (
    <main className="section main-wrapper pd-page pd-detail">
      <title>{(slug && MC?.pageTitle) || `${effectiveProduct.name} · ${SITE_NAME}`}</title>

      {/* HERO ROW: en desktop ≥980px se convierte en 2 columnas (imagen izq, controles der) */}
      <div className="pd-hero-row">
      {/* MEDIA — fuera del container para ancho completo */}
      <ProductGallery
        images={images}
        activeIndex={activeImgIndex}
        onIndexChange={setActiveImgIndex}
        alt={product?.name || MC.checkoutName || "Producto"}
        variantKey={selectedVariantIdx}
      />

      <div className="container pd-container">
          {/* INFO */}
          <aside className="pd-info">
            {/* ====== CAMBIO: HERO COMPACTO COMO LA IMAGEN ====== */}
            <div className="hero-top hero-top--compact">
              {/* (mini carrusel: ya lo tenés en MEDIA) */}

              {/* Calificación + iniciales: números y nombres del config */}
              <RatingSummary mc={MC} />

              <h1 className="hero-title hero-title--compact">{MC.heroTitle || product?.name || MC.checkoutName}</h1>

              {/* Subtítulo corto — viene del config de la landing */}
              {MC.heroSubtitle && (
                <div className="hero-subtitle">
                  {MC.heroSubtitle}
                </div>
              )}

              {/* Bullets: emoji limpio cuando hay bundles, checkmarks si no */}
              {MC.bundles ? (
                <div className="emoji-bullets">
                  {(MC.trustBullets || []).slice(0, 5).map((t, i) => (
                    <div key={i} className="emoji-bullet">{t}</div>
                  ))}
                </div>
              ) : (
                <ul className="hero-bullets-compact">
                  {(MC.trustBullets || []).slice(0, 5).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}

              {/* ── Selector de variantes con imagen ── */}
              <VariantSelector
                variants={MCRaw.variants}
                selectedIdx={selectedVariantIdx}
                onSelect={handleSelectVariant}
                activeVariant={activeVariant}
                selectedColorIdx={selectedColorIdx}
                onSelectColor={selectColor}
              />

              {/* Trust badges estilo Calmora — antes del bundle picker */}
              {MC.bundles && (
                <div className="bnd2-tablets">
                  <div className="bnd2-tablet">
                    <span className="bnd2-tablet-ico">🚚</span>
                    <span className="bnd2-tablet-line1">Envío Gratis</span>
                    <span className="bnd2-tablet-line2">a todo el país</span>
                  </div>
                  <div className="bnd2-tablet">
                    <span className="bnd2-tablet-ico">💳</span>
                    <span className="bnd2-tablet-line1">Cuotas</span>
                    <span className="bnd2-tablet-line2">sin interés</span>
                  </div>
                  <div className="bnd2-tablet">
                    <span className="bnd2-tablet-ico">🛡️</span>
                    <span className="bnd2-tablet-line1">Garantía</span>
                    <span className="bnd2-tablet-line2">30 días</span>
                  </div>
                </div>
              )}

              {/* ── Bundle picker v2 (si la landing tiene opciones de cantidad) ── */}
              <BundlePicker
                bundles={MC.bundles}
                selectedIdx={selectedBundleIdx}
                onSelect={selectBundle}
                onBuyNow={handleBuyNow}
                accordions={MC.heroAccordions}
              />

              {/* Tablets: Envío / Cuotas / Garantía — solo sin bundles (con bundles usa bnd2-tablets arriba) */}
              {!MC.bundles && (
                <div className="hero-tablets">
                  <div className="hero-tablet">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2f3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5h9v2l3.7.8a3 3 0 012.1 1.7l1.8 4c.2.4.3.8.3 1.3V18h-3"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><line x1="15" y1="7" x2="15" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                    <span>Envío<br/>Gratis</span>
                  </div>
                  <div className="hero-tablet">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2f3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <span>Cuotas<br/>sin interés</span>
                  </div>
                  <div className="hero-tablet">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e2f3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Garantía<br/>30 días</span>
                  </div>
                </div>
              )}

              {/* Precio: antes tachado + ahora grande + descuento — oculto cuando hay bundle picker */}
              {!MC.bundles && (
                <div className="hero-priceRow">
                  <span className="hero-was">{moneyARS(compareAt)}</span>
                  <span className="hero-now">{moneyARS(price)}</span>
                  <span className="hero-off">Descuento {discountPct}%</span>
                </div>
              )}

              {/* CTA grande 2 líneas — oculto cuando hay bundle picker */}
              {!MC.bundles && (
                <button
                  className="hero-ctaBig"
                  type="button"
                  onClick={handleBuyNow}
                >
                  {MC.ctaLine1 || "Pagar Contra Reembolso"}
                  <span>{MC.ctaLine2 || "Envío GRATIS en 24/48Hs"}</span>
                </button>
              )}

              {/* Pago seguro + iconos de tarjetas — oculto cuando hay bundle picker */}
              {!MC.bundles && (
                <div className="hero-payments">
                  <p className="hero-payments-title">Pago Seguro En Línea</p>
                  <div className="hero-payments-icons">
                    <PaymentIcons />
                  </div>
                </div>
              )}

              {/* Stock limitado — oculto cuando hay bundle picker (tiene su propia urgencia) */}
              {!MC.bundles && MC.stockAlert?.show && (
                <div className="limited-stock-container">
                  <div className="limited-stock-dot"><span style={{visibility:"hidden"}}>.</span></div>
                  <div>
                    {MC.stockAlertText
                      ? <span className="limited-stock-text1">{MC.stockAlertText}</span>
                      : <><span className="limited-stock-text1">¡Stock Limitado! </span><span className="limited-stock-text2">Pocas piezas disponibles.</span></>
                    }
                  </div>
                </div>
              )}

              {/* Trust lines */}
              {MC.trustLines && (
                <div className="pd-trustLines">
                  {MC.trustLines.map((line, i) => (
                    <div key={i} className="pd-trustLine">{line}</div>
                  ))}
                </div>
              )}
            </div>
            {/* ====== FIN CAMBIO HERO COMPACTO ====== */}

            {/* ✅ Mini reseñas: ya las tenés abajo del grid como MiniReviewsBar, NO TOCAMOS */}

            {/* ✅ CABA: PAGÁ AL RECIBIR */}
            <div className="pd-codBanner" role="note" aria-label="Pago al recibir en CABA">
              <div className="pd-codLeft">
                <svg className="pd-codIcon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="pd-codText">
                  <b>CABA — Pagá al recibir</b> en punto de encuentro o retiro
                </span>
              </div>
            </div>

            {/* Espaciador (margen en ProductDetail.css) */}
            <div className="pd-ctaBlock" />

          </aside>

        {!MC.hideMiniReviews && (
          <MiniReviewsBar reviews={miniReviews} tone="accent" maxChars={180} />
        )}
      </div>
      </div>{/* /pd-hero-row */}

      {/* pd-bands fuera del container → waves a ancho completo de pantalla */}
      <div className="pd-bands">
        {/* Sección problema / ciclo respiración (si existe en config) */}
        {MC.problemSection && (
          <Band variant="light">
            <div className="pd-sections-new">
              <Reveal as="section" className="pd-problem">
                <h2 className="section-title-pro">{MC.problemSection.title}</h2>
                <p className="pd-problem-text">{MC.problemSection.text}</p>
                <ul className="pd-problem-steps">
                  {MC.problemSection.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                <p className="pd-problem-footer">{MC.problemSection.footer}</p>
              </Reveal>
            </div>
          </Band>
        )}

        {/* Cómo funciona la compra (si existe en config) */}
        {MC.howToBuy && (
          <Band variant="blue">
            <div className="pd-sections-new">
              <Reveal as="section" className="pd-howToBuy">
                <h2 className="section-title-pro" style={{color:"#fff"}}>{MC.howToBuy.title}</h2>
                <div className="pd-htb-grid">
                  {MC.howToBuy.steps.map((step, i) => (
                    <div key={i} className="pd-htb-step">
                      <span className="pd-htb-icon">{step.icon}</span>
                      <span className="pd-htb-num">Paso {i + 1}</span>
                      <p className="pd-htb-text">{step.text}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Band>
        )}

        <Band variant="light">
          <div className="pd-sections-new">
            <VideoStripSection mc={MC} />
            <StoryBlocks mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="light" dark={NAVY} />

        <Band variant="blue">
          <div className="pd-sections-new">
            <BoxContents mc={MC} />
            {!MC.statsCircles && <HowToSteps mc={MC} />}
            <StatsCircles mc={MC} className="sc-section--navy-hole" />
            <AuthorityCard mc={MC} />
            <GuaranteeSection mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="dark" dark={NAVY} />

        <Band variant="light">
          <div className="pd-sections-new">
            <FaqSectionPro mc={MC} />
            <SocialCommentsSection mc={MC} />
            <AboutSection mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="light" dark={NAVY} />
      </div>

      <div className="sticky-pro">
        <div className="sticky-pro-left">
          <div className="sticky-prices">
            {totalQty > 1 && <span className="sticky-qty">{totalQty}x</span>}
            <span className="sticky-old">{formatARS(oldTotal)}</span>
            <span className="sticky-now">{formatARS(displayTotal)}</span>
          </div>
          <div className="sticky-count">
            <span className="sticky-countLabel">TERMINA EN</span>
            <CountdownTimer storageKey={`pd_cd_v2_${id}`} minutes={335} className="cd" />
          </div>
        </div>
        <button className="sticky-pro-btn2" onClick={handleBuyNow} type="button">
          {MC.stickyBtnText || "LO QUIERO"}
        </button>
      </div>

      {/* WhatsApp tab lateral */}
      <WhatsAppTab
        wa={MC.whatsapp && { ...MC.whatsapp, message: MC.whatsapp.message || "Hola!" }}
        raised="mobile"
        label="¿Dudas? Escribinos"
      />

      {/* Upsell sheet — aparece antes del checkout cuando hay config de upsell */}
      {showUpsellSheet && MC.upsell && (
        <UpsellSheet
          mc={MC}
          mainProduct={product}
          mainDisplayTotal={displayTotal}
          onConfirm={handleUpsellConfirm}
        />
      )}

      {/* Checkout sheet */}
      {showCheckout && (
        <CheckoutSheet onClose={() => setShowCheckout(false)} />
      )}
    </main>
  );
}