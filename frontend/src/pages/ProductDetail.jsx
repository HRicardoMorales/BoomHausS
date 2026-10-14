// frontend/src/pages/ProductDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from '../hooks/useCart';
import { trackWithCapi } from "../lib/metaPixel";
import Marquee from "../components/marquee.jsx";
import { LANDING_CONFIGS } from "../landings/index.js";
import { CheckoutSheet } from "./CheckoutSheet";
import StatsCircles from "../components/landing/StatsCircles";
import CountdownTimer from "../components/landing/CountdownTimer";
import SafeImg from "../components/SafeImg";
import "./ProductDetail.css";
import { THUMB_WIDTHS } from "../components/landing/imageSizes";
import { formatARS, moneyARS, clampPct, FALLBACK_IMG } from "../components/product/format";
import UnavailableProductPage from "../components/product/UnavailableProductPage";
import WaTab from "../components/product/WaTab";
import BoxContents from "../components/product/BoxContents";
import HowToSteps from "../components/product/HowToSteps";
import AuthorityCard from "../components/product/AuthorityCard";
import FaqSectionPro from "../components/product/FaqSectionPro";
import VideoStripSection from "../components/product/VideoStripSection";
import StoryBlocks from "../components/product/StoryBlocks";
import MiniReviewsBar from "../components/product/MiniReviewsBar";
import AboutSection from "../components/product/AboutSection";
import UpsellSheet from "../components/product/UpsellSheet";
import SocialCommentsSection from "../components/product/SocialCommentsSection";
import GuaranteeSection from "../components/product/GuaranteeSection";
import { WaveSeparator, Band } from "../components/product/Bands";
import ProductGallery from "../components/product/ProductGallery";
import VariantSelector from "../components/product/VariantSelector";
import PaymentIcons from "../components/product/PaymentIcons";
import BundlePicker from "../components/product/BundlePicker";
// Último import a propósito: estas reglas venían de un <style> inline al final
// del árbol y tienen que seguir ganando el empate de orden.
import "./ProductDetail.page.css";

/* ========================================================================
   MARKETING CONTENT — se carga dinámicamente desde src/landings/index.js
   El fallback es 'porta-cepillos' cuando se abre por /products/:id
   Para agregar un producto nuevo: copiá src/landings/porta-cepillos.js,
   editá los textos y registralo en src/landings/index.js
   ======================================================================== */
const MARKETING_CONTENT = LANDING_CONFIGS["porta-cepillos"] || {};

/* =========================
   Main
========================= */
export default function ProductDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // ✅ Config dinámica: si viene de /lp/:slug usa esa config, si no usa la de porta-cepillos
  const MCRaw = (slug && LANDING_CONFIGS[slug]) || MARKETING_CONTENT;

  // ── Soporte de variantes ────────────────────────────────────────────────────
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(() => MCRaw.defaultVariantIdx ?? 0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(() => MCRaw.defaultColorIdx ?? 0);
  const activeVariant = useMemo(
    () => (MCRaw.variants ? MCRaw.variants[selectedVariantIdx] || null : null),
    [MCRaw, selectedVariantIdx]
  );
  const activeColorVariant = useMemo(
    () => activeVariant?.colorVariants?.[selectedColorIdx] || null,
    [activeVariant, selectedColorIdx]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  // MC efectivo: cuando hay variante activa sobreescribe bundles/bullets/descripción;
  // si el producto del DB tiene bundles guardados, sus precios sobreescriben los del config.
  const MC = useMemo(() => {
    let base;
    if (!activeVariant) {
      base = MCRaw;
    } else {
      const kitBullets = activeVariant.kitBullets || [];
      const sharedBenefits = MCRaw.sharedBenefits || [];
      const mergedBullets = [...kitBullets, ...sharedBenefits];
      base = {
        ...MCRaw,
        bundles: activeVariant.bundles || MCRaw.bundles,
        trustBullets: mergedBullets.length ? mergedBullets : MCRaw.trustBullets,
        miniDescription: activeVariant.miniDescription || MCRaw.miniDescription,
      };
    }
    // Aplicar precios del DB (editados desde el admin) si existen
    if (product?.bundles?.length && base.bundles?.length) {
      const merged = base.bundles.map(cb => {
        const dbB = product.bundles.find(b => b.qty === cb.qty);
        if (!dbB) return cb;
        return { ...cb, price: dbB.price, compareAt: dbB.compareAt ?? cb.compareAt };
      });
      return { ...base, bundles: merged };
    }
    return base;
  }, [MCRaw, activeVariant, product]);
  // ── Fin soporte variantes ───────────────────────────────────────────────────
  const [showToast, setShowToast] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  // TODO(refactor ProductDetail): qty/bundle quedaron fijos; el selector real es selectedBundleIdx
  const [qty] = useState(1);
  const [bundle] = useState(1);
  const [selectedBundleIdx, setSelectedBundleIdx] = useState(() => {
    if (MCRaw.defaultBundleIdx !== undefined) return MCRaw.defaultBundleIdx;
    const bundles = activeVariant?.bundles || MCRaw.bundles;
    if (!bundles) return 1;
    const pop = bundles.findIndex(b => b.popular);
    return pop >= 0 ? pop : 1;
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUpsellSheet, setShowUpsellSheet] = useState(false);

  const lastViewedRef = useRef(null);
  // Evita mostrar la pantalla de carga completa cuando solo cambia la variante
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchOne() {
      try {
        setLoading(true);
        setError("");
        // Cuando hay variante activa con su propio productSlug, se fetchea por esa variante.
        // Fallback: MC.productSlug del config general, o el slug de la URL.
        const fetchSlug = slug
          ? (activeVariant?.productSlug || MC.productSlug || slug)
          : null;
        const res = fetchSlug
          ? await api.get(`/products/slug/${fetchSlug}`)
          : await api.get(`/products/${id}`);
        if (res.data?.ok) setProduct(res.data.data);
        else setError(slug
          ? `Producto no encontrado. Asegurate de que el producto tenga el slug "${fetchSlug}" en el panel de administración (Admin → Productos → Editar → campo Slug).`
          : "No se pudo cargar el producto.");
      } catch (err) {
        const is404 = err?.response?.status === 404;
        // Si la variante tiene imágenes de fallback en el config, mostramos la landing sin error
        if (is404 && activeVariant?.images?.length) {
          setProduct(null);
          setError("");
        } else {
          setError(slug && is404
            ? `Producto no encontrado con slug "${activeVariant?.productSlug || slug}". Abrí Admin → Productos, editá el producto y setéalo como slug.`
            : err?.response?.data?.message || "Error al cargar el producto.");
        }
      } finally {
        hasLoadedOnce.current = true;
        setLoading(false);
      }
    }
    fetchOne();
  // MC/activeVariant son config estática por slug: la clave real del fetch es productSlug.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, slug, activeVariant?.productSlug]);

  // Al cambiar variante: resetear imagen activa, color e índice de bundle
  useEffect(() => {
    setActiveImgIndex(0);
    setSelectedColorIdx(0);
    if (activeVariant?.bundles) {
      if (MCRaw.defaultBundleIdx !== undefined) {
        setSelectedBundleIdx(MCRaw.defaultBundleIdx);
      } else {
        const pop = activeVariant.bundles.findIndex(b => b.popular);
        setSelectedBundleIdx(pop >= 0 ? pop : 1);
      }
    }
  // Reset intencional solo al cambiar de variante (no al re-render del config).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantIdx]);

  const images = useMemo(() => {
    // Prioridad 1: color variant images (cuando hay selector de color activo)
    if (activeColorVariant?.images?.length) {
      return activeColorVariant.images.filter(Boolean);
    }
    // Prioridad 2: imágenes del producto fetched desde admin
    const arr = [];
    if (product?.imageUrl) arr.push(product.imageUrl);
    if (Array.isArray(product?.images)) {
      product?.images.forEach((x) => {
        if (x && typeof x === "string" && !arr.includes(x)) arr.push(x);
      });
    }
    if (arr.length) return arr;
    // Prioridad 3: fallback de imágenes del config de la variante (cuando el producto no está en admin)
    if (activeVariant?.images?.length) {
      return activeVariant.images.filter(Boolean);
    }
    return arr;
  }, [product, activeVariant, activeColorVariant]);

  const price = Number(product?.price) || 0;

  const compareAt =
    Number(product?.originalPrice) ||
    Number(product?.compareAtPrice) ||
    0;


  const pack2Discount = 10;
  const unitPrice = price;

  // Cuando la landing tiene bundles configurados, selectedBundleIdx conduce todo
  const activeBundleData = MC.bundles ? MC.bundles[selectedBundleIdx] : null;

  const promoOn = bundle === 2;
  const totalQty = activeBundleData
    ? activeBundleData.qty
    : (promoOn ? Math.max(2, qty) : 1);

  const displayTotal = activeBundleData
    ? activeBundleData.price
    : (promoOn
        ? Math.round(Math.max(2, qty) * unitPrice * (1 - pack2Discount / 100))
        : Math.round(unitPrice));

  const oldTotal = activeBundleData
    ? activeBundleData.compareAt
    : Math.round(compareAt * totalQty);

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

    // lastViewedRef guarda el guard: un ViewContent por producto por render
    // aunque el user vuelva atrás y adelante.
    trackWithCapi("ViewContent", {
      content_ids:  [String(contentId)],
      content_type: "product",
      value:        Number(price) || 0,
      currency:     "ARS",
    });
  }, [product, contentId, price]);

  // Scroll-reveal: animar solo los elementos debajo del fold
  useEffect(() => {
    if (!product && !activeVariant) return;
    let io = null;

    const timer = setTimeout(() => {
      const all = Array.from(document.querySelectorAll('.anim-el'));
      if (!all.length) return;

      // 1. Ocultar solo los que están completamente fuera del viewport inicial
      const vh = window.innerHeight;
      const belowFold = all.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top > vh + 40; // +40px de margen
      });
      belowFold.forEach(el => el.classList.add('anim-hidden'));

      if (!belowFold.length) return;

      // 2. Fallback: en 3s mostrar todo (por si IO falla)
      const fallback = setTimeout(() => {
        belowFold.forEach(el => el.classList.add('in-view'));
      }, 3000);

      if (!('IntersectionObserver' in window)) {
        clearTimeout(fallback);
        belowFold.forEach(el => el.classList.add('in-view'));
        return;
      }

      // Medir la altura real del sticky para no tapar la animación
      const stickyEl = document.querySelector('.sticky-pro');
      const stickyH = (stickyEl && stickyEl.offsetHeight > 0)
        ? stickyEl.offsetHeight + 24
        : 24;

      io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            // NO quitar anim-hidden — la transición vive ahí.
            // Solo agregar in-view que override opacity/transform.
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.04, rootMargin: `0px 0px -${stickyH}px 0px` });

      belowFold.forEach(el => io.observe(el));

      // cleanup del fallback cuando el IO termina su trabajo
      return () => { clearTimeout(fallback); io?.disconnect(); };
    }, 200);

    return () => { clearTimeout(timer); io?.disconnect(); };
  }, [product, activeVariant]);

  // En modo fallback (variante con imágenes de config pero sin producto en admin),
  // creamos un producto sintético para que el carrito funcione igual.
  // IMPORTANTE: esta variable debe definirse ANTES de los early returns.
  const hasVariantFallback = !product && (activeVariant?.images?.length ?? 0) > 0;
  const effectiveProduct = product || (hasVariantFallback ? {
    _id: activeVariant.productSlug || slug || "variant-fallback",
    name: MC.checkoutName || activeVariant?.name || "Producto",
    price: activeVariant?.bundles?.[selectedBundleIdx]?.price || 0,
    images: activeVariant?.images || [],
    imageUrl: activeVariant?.images?.[0] || "",
  } : null);

  // Nombre del item en carrito: enriquecido con variante + color + qty cuando aplica
  const cartItemName = useMemo(() => {
    const base = MC.checkoutName || effectiveProduct?.name;
    if (!base || !activeVariant) return base;
    const label = activeVariant.cartLabel;
    const colorName = activeColorVariant?.name || '';
    const qty = activeBundleData?.qty ?? totalQty ?? 1;
    const qtyStr = qty > 1 ? ` x${qty} unidades` : ` x1`;
    if (label) return `${base} ${label}${colorName ? ` — ${colorName}` : ''}${qtyStr}`;
    return `${base}${colorName ? ` ${colorName}` : ''}${qtyStr}`;
  }, [MC.checkoutName, effectiveProduct?.name, activeVariant, activeColorVariant, activeBundleData, totalQty]);

  // Producto con nombre adaptado a la landing (se muestra así en el resumen del checkout)
  const cartProduct = effectiveProduct
    ? { ...effectiveProduct, name: cartItemName || MC.checkoutName || effectiveProduct.name }
    : null;

  const handleBuyNow = () => {
    if (!effectiveProduct) return;
    // Si hay config de upsell, mostrar el sheet de upsell primero
    if (MC.upsell) {
      setShowUpsellSheet(true);
      return;
    }
    // Sin upsell: ir directo al checkout
    const mainOpts = {};
    if (activeBundleData) {
      // Bundle con precio fijo — bypassea el cálculo porcentual
      mainOpts.bundleTotal = activeBundleData.price;
      if (activeBundleData.compareAt) mainOpts.compareAtPrice = activeBundleData.compareAt;
    } else {
      const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
      if (promo) mainOpts.promo = promo;
      if (compareAt > unitPrice) mainOpts.compareAtPrice = compareAt;
    }
    addItem(cartProduct, totalQty, Object.keys(mainOpts).length ? mainOpts : undefined);
    setShowCheckout(true);
  };

  const handleUpsellConfirm = (bundle) => {
    setShowUpsellSheet(false);
    // Agregar producto principal
    const mainOpts = {};
    if (activeBundleData) {
      mainOpts.bundleTotal = activeBundleData.price;
      if (activeBundleData.compareAt) mainOpts.compareAtPrice = activeBundleData.compareAt;
    } else {
      const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
      if (promo) mainOpts.promo = promo;
      if (compareAt > unitPrice) mainOpts.compareAtPrice = compareAt;
    }
    addItem(cartProduct, totalQty, Object.keys(mainOpts).length ? mainOpts : undefined);
    // Si eligió accesorios, agregarlos también
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

  if (loading && !hasLoadedOnce.current)
    return (
      <main className="section">
        <div className="container">
          <div className="card">Cargando…</div>
        </div>
      </main>
    );

  if (error || (!product && !hasVariantFallback)) {
    // Distinguimos "no encontrado" (404 real, producto inactivo/inexistente)
    // de error de red. Los mensajes de error de arriba usan la palabra
    // "encontrado" o "slug" cuando es 404; cualquier otra cosa es red.
    const isNetworkError = !!error && !/encontrado|slug/i.test(error);
    return (
      <UnavailableProductPage
        isNetworkError={isNetworkError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ✅ para el nuevo hero (como la captura)
  const discountPct = clampPct(Math.round((1 - unitPrice / compareAt) * 100));

  return (
    <main className="section main-wrapper pd-page pd-detail">
      {/* Marquee movido a App.jsx arriba del navbar */}

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

              {/* Avatars + reseñas */}
              <div className="reviews-container">
                <div className="avatars">
                  <img src="https://img.freepik.com/free-photo/stylish-african-american-woman-smiling_23-2148770405.jpg" alt="" className="avatar" width={28} height={28} decoding="async" />
                  <img src="https://thumbs.dreamstime.com/b/beautiful-african-american-woman-relaxing-outside-happy-middle-aged-smiling-46298787.jpg" alt="" className="avatar" width={28} height={28} decoding="async" />
                  <img src="https://media.istockphoto.com/id/1320651997/photo/young-woman-close-up-isolated-studio-portrait.jpg?s=612x612&w=0&k=20&c=lV6pxz-DknISGT2jjiSvUmSaw0hpMDf-dBpT8HTSAUI=" alt="" className="avatar" width={28} height={28} decoding="async" />
                </div>
                <span className="text-grey">
                  Calificado <strong>4.5/5</strong> basado en <strong>+650 reseñas</strong>
                </span>
              </div>

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
                onSelect={setSelectedVariantIdx}
                activeVariant={activeVariant}
                selectedColorIdx={selectedColorIdx}
                onSelectColor={setSelectedColorIdx}
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
                onSelect={setSelectedBundleIdx}
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
                  <span className="hero-now">{moneyARS(unitPrice)}</span>
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
                >
                COMPRAR AHORA
              </button> */}


              {/* Botones de carrito e instalación eliminados */}
            </div>

          </aside>

        {!MC.hideMiniReviews && (
          <MiniReviewsBar productImg={images?.[0] || FALLBACK_IMG} mc={MC} />
        )}
      </div>
      </div>{/* /pd-hero-row */}

      {/* pd-bands fuera del container → waves a ancho completo de pantalla */}
      <div className="pd-bands">
        {/* Sección problema / ciclo respiración (si existe en config) */}
        {MC.problemSection && (
          <Band variant="light">
            <div className="pd-sections-new">
              <section className="pd-problem anim-el">
                <h2 className="section-title-pro">{MC.problemSection.title}</h2>
                <p className="pd-problem-text">{MC.problemSection.text}</p>
                <ul className="pd-problem-steps">
                  {MC.problemSection.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                <p className="pd-problem-footer">{MC.problemSection.footer}</p>
              </section>
            </div>
          </Band>
        )}

        {/* Cómo funciona la compra (si existe en config) */}
        {MC.howToBuy && (
          <Band variant="blue">
            <div className="pd-sections-new">
              <section className="pd-howToBuy anim-el">
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
              </section>
            </div>
          </Band>
        )}

        <Band variant="light">
          <div className="pd-sections-new">
            <VideoStripSection mc={MC} />
            <StoryBlocks mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="light" />

        <Band variant="blue">
          <div className="pd-sections-new">
            <BoxContents mc={MC} />
            {!MC.statsCircles && <HowToSteps mc={MC} />}
            <StatsCircles mc={MC} className="sc-section--navy-hole" />
            <AuthorityCard mc={MC} />
            <GuaranteeSection mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="blue" />

        <Band variant="light">
          <div className="pd-sections-new">
            <FaqSectionPro mc={MC} />
            <SocialCommentsSection mc={MC} />
            <AboutSection mc={MC} />
          </div>
        </Band>

        <WaveSeparator from="light" />
      </div>

      {showToast && (
        <div className="pd-toast-wrapper">
          <div className="pd-toast-content">
            <div className="pd-toast-main">
              <SafeImg
                src={images[0]}
                alt=""
                name={effectiveProduct?.name || MC.checkoutName}
                className="pd-toast-img"
                widths={THUMB_WIDTHS}
                sizes="52px"
                width={52}
                height={52}
                referrerPolicy="no-referrer"
              />
              <div className="pd-toast-info">
                <span className="pd-toast-status">✓ ¡Agregado!</span>
                <span className="pd-toast-name">{effectiveProduct?.name || MC.checkoutName}</span>
              </div>
              <button className="pd-toast-close" onClick={() => setShowToast(false)} type="button">
                ✕
              </button>
            </div>

            <div className="pd-toast-actions">
              <button className="pd-toast-btn-secondary" onClick={() => navigate("/cart")} type="button">
                IR AL CARRITO
              </button>
              <button className="pd-toast-btn-primary" onClick={() => { setShowToast(false); setShowCheckout(true); }} type="button">
                FINALIZAR COMPRA
              </button>
            </div>
          </div>
        </div>
      )}

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
      {MC.whatsapp?.show && (
        <WaTab number={MC.whatsapp.number} message={MC.whatsapp.message} />
      )}

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