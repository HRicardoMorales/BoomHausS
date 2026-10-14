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
import HeroAccordions from "../components/product/HeroAccordions";
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
    <main className="section main-wrapper pd-page">
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
              {MCRaw.variants && MCRaw.variants.length > 1 && (
                <div className="vsel2-wrap">
                  <div className="vsel2-label">Elegí tu versión</div>
                  <div className="vsel2-grid">
                    {MCRaw.variants.map((v, i) => {
                      const img = v.thumbImg ?? v.images?.[0];
                      const isOn = selectedVariantIdx === i;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={`vsel2-card${isOn ? " vsel2-card--on" : ""}`}
                          onClick={() => setSelectedVariantIdx(i)}
                          aria-pressed={isOn}
                        >
                          <div className="vsel2-img-wrap">
                            {img
                              ? <SafeImg src={img} alt="" name={v.name} className="vsel2-img" widths={THUMB_WIDTHS} sizes="72px" width={72} height={72} />
                              : <div className="vsel2-img-ph" />
                            }
                            {v.badge && <span className="vsel2-badge">{v.badge}</span>}
                          </div>
                          <div className="vsel2-name">{v.name}</div>
                          {v.bundles?.[0]?.price && (
                            <div className="vsel2-from">desde {moneyARS(v.bundles[0].price)}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Nivel 2: color — solo visible cuando la variante activa tiene colorVariants */}
                  {activeVariant?.colorVariants?.length > 0 && (
                    <div className="vsel2-sub">
                      <div className="vsel2-sub-label">Color</div>
                      <div className="vsel2-sub-grid">
                        {activeVariant.colorVariants.map((cv, ci) => {
                          const img = cv.thumbImg ?? cv.images?.[0];
                          const isOn = selectedColorIdx === ci;
                          return (
                            <button
                              key={cv.id}
                              type="button"
                              className={`vsel2-card${isOn ? " vsel2-card--on" : ""}`}
                              onClick={() => setSelectedColorIdx(ci)}
                              aria-pressed={isOn}
                            >
                              <div className="vsel2-img-wrap">
                                {img
                                  ? <SafeImg src={img} alt="" name={cv.name} className="vsel2-img" widths={THUMB_WIDTHS} sizes="56px" width={56} height={56} />
                                  : <div className="vsel2-img-ph" />
                                }
                              </div>
                              <div className="vsel2-name">{cv.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="vsel-divider" />
                </div>
              )}

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
              {MC.bundles && (
                <div className="bnd2-wrap">
                  {/* Título de sección */}
                  <div className="bnd2-section-title">✨ Ofertas por Tiempo Limitado ✨</div>

                  {MC.bundles.map((opt, i) => (
                    <div
                      key={i}
                      className={`bnd2-card${selectedBundleIdx === i && !opt.soldOut ? " bnd2-card--on" : ""}${opt.popular ? " bnd2-card--pop" : ""}${opt.soldOut ? " bnd2-card--sold-out" : ""}`}
                      onClick={() => !opt.soldOut && setSelectedBundleIdx(i)}
                      role="button"
                      tabIndex={opt.soldOut ? -1 : 0}
                      aria-disabled={opt.soldOut || undefined}
                      onKeyDown={e => !opt.soldOut && e.key === "Enter" && setSelectedBundleIdx(i)}
                    >
                      {opt.popular && (
                        <span className="bnd2-float-badge">{opt.badge || "Más Elegido"}</span>
                      )}
                      {opt.soldOut && (
                        <div className="bnd2-sold-out-overlay">
                          <span className="bnd2-sold-out-text">AGOTADO</span>
                        </div>
                      )}
                      <div className="bnd2-row">
                        <input
                          type="radio"
                          name="pd-bundle"
                          className="bnd2-radio"
                          checked={selectedBundleIdx === i && !opt.soldOut}
                          onChange={() => !opt.soldOut && setSelectedBundleIdx(i)}
                          disabled={opt.soldOut}
                          aria-label={opt.label}
                        />
                        <div className="bnd2-center">
                          <span className="bnd2-name">{opt.label}</span>
                          {opt.badge && !opt.popular && (
                            <span className="bnd2-badge">{opt.badge}</span>
                          )}
                        </div>
                        {!opt.soldOut && (
                          <div className="bnd2-prices">
                            {opt.compareAt > 0 && <span className="bnd2-was">{moneyARS(opt.compareAt)}</span>}
                            <span className="bnd2-now">{moneyARS(opt.price)}</span>
                          </div>
                        )}
                      </div>
                      {opt.benefit && !opt.soldOut && (
                        <div className="bnd2-benefit">{opt.benefit}</div>
                      )}
                    </div>
                  ))}

                  {/* CTA */}
                  <button
                    className="bnd2-cta"
                    type="button"
                    onClick={handleBuyNow}
                  >
                    AGREGAR AL CARRITO
                  </button>

                  {/* Pago seguro + logos */}
                  <div className="bnd2-payments">
                    <p className="bnd2-payments-title">Pago Seguro En Línea</p>
                    <div className="bnd2-payments-icons">
                      <div className="hero-pay-icon">
                        <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 21h-3.2l2-12.4h3.2L19.5 21zm12.8-12.1c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.7l-.4-.2-.4 2.7c.7.4 2.1.7 3.5.7 3.4 0 5.5-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.5-2.7zm8.3-.3h-2.5c-.8 0-1.3.2-1.7 1L32 21h3.4l.7-1.8h4.1l.4 1.8H44l-2.7-12.4h-2.7zm-3.3 8l1.7-4.6.8 4.6h-2.5zM16.3 8.6l-3.1 8.5-.3-1.7c-.6-2-2.4-4.2-4.5-5.2l2.9 10.7h3.4l5.1-12.3h-3.5z" fill="#1A1F71"/><path d="M10.4 8.6H5.1l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.3-1.1z" fill="#F9A533"/></svg>
                      </div>
                      <div className="hero-pay-icon">
                        <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.3a9 9 0 013 6.7 9 9 0 01-3 6.7 9 9 0 01-3-6.7 9 9 0 013-6.7z" fill="#FF5F00"/></svg>
                      </div>
                      <div className="hero-pay-icon">
                        <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#2557D6"/><path d="M6 16l3-7h3.5l1.5 3.5V9h4.3l1 3 1-3h4.2v14h-3.5l-1.5-3.3V23H15l-.7-1.8h-2.1L11.5 23H8l3-7zm5 4h1.5l-2.2-5.2L10.2 20H11zm6-7v7h2v-3l2 3h2.5l-2.5-3.5L23.5 13H21l-2 2.5V13h-2zm11-4l-3.5 7.5V23h2.5v-3l3.5-7h-2.5zm4.5 0v14h7.5l2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2-2.5L39 9h-6.5zm2.5 3h3l-1.2 1.5L37 12h-2zm0 4h3l-1.2 1.5L37 16h-2zm0 4h3l-1.2 1.5L37 20h-2z" fill="#fff"/></svg>
                      </div>
                      <div className="hero-pay-icon">
                        <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 8h5.8c2.7 0 4.6 1.8 4.2 4.5-.5 3.3-2.8 5-5.8 5h-1.5c-.4 0-.8.3-.9.8l-.8 4.7h-3c-.3 0-.4-.2-.4-.4L19.5 8z" fill="#253B80"/><path d="M21 18.3l.8-4.8c.1-.4.4-.7.8-.7h3.5c1.5 0 2.7-.5 3.4-1.5-.3 3-2.5 4.7-5.2 4.7h-1.5c-.4 0-.8.3-.9.8l-.9 5.2h-2.5l2.5-3.7z" fill="#179BD7"/></svg>
                      </div>
                      <div className="hero-pay-icon">
                        <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="8" y="10" width="32" height="12" rx="2" fill="#00A650"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="Arial">RAPIPAGO</text></svg>
                      </div>
                    </div>
                  </div>

                  {/* Urgencia */}
                  <div className="bnd2-urgency">
                    <span className="bnd2-urgency-dot" />
                    ¡Últimas unidades!
                  </div>

                  {/* Acordeones de compra (Regalos / Garantía) */}
                  {MC.heroAccordions?.length > 0 && (
                    <HeroAccordions items={MC.heroAccordions} />
                  )}
                </div>
              )}

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
                    {/* Visa */}
                    <div className="hero-pay-icon">
                      <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 21h-3.2l2-12.4h3.2L19.5 21zm12.8-12.1c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.7l-.4-.2-.4 2.7c.7.4 2.1.7 3.5.7 3.4 0 5.5-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.5-2.7zm8.3-.3h-2.5c-.8 0-1.3.2-1.7 1L32 21h3.4l.7-1.8h4.1l.4 1.8H44l-2.7-12.4h-2.7zm-3.3 8l1.7-4.6.8 4.6h-2.5zM16.3 8.6l-3.1 8.5-.3-1.7c-.6-2-2.4-4.2-4.5-5.2l2.9 10.7h3.4l5.1-12.3h-3.5z" fill="#1A1F71"/><path d="M10.4 8.6H5.1l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.3-1.1z" fill="#F9A533"/></svg>
                    </div>
                    {/* Mastercard */}
                    <div className="hero-pay-icon">
                      <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.3a9 9 0 013 6.7 9 9 0 01-3 6.7 9 9 0 01-3-6.7 9 9 0 013-6.7z" fill="#FF5F00"/></svg>
                    </div>
                    {/* Amex */}
                    <div className="hero-pay-icon">
                      <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#2557D6"/><path d="M6 16l3-7h3.5l1.5 3.5V9h4.3l1 3 1-3h4.2v14h-3.5l-1.5-3.3V23H15l-.7-1.8h-2.1L11.5 23H8l3-7zm5 4h1.5l-2.2-5.2L10.2 20H11zm6-7v7h2v-3l2 3h2.5l-2.5-3.5L23.5 13H21l-2 2.5V13h-2zm11-4l-3.5 7.5V23h2.5v-3l3.5-7h-2.5zm4.5 0v14h7.5l2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2-2.5L39 9h-6.5zm2.5 3h3l-1.2 1.5L37 12h-2zm0 4h3l-1.2 1.5L37 16h-2zm0 4h3l-1.2 1.5L37 20h-2z" fill="#fff"/></svg>
                    </div>
                    {/* PayPal */}
                    <div className="hero-pay-icon">
                      <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 8h5.8c2.7 0 4.6 1.8 4.2 4.5-.5 3.3-2.8 5-5.8 5h-1.5c-.4 0-.8.3-.9.8l-.8 4.7h-3c-.3 0-.4-.2-.4-.4L19.5 8z" fill="#253B80"/><path d="M21 18.3l.8-4.8c.1-.4.4-.7.8-.7h3.5c1.5 0 2.7-.5 3.4-1.5-.3 3-2.5 4.7-5.2 4.7h-1.5c-.4 0-.8.3-.9.8l-.9 5.2h-2.5l2.5-3.7z" fill="#179BD7"/></svg>
                    </div>
                    {/* Rapipago */}
                    <div className="hero-pay-icon">
                      <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="8" y="10" width="32" height="12" rx="2" fill="#00A650"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="Arial">RAPIPAGO</text></svg>
                    </div>
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

      {/* ✅ CSS */}
      <style>{`
      /* ── Upsell sheet: rows (compartidos con UpsellSheet) ── */
      #upsell-section { padding: 0; }
      .ups-head { text-align: center; margin-bottom: 16px; }
      .ups-head-label { display: inline-block; font-size: .68rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; color: var(--pd-accent); background: rgb(var(--pd-accent-rgb) / .08); border-radius: 999px; padding: 3px 12px; margin-bottom: 8px; }
      .ups-head-title { font-size: 1.12rem; font-weight: 900; margin: 0 0 4px; }
      .ups-head-sub { font-size: .80rem; color: rgba(11,18,32,.50); font-weight: 600; margin: 0; }
      .ups-list { display: flex; flex-direction: column; gap: 10px; }
      .ups-row {
        display: flex; align-items: center; gap: 12px;
        background: #fff;
        border: 1.5px solid rgba(2,8,23,.09);
        border-radius: 14px;
        padding: 12px 12px 12px 12px;
        cursor: pointer;
        transition: border-color .18s, background .18s, box-shadow .18s;
        box-shadow: 0 2px 8px rgba(10,20,40,.05);
      }
      .ups-row:hover { border-color: rgb(var(--pd-accent-rgb) / .30); box-shadow: 0 4px 16px rgb(var(--pd-accent-rgb) / .08); }
      .ups-row--on {
        border-color: var(--color-success) !important;
        background: rgb(var(--green-600-rgb) / .04) !important;
        box-shadow: 0 4px 18px rgb(var(--green-600-rgb) / .12) !important;
      }
      .ups-row-img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(2,8,23,.07); flex-shrink: 0; }
      .ups-row-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .ups-row-badge { font-size: .62rem; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: var(--pd-accent); background: rgb(var(--pd-accent-rgb) / .09); border-radius: 999px; padding: 2px 8px; align-self: flex-start; }
      .ups-row-name { font-size: .88rem; font-weight: 800; margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ups-row-prices { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
      .ups-row-was { font-size: .76rem; font-weight: 700; color: rgba(11,18,32,.38); text-decoration: line-through; }
      .ups-row-now { font-size: .98rem; font-weight: 900; color: rgba(11,18,32,.90); }
      .ups-row-save { font-size: .72rem; font-weight: 900; color: var(--color-success-text); background: rgb(var(--green-600-rgb) / .10); border-radius: 999px; padding: 1px 7px; }
      .ups-row-btn {
        flex-shrink: 0; width: 36px; height: 36px;
        border-radius: 50%; border: 2px solid rgba(11,18,32,.18);
        background: transparent; color: rgba(11,18,32,.55);
        font-size: 1.2rem; font-weight: 900; line-height: 1;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all .18s;
      }
      .ups-row-btn:hover:not(:disabled) { border-color: var(--pd-accent); color: var(--pd-accent); background: rgb(var(--pd-accent-rgb) / .07); }
      .ups-row-btn--on { border-color: var(--color-success) !important; background: var(--color-success) !important; color: #fff !important; font-size: 1rem !important; }
      .ups-row-btn:disabled { opacity: .4; cursor: default; }
      .ups-footer { margin-top: 12px; text-align: center; font-size: .76rem; font-weight: 700; color: rgba(11,18,32,.45); }

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

      /* Reviews container */
      .reviews-container{
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0;
      }
      .avatars{
        display: flex;
        margin-right: 5px;
        margin-left: 7px;
      }
      .avatar{
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        margin-left: -7px;
        object-fit: cover;
      }
      .text-grey{
        font-weight: normal;
        font-size: 12px;
        color: #868686;
        line-height: 0px;
      }
      .text-grey strong{
        font-weight: 800;
        color: #2e2f3c;
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
        margin: 8px 0 8px;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }
      .hero-bullets-compact li{
        display:grid;
        grid-template-columns: 20px 1fr;
        gap: 8px;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.3;
        align-items: center;
        color: rgba(11,18,32,.85);
      }
      .hero-bullets-compact li::before{
        content: "✓";
        width:20px;
        height:20px;
        display:flex;
        align-items:center;
        justify-content:center;
        background: rgb(var(--green-600-rgb) / .1);
        color: var(--color-success-text);
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
      }

      /* ===== HERO TABLETS (Envío / Cuotas / Garantía) ===== */
      .hero-tablets{
        display: flex;
        gap: 0;
        margin: 6px 0 4px;
        flex-wrap: nowrap;
        border-top: 1px solid rgba(0,0,0,.08);
        border-bottom: 1px solid rgba(0,0,0,.08);
      }
      .hero-tablet{
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        padding: 10px 6px;
        font-size: 11px;
        font-weight: 700;
        color: #2e2f3c;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        border-right: 1px solid rgba(0,0,0,.08);
      }
      .hero-tablet:last-child{ border-right: none; }

      .hero-priceRow{
        display:flex;
        align-items: center;
        gap: 14px;
        justify-content: center;
        margin: 15px 0;
      }
      .hero-was{
        text-decoration: line-through;
        color: #999;
        font-size: 22px;
        font-weight: 400;
      }
      .hero-now{
        font-size: 30px;
        font-weight: 700;
        color: #000;
      }
      .hero-off{
        font-size: 18px;
        font-weight: 600;
        color: #C53030;
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
        background: linear-gradient(135deg, var(--pd-accent) 0%, var(--pd-accent-strong) 60%, var(--pd-accent-deep) 100%);
        color: #fff;
        box-shadow: 0 18px 55px rgb(var(--pd-accent-rgb) / .25);
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
        background: rgba(197,48,48,.08);
        border: 1px solid rgba(197,48,48,.12);
        margin-top: 10px;
        font-weight: 850;
      }
      .hero-dot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display:inline-block;
        background: #E53E3E;
        box-shadow: 0 10px 25px rgba(229,62,62,.25);
      }

      @media (max-width: 520px){
        .hero-title--compact{ font-size: 26px !important; }
        .hero-now{ font-size: 26px; }
        .hero-was{ font-size: 18px; }
        .hero-off{ font-size: 15px; }
        .hero-priceRow{ gap: 10px; margin: 12px 0; }
        .hero-bullets-compact li{ font-size: 13px; }
        .reviews-container{ margin: 4px 0; }
        .avatar{ width: 24px; height: 24px; }
        .text-grey{ font-size: 11px; }
      }
      /* ====== FIN CAMBIO CSS HERO COMPACTO ====== */

      /* ===== TITULOS PRO ===== */
      .sec-head{
        text-align: center;
        margin: 18px 0 10px;
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

      /* ===== HERO ROW: 2 columnas en desktop ===== */
      .pd-hero-row {
        display: block;
      }
      @media (min-width: 980px) {
        .pd-hero-row {
          display: flex;
          align-items: flex-start;
          max-width: 1180px;
          margin: 0 auto;
        }
        .pd-hero-row .pd-media-fullwidth {
          flex: 0 0 50%;
          max-width: 50%;
          position: sticky;
          top: 70px;
          align-self: flex-start;
        }
        .pd-hero-row .pd-container {
          flex: 1;
          min-width: 0;
          margin: 0 !important;
          padding: 0 28px 0 24px;
          max-width: 50%;
        }
        .pd-hero-row .pd-mediaMain--bigger {
          height: 560px;
          border-radius: 16px;
        }
      }

      /* ===== IMAGEN PRINCIPAL MÁS GRANDE ===== */
      .pd-media-fullwidth{
        width: 100%;
      }
      .pd-media { padding: 0 !important; overflow: hidden; border-radius: 0 !important; box-shadow: none !important; }
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
        display: flex;
        gap: 6px;
        padding: 6px 8px;
        background: transparent;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        justify-content: center;
      }
      .pd-thumbs-row::-webkit-scrollbar{ display: none; }
      .pd-thumb{
        flex: 1;
        min-width: 0;
        max-width: 90px;
        aspect-ratio: 4/3;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid rgba(0,0,0,.08);
        background: #f1f3f5;
        padding: 0;
        cursor: pointer;
        transition: border-color .15s ease, opacity .15s ease;
        opacity: .65;
      }
      .pd-thumb.is-active{
        border-color: rgb(var(--pd-accent-rgb) / .7);
        opacity: 1;
      }
      .pd-thumb img{ width:100%; height:100%; object-fit: cover; display:block; }

      /* hero */
      .hero-mini-desc{ color: rgba(11,18,32,.72); line-height: 1.7; margin: 10px 0 8px; }
      .inc-inline{ display:flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 6px; }
      .inc-chip{
        display:flex; align-items:center; gap: 8px;
        background: rgba(213,245,240,.78);
        border: 1px solid rgb(var(--pd-accent-rgb) / .14);
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
        text-transform: none;
        letter-spacing: -.02em;
        font-size: 1.85rem;
        font-weight: 900;
        color: rgba(11,18,32,.93);
        line-height: 1.18;
        margin: 0 0 12px;
      }
      @media (min-width: 900px){
        .flow-title{ font-size: 2.1rem; }
      }
      @media (max-width: 520px){
        .flow-title{ font-size: 1.55rem; }
      }
      .flow-p{
        margin: 0;
        color: rgba(11,18,32,.62);
        line-height: 1.68;
        font-weight: 400;
        font-size: 1.02rem;
        text-align: center;
      }

      /* Variante rich — se activa cuando el config tiene textHtml */
      .flow-p--rich{
        line-height: 1.68;
        font-size: 1.02rem;
        color: rgba(11,18,32,.62);
        font-weight: 400;
        letter-spacing: .002em;
      }
      .flow-p--rich strong{
        color: rgba(11,18,32,.90);
        font-weight: 700;
      }
      @media (min-width: 900px){
        .flow-p--rich{ font-size: 1.05rem; }
      }
      @media (max-width: 520px){
        .flow-p--rich{ font-size: .97rem; line-height: 1.62; }
      }
      /* título y badge compactos */
      .flow-text--rich .flow-title{ margin-bottom: 8px; }
      .flow-text--rich .flow-badge{ margin-bottom: 6px; }

      /* ===== FADE IMAGEN PRINCIPAL AL CAMBIAR VARIANTE ===== */
      @keyframes pdImgFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .pd-mainImg--anim {
        animation: pdImgFadeIn 150ms ease forwards;
      }

      /* ===== SELECTOR DE VARIANTES CON IMAGEN ===== */
      .vsel2-wrap {
        margin: 12px 0 4px;
      }
      .vsel2-label {
        font-size: .70rem;
        font-weight: 900;
        color: rgba(11,18,32,.38);
        text-transform: uppercase;
        letter-spacing: .09em;
        margin-bottom: 8px;
      }
      .vsel2-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .vsel2-card {
        border: 2px solid rgba(11,18,32,.10);
        border-radius: 14px;
        background: #fff;
        cursor: pointer;
        padding: 0;
        text-align: center;
        overflow: hidden;
        transition: border-color .13s, box-shadow .13s;
        -webkit-tap-highlight-color: transparent;
      }
      .vsel2-card:hover {
        border-color: rgba(11,92,255,.30);
      }
      .vsel2-card:active {
        transform: scale(.97);
      }
      .vsel2-card--on {
        border-color: var(--primary, #0B5CFF);
        box-shadow: 0 0 0 3px rgba(11,92,255,.12);
      }
      .vsel2-img-wrap {
        position: relative;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        background: #f4f4f6;
      }
      .vsel2-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .vsel2-img-ph {
        width: 100%;
        height: 100%;
        background: rgba(11,18,32,.06);
      }
      .vsel2-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        font-size: .58rem;
        font-weight: 900;
        letter-spacing: .05em;
        color: #fff;
        background: var(--primary, #0B5CFF);
        padding: 2px 7px;
        border-radius: 999px;
      }
      .vsel2-name {
        font-size: .73rem;
        font-weight: 800;
        color: rgba(11,18,32,.80);
        padding: 7px 8px 2px;
        line-height: 1.25;
      }
      .vsel2-from {
        font-size: .65rem;
        font-weight: 700;
        color: rgba(11,18,32,.42);
        padding: 0 8px 7px;
      }
      /* Separador visual entre selector y bundles */
      .vsel-divider {
        height: 1px;
        background: rgba(11,18,32,.07);
        margin: 10px 0 2px;
      }
      /* Nivel 2: selector de color */
      .vsel2-sub {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(11,18,32,.07);
      }
      .vsel2-sub-label {
        font-size: .70rem;
        font-weight: 900;
        color: rgba(11,18,32,.38);
        text-transform: uppercase;
        letter-spacing: .09em;
        margin-bottom: 8px;
      }
      .vsel2-sub-grid {
        display: flex;
        flex-direction: row;
        gap: 8px;
      }
      /* Cards de color: cuadradas y compactas */
      .vsel2-sub-grid .vsel2-card {
        width: 68px;
        flex: 0 0 68px;
        border-radius: 10px;
      }
      .vsel2-sub-grid .vsel2-img-wrap {
        aspect-ratio: 1 / 1;
        border-radius: 0;
      }
      .vsel2-sub-grid .vsel2-name {
        font-size: .60rem;
        padding: 4px 4px 4px;
        text-align: center;
      }

      /* ===== BUNDLE PICKER v2 ===== */
      .bnd2-wrap{
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 14px 0 4px;
      }
      /* Título de sección */
      .bnd2-section-title{
        text-align: center;
        font-size: .88rem;
        font-weight: 900;
        color: var(--pd-accent);
        letter-spacing: .04em;
        margin-bottom: 2px;
      }
      /* Card */
      .bnd2-card{
        position: relative;
        border-radius: 14px;
        border: 1.5px solid rgba(11,18,32,.13);
        border-left: 4px solid rgba(11,18,32,.10);
        background: #fff;
        cursor: pointer;
        transition: border-color .14s, background .14s, box-shadow .14s, border-left-color .14s;
        user-select: none;
        overflow: visible;
        padding: 13px 14px 13px 12px;
      }
      .bnd2-card:hover{
        border-color: rgb(var(--pd-accent-rgb) / .30);
        border-left-color: rgb(var(--pd-accent-rgb) / .40);
        background: rgb(var(--pd-accent-rgb) / .02);
      }
      .bnd2-card--on{
        border-color: var(--pd-accent) !important;
        border-left: 4px solid var(--pd-accent) !important;
        background: rgb(var(--pd-accent-rgb) / .04) !important;
        box-shadow: 0 4px 18px rgb(var(--pd-accent-rgb) / .10);
      }
      .bnd2-card--pop{
        border-color: rgb(var(--pd-accent-rgb) / .25);
        border-left-color: rgb(var(--pd-accent-rgb) / .30);
        background: rgb(var(--pd-accent-rgb) / .02);
        margin-top: 6px;
      }
      .bnd2-card--pop.bnd2-card--on{
        box-shadow: 0 6px 22px rgb(var(--pd-accent-rgb) / .15);
      }
      /* Sold out card */
      .bnd2-card--sold-out{
        cursor: not-allowed;
        opacity: .55;
        pointer-events: all;
        filter: grayscale(.4);
      }
      .bnd2-card--sold-out:hover{
        border-color: rgba(11,18,32,.13) !important;
        background: transparent !important;
      }
      .bnd2-sold-out-overlay{
        position: absolute; inset: 0;
        border-radius: 14px;
        background: rgba(240,240,240,.55);
        backdrop-filter: blur(1.5px);
        display: flex; align-items: center; justify-content: center;
        z-index: 2;
      }
      .bnd2-sold-out-text{
        font-size: .75rem; font-weight: 1000;
        letter-spacing: .14em; text-transform: uppercase;
        color: #555;
        background: #fff;
        border: 1.5px solid #ccc;
        border-radius: 999px;
        padding: 4px 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,.08);
      }
      /* Floating "Más Elegido" / custom badge */
      .bnd2-float-badge{
        position: absolute;
        top: -11px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, var(--pd-accent), var(--pd-accent-soft));
        color: #fff;
        font-size: .68rem;
        font-weight: 900;
        letter-spacing: .07em;
        text-transform: uppercase;
        padding: 3px 14px;
        border-radius: 999px;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgb(var(--pd-accent-rgb) / .30);
      }
      /* Inner row: radio | name+badge | prices */
      .bnd2-row{
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .bnd2-radio{
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        accent-color: var(--pd-accent);
        cursor: pointer;
      }
      .bnd2-center{
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .bnd2-name{
        font-size: .91rem;
        font-weight: 800;
        color: rgba(11,18,32,.88);
        line-height: 1.2;
      }
      .bnd2-badge{
        font-size: .62rem;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
        padding: 3px 9px;
        border-radius: 999px;
        background: rgb(var(--pd-accent-rgb) / .10);
        color: var(--pd-accent);
        border: 1px solid rgb(var(--pd-accent-rgb) / .20);
        white-space: nowrap;
      }
      .bnd2-badge--pop{
        background: linear-gradient(135deg, var(--pd-accent), var(--pd-accent-soft));
        color: #fff;
        border-color: transparent;
        box-shadow: 0 2px 8px rgb(var(--pd-accent-rgb) / .25);
      }
      .bnd2-prices{
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1px;
      }
      .bnd2-was{
        font-size: .72rem;
        color: rgba(11,18,32,.35);
        text-decoration: line-through;
        font-weight: 600;
        line-height: 1.1;
      }
      .bnd2-now{
        font-size: 1.10rem;
        font-weight: 900;
        color: rgba(11,18,32,.90);
        line-height: 1.1;
      }
      /* Benefit row — siempre visible en cada card */
      .bnd2-benefit{
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgb(var(--pd-accent-rgb) / .07);
        font-size: .80rem;
        font-weight: 700;
        color: var(--pd-accent);
        letter-spacing: .01em;
        line-height: 1.35;
      }
      /* CTA button */
      .bnd2-cta{
        width: 100%;
        padding: 16px 20px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, var(--pd-accent) 0%, var(--pd-accent-mid) 100%);
        color: #fff;
        font-size: 1.05rem;
        font-weight: 900;
        letter-spacing: .07em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 6px 22px rgb(var(--pd-accent-rgb) / .30);
        transition: transform .12s, box-shadow .12s, background .14s;
        margin-top: 4px;
      }
      .bnd2-cta:hover{
        background: linear-gradient(135deg, #163d31 0%, #245c4a 100%);
        box-shadow: 0 8px 28px rgb(var(--pd-accent-rgb) / .38);
        transform: translateY(-1px);
      }
      .bnd2-cta:active{ transform: translateY(0) scale(.98); }
      /* Payments below CTA */
      .bnd2-payments{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-top: 2px;
      }
      .bnd2-payments-title{
        font-size: .72rem;
        font-weight: 700;
        color: rgba(11,18,32,.45);
        letter-spacing: .04em;
        text-transform: uppercase;
        margin: 0;
      }
      .bnd2-payments-icons{
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
      }
      /* Urgency pill — fondo completo */
      .bnd2-urgency{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(229,62,62,.08);
        border: 1px solid rgba(229,62,62,.15);
        font-size: .80rem;
        font-weight: 800;
        color: rgba(180,30,30,.85);
        letter-spacing: .02em;
      }
      .bnd2-urgency-dot{
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e53e3e;
        flex-shrink: 0;
        animation: bnd2-pulse 1.4s ease-in-out infinite;
      }
      @keyframes bnd2-pulse{
        0%,100%{ box-shadow: 0 0 0 0 rgba(229,62,62,.55); }
        50%{ box-shadow: 0 0 0 5px rgba(229,62,62,0); }
      }

      /* ===== EMOJI BULLETS (Calmora style) ===== */
      .emoji-bullets{
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 10px 0 4px;
        width: 100%;
      }
      .emoji-bullet{
        font-size: .90rem;
        font-weight: 700;
        color: rgba(11,18,32,.82);
        line-height: 1.35;
        padding: 0;
      }
      @media (max-width: 520px){
        .emoji-bullet{ font-size: .86rem; }
      }

      /* ===== TRUST BADGES estilo Calmora (bnd2-tablets) ===== */
      .bnd2-tablets{
        display: flex;
        gap: 8px;
        margin: 12px 0 0;
        width: 100%;
      }
      .bnd2-tablet{
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        padding: 10px 6px;
        border-radius: 12px;
        border: 1px solid rgba(11,18,32,.11);
        background: #fff;
        text-align: center;
      }
      .bnd2-tablet-ico{
        font-size: 1.25rem;
        line-height: 1;
      }
      .bnd2-tablet-line1{
        font-size: .72rem;
        font-weight: 800;
        color: rgba(11,18,32,.80);
        line-height: 1.2;
      }
      .bnd2-tablet-line2{
        font-size: .65rem;
        font-weight: 600;
        color: rgba(11,18,32,.48);
        line-height: 1.2;
      }

      /* ===== HERO ACCORDIONS (Calmora) ===== */
      .hacc-wrap{
        display: flex;
        flex-direction: column;
        gap: 0;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(11,18,32,.10);
        margin-top: 6px;
      }
      .hacc-item{
        background: #fff;
        border-bottom: 1px solid rgba(11,18,32,.07);
      }
      .hacc-item:last-child{ border-bottom: none; }
      .hacc-item--open{
        background: rgb(var(--pd-accent-rgb) / .03);
      }
      .hacc-q{
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 14px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
      }
      .hacc-ico{
        font-size: 1rem;
        flex-shrink: 0;
        line-height: 1;
      }
      .hacc-title{
        flex: 1;
        font-size: .85rem;
        font-weight: 800;
        color: rgba(11,18,32,.85);
        line-height: 1.35;
      }
      .hacc-arrow{
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 1.5px solid rgb(var(--pd-accent-rgb) / .22);
        background: rgb(var(--pd-accent-rgb) / .06);
        position: relative;
        transition: transform .24s ease, background .18s;
      }
      .hacc-arrow::before{
        content: "";
        position: absolute;
        top: 50%; left: 50%;
        width: 5px; height: 5px;
        border-right: 1.5px solid rgb(var(--pd-accent-rgb) / .80);
        border-bottom: 1.5px solid rgb(var(--pd-accent-rgb) / .80);
        transform: translate(-50%, -65%) rotate(45deg);
        transition: transform .24s ease;
      }
      .hacc-item--open .hacc-arrow{
        transform: rotate(180deg);
        background: rgb(var(--pd-accent-rgb) / .12);
        border-color: rgb(var(--pd-accent-rgb) / .38);
      }
      .hacc-body{
        max-height: 0;
        overflow: hidden;
        transition: max-height .28s ease;
      }
      .hacc-item--open .hacc-body{
        max-height: 200px;
      }
      .hacc-content{
        padding: 0 14px 14px 38px;
        font-size: .83rem;
        font-weight: 500;
        color: rgba(11,18,32,.68);
        line-height: 1.6;
      }
      .hacc-content strong{
        color: rgba(11,18,32,.85);
        font-weight: 800;
      }

      /* ===== VIDEO STRIP ===== */
      .vstrip-section{
        margin-bottom: 28px;
      }
      /* Header: kicker + título centrados ARRIBA de los videos */
      .vstrip-header{
        text-align: center;
        margin-bottom: 16px;
      }
      .vstrip-kicker{
        display: inline-block;
        font-size: .68rem;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: var(--pd-accent);
        background: rgb(var(--pd-accent-rgb) / .08);
        border: 1px solid rgb(var(--pd-accent-rgb) / .15);
        padding: 4px 12px;
        border-radius: 999px;
        margin-bottom: 10px;
      }
      .vstrip-title{
        font-size: 1.18rem;
        font-weight: 1000;
        letter-spacing: -.01em;
        color: rgba(11,18,32,.88);
        margin: 0 0 5px;
        line-height: 1.25;
      }
      @media (min-width: 900px){
        .vstrip-title{ font-size: 1.38rem; }
      }
      .vstrip-sub{
        font-size: .88rem;
        font-weight: 600;
        color: rgba(11,18,32,.50);
        margin: 0;
      }
      /* Grid: tres columnas que siempre caben en mobile simultáneamente */
      .vstrip-row{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .vstrip-item{
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
      }
      .vstrip-media{
        aspect-ratio: 9 / 16;
        border-radius: 20px;
        overflow: hidden;
        background: rgba(11,18,32,.05);
        position: relative;
      }
      .vstrip-video{
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      /* Placeholder visual hasta tener el video */
      .vstrip-ph{
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, rgb(var(--pd-accent-rgb) / .08), rgb(var(--pd-accent-rgb) / .04));
        border: 1.5px dashed rgb(var(--pd-accent-rgb) / .20);
      }
      .vstrip-ph-ico{
        font-size: 2rem;
        opacity: .35;
        color: var(--pd-accent);
      }
      .vstrip-label{
        text-align: center;
        font-size: .75rem;
        font-weight: 800;
        color: rgba(11,18,32,.55);
        letter-spacing: .04em;
        text-transform: uppercase;
      }

      .pd-sections-new{ margin-top: 14px; padding-bottom: 28px; }
      .pd-flow{ display:flex; flex-direction: column; gap: 14px; }
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
        padding: 4px 11px;
        border-radius: 999px;
        background: rgb(var(--pd-accent-rgb) / .10);
        border: 1px solid rgb(var(--pd-accent-rgb) / .18);
        font-weight: 1100;
        color: rgba(11,18,32,.78);
        margin-bottom: 6px;
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

      /* ===== QUÉ VIENE EN LA CAJA ===== */
      .boxc{
        margin: 34px 0 10px;
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.10);
        box-shadow: 0 22px 70px rgba(10,20,40,.12);
      }

      .boxc-header{
        background: linear-gradient(135deg, #0b0b1a 0%, #1a1a3a 100%);
        padding: 22px 20px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .boxc-header-icon{
        font-size: 38px;
        line-height: 1;
        filter: drop-shadow(0 4px 14px rgba(0,0,0,.5));
        flex-shrink: 0;
      }

      .boxc-header-kicker{
        font-size: .7rem;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: rgba(255,255,255,.45);
        margin-bottom: 3px;
      }

      .boxc-header-title{
        font-size: 1.18rem;
        font-weight: 900;
        color: #fff;
        letter-spacing: -.01em;
        line-height: 1.2;
      }

      .boxc-grid{
        background: #fff;
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        justify-items: stretch;
      }

      .boxc-item:last-child:nth-child(odd){
        grid-column: 1 / -1;
        max-width: calc(50% - 5px);
        margin: 0 auto;
        width: 100%;
      }

      @media (min-width: 560px){
        .boxc-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .boxc-item:last-child:nth-child(odd){ grid-column: auto; max-width: none; margin: 0; }
      }

      .boxc-item{
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(248,250,252,.95);
        border: 1px solid rgba(2,8,23,.07);
        border-radius: 14px;
        padding: 12px 10px;
        opacity: 0;
        animation: boxcFadeUp .45s ease forwards;
        transition: transform .15s ease, box-shadow .15s ease;
      }

      .boxc-item:hover{
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(10,20,40,.08);
      }

      .boxc-item-icon{
        font-size: 20px;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: rgb(var(--pd-accent-rgb) / .07);
        border: 1px solid rgb(var(--pd-accent-rgb) / .12);
        flex-shrink: 0;
      }

      .boxc-item-info{
        flex: 1;
        min-width: 0;
      }

      .boxc-item-name{
        font-size: .83rem;
        font-weight: 800;
        color: rgba(11,18,32,.88);
        line-height: 1.25;
      }

      .boxc-item-qty{
        font-size: .72rem;
        font-weight: 600;
        color: rgba(11,18,32,.42);
        margin-top: 2px;
      }

      .boxc-item-check{
        font-size: 11px;
        font-weight: 900;
        color: var(--pd-accent-soft);
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: rgba(16,185,129,.12);
        border: 1px solid rgba(16,185,129,.25);
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      @keyframes boxcFadeUp{
        from{ opacity: 0; transform: translateY(12px); }
        to  { opacity: 1; transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce){
        .boxc-item{ animation: none; opacity: 1; }
      }

      #howto .sec-title,
      #howto .sec-sub,
      #authority .sec-title,
      #authority .sec-sub,
      #faq-section .sec-title,
      #faq-section .sec-sub{
        color: #fff;
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
        background: linear-gradient(180deg, rgba(213,245,240,.95), rgba(213,245,240,.65));
        border-bottom: 1px solid rgba(2,8,23,.06);
        font-weight: 1100;
      }
      .cmp-row{
        border-bottom: 1px solid rgba(2,8,23,.06);
        transition: background .18s ease, transform .18s ease;
      }
      .cmp-row:hover{ background: rgb(var(--pd-accent-rgb) / .06); transform: translateY(-1px); }
      .cmp-row:last-child{ border-bottom: none; }
      .cmp-k, .cmp-col{ padding: 14px 12px; color: rgba(11,18,32,.78); font-weight: 900; font-size: .92rem; }
      .cmp-a{ color: rgb(var(--pd-accent-rgb) / .95); font-weight: 1100; }
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

      /* ===== AUTHORITY CARD v3 ===== */
      .auth3{
        display: flex;
        gap: 0;
        border-radius: 18px;
        overflow: hidden;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.10);
        backdrop-filter: blur(12px);
        animation: popIn .4s ease both;
      }

      .auth3-photo-col{
        flex-shrink: 0;
        width: 170px;
        position: relative;
        overflow: hidden;
      }

      .auth3-photo{
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .auth3-content{
        flex: 1;
        padding: 22px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .auth3-label{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: .68rem;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: rgba(255,255,255,.50);
      }

      .auth3-label-dot{
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--pd-accent-soft);
        box-shadow: 0 0 10px rgba(16,185,129,.6);
        animation: livePulse 2.2s ease-in-out infinite;
      }

      .auth3-quote{
        margin: 0;
        padding: 0;
        border: none;
        font-size: .95rem;
        font-weight: 400;
        color: rgba(255,255,255,.85);
        line-height: 1.65;
        font-style: italic;
        position: relative;
      }

      .auth3-qq{
        font-family: Georgia, serif;
        font-size: 3.5rem;
        line-height: 0;
        color: rgba(255,255,255,.15);
        position: absolute;
        top: 8px;
        left: -4px;
        user-select: none;
        font-style: normal;
      }

      .auth3-author{
        margin-top: 2px;
      }

      .auth3-name{
        font-weight: 800;
        font-size: 1rem;
        color: #ffffff;
        line-height: 1.3;
      }

      .auth3-role{
        font-size: .8rem;
        font-weight: 500;
        color: rgba(255,255,255,.45);
        margin-top: 2px;
      }

      .auth3-badge{
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        gap: 6px;
        font-size: .72rem;
        font-weight: 700;
        color: var(--pd-accent-soft);
        background: rgba(16,185,129,.10);
        border: 1px solid rgba(16,185,129,.25);
        border-radius: 999px;
        padding: 5px 12px;
      }

      .auth3-disclaimer{
        margin: 0;
        font-size: .72rem;
        font-weight: 500;
        color: rgba(255,255,255,.28);
        line-height: 1.5;
        border-top: 1px solid rgba(255,255,255,.06);
        padding-top: 12px;
      }

      @media (max-width: 640px) {
        .auth3 { flex-direction: column; }
        .auth3-photo-col { width: 100%; min-height: 200px; max-height: 240px; }
        .auth3-content { padding: 24px 20px 22px; }
      }

      /* ===== FAQ ACCORDION ===== */
      .faq-acc-wrap{
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        padding: 24px 0 8px;
      }
      .faq-acc-title{
        font-size: 1.55rem;
        font-weight: 900;
        color: rgba(11,18,32,.90);
        text-align: center;
        margin: 0 0 24px;
        letter-spacing: -.02em;
        line-height: 1.2;
      }
      @media (max-width: 520px){
        .faq-acc-title{ font-size: 1.25rem; }
      }
      .faq-acc{
        width: 100%;
        border-radius: 5px;
      }
      .faq-acc-item{
        border-bottom: 1px solid #ccc;
        margin-bottom: 3px;
      }
      .faq-acc-item:last-child{ border-bottom: none; }
      .faq-acc-header{
        padding: 14px 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: rgba(11,18,32,.88);
        user-select: none;
        line-height: 1.4;
        transition: color .2s ease;
      }
      .faq-acc-header:hover{ color: var(--pd-accent); }
      .faq-acc-item.active .faq-acc-header{ color: var(--pd-accent); }
      .faq-acc-indicator{
        font-size: 1.4em;
        margin-left: 12px;
        flex-shrink: 0;
        color: var(--pd-accent);
        font-weight: 400;
        line-height: 1;
        transition: transform 0.3s ease;
        display: inline-block;
      }
      .faq-acc-item.active .faq-acc-indicator{
        transform: rotate(180deg);
      }
      .faq-acc-content{
        max-height: 0;
        overflow: hidden;
        padding: 0 10px;
        transition: max-height 0.35s ease, padding 0.3s ease;
      }
      .faq-acc-content p{
        margin: 6px 0 14px;
        font-size: 13.5px;
        color: rgba(11,18,32,.62);
        line-height: 1.6;
      }
      .faq-acc-item.active .faq-acc-content{
        max-height: 300px;
        padding: 4px 10px 4px;
      }

      /* stars */
      .stars-inline{ display:inline-flex; gap: 2px; justify-content: center; }
      .stars-inline .s{ opacity: .25; font-size: 14px; }
      .stars-inline .s.on{ opacity: 1; color: #D69E2E; }

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
        background: #E53E3E;
        color: #fff;
        display:grid;
        place-items:center;
        font-weight: 1100;
        box-shadow: 0 16px 40px rgba(229,62,62,.35);
      }
      .rv-body{ padding: 16px 16px 18px; display:flex; flex-direction: column; gap: 8px; text-align: center; min-height: 160px; }
      .rv-title{ font-weight: 1100; text-transform: uppercase; letter-spacing: .05em; color: rgba(11,18,32,.92); }
      .rv-text{ margin: 0; color: rgba(11,18,32,.70); line-height: 1.6; font-weight: 650; overflow:hidden; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; }
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
      .rv-dot.on{ background: rgb(var(--pd-accent-rgb) / .95); transform: scale(1.25); }

      /* ===== QUIÉNES SOMOS ===== */
      .about2{
        margin: 34px 0 10px;
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.10);
        box-shadow: 0 22px 70px rgba(10,20,40,.12);
      }

      .about2-top{
        background: linear-gradient(135deg, #0b0b1a 0%, #1a1a3a 100%);
        padding: 24px 22px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .about2-brand{
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .about2-live-dot{
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--pd-accent-soft);
        box-shadow: 0 0 10px rgba(16,185,129,.7);
        flex-shrink: 0;
        animation: livePulse 2.2s ease-in-out infinite;
      }

      @keyframes livePulse{
        0%,100%{ box-shadow: 0 0 6px rgba(16,185,129,.6); }
        50%    { box-shadow: 0 0 18px rgba(16,185,129,.95); }
      }

      .about2-brand-name{
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: rgba(255,255,255,.50);
      }

      .about2-tagline{
        margin: 0;
        font-size: 1.32rem;
        font-weight: 900;
        color: #fff;
        letter-spacing: -.015em;
        line-height: 1.2;
      }

      .about2-hero{
        position: relative;
        aspect-ratio: 16/7;
        overflow: hidden;
        background: #0b0b1a;
      }

      .about2-img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 30%;
        display: block;
        opacity: .85;
      }

      .about2-overlay{
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.15) 55%, transparent 100%);
        display: flex;
        align-items: flex-end;
        padding: 22px 20px;
      }

      .about2-quote{
        margin: 0;
        font-size: .88rem;
        font-weight: 500;
        color: rgba(255,255,255,.90);
        line-height: 1.6;
        font-style: italic;
        max-width: 580px;
      }

      .about2-stats{
        background: #fff;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid rgba(2,8,23,.06);
        border-bottom: 1px solid rgba(2,8,23,.06);
      }

      .about2-stat{
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 8px;
        text-align: center;
        border-right: 1px solid rgba(2,8,23,.06);
      }

      .about2-stat:last-child{ border-right: none; }

      .about2-stat-val{
        font-size: 1.28rem;
        font-weight: 900;
        color: rgba(11,18,32,.92);
        letter-spacing: -.02em;
        line-height: 1;
      }

      .about2-stat-lbl{
        font-size: .65rem;
        font-weight: 700;
        color: rgba(11,18,32,.42);
        margin-top: 5px;
        text-transform: uppercase;
        letter-spacing: .05em;
        line-height: 1.3;
      }

      .about2-pills{
        background: #fff;
        padding: 14px 16px 18px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      @media (min-width: 560px){
        .about2-pills{ grid-template-columns: repeat(4, 1fr); }
      }

      .about2-pill{
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(248,250,252,.95);
        border: 1px solid rgba(2,8,23,.07);
        border-radius: 12px;
        padding: 10px 12px;
        font-size: .82rem;
        font-weight: 800;
        color: rgba(11,18,32,.82);
        line-height: 1.25;
      }

      /* Sticky */
      .sticky-pro{
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fff;
        border-top: 1.5px solid rgba(2,8,23,.08);
        border-radius: 16px 16px 0 0;
        padding: 10px 12px calc(8px + env(safe-area-inset-bottom));
        box-shadow: 0 -4px 24px rgba(10,20,40,.10);
      }
      @media (min-width: 991px){ .sticky-pro{ display:none; } }

      .sticky-pro-left{
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        flex-shrink: 0;
      }
      .sticky-count{ display:flex; align-items:center; gap: 4px; }
      .sticky-countLabel{
        font-size: .58rem;
        color: rgba(11,18,32,.40);
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .cd{ font-variant-numeric: tabular-nums; color: #dc2626; font-weight: 900; font-size: .72rem; }

      .sticky-prices{ display:flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
      .sticky-qty{ font-size: .68rem; font-weight: 900; color: #fff; background: var(--pd-accent); border-radius: 999px; padding: 1px 7px; letter-spacing: .02em; align-self: center; }
      .sticky-old{ color: rgba(11,18,32,.35); font-weight: 700; text-decoration: line-through; font-size: .7rem; }
      .sticky-now{ font-weight: 900; color: rgba(11,18,32,.92); font-size: .95rem; }

      .sticky-pro-btn2{
        flex: 1;
        border: none;
        background: linear-gradient(135deg, var(--pd-accent) 0%, var(--pd-accent-strong) 60%, var(--pd-accent-deep) 100%);
        color: #fff;
        font-weight: 900;
        font-size: .82rem;
        border-radius: 12px;
        padding: 10px 12px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgb(var(--pd-accent-rgb) / .28);
        letter-spacing: .04em;
        text-transform: uppercase;
        transition: transform .12s ease, box-shadow .12s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sticky-pro-btn2:active{
        transform: scale(.98);
        box-shadow: 0 4px 14px rgb(var(--pd-accent-rgb) / .22);
      }

      /* Sticky responsive — pantallas chicas */
      @media (max-width: 380px){
        .sticky-pro{ gap: 8px; padding: 8px 10px calc(6px + env(safe-area-inset-bottom)); }
        .sticky-old{ font-size: .62rem; }
        .sticky-now{ font-size: .85rem; }
        .sticky-countLabel{ font-size: .52rem; }
        .cd{ font-size: .65rem; }
        .sticky-pro-btn2{ font-size: .75rem; padding: 9px 10px; border-radius: 10px; }
      }

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
        color: rgb(var(--pd-accent-rgb) / .95);
        text-decoration: underline;
        text-underline-offset: 4px;
        letter-spacing: .2px;
      }

      .pd-howLink:hover{
        opacity: .85;
        transform: translateY(-1px);
        transition: .15s ease;
      }

      /* ===== MINI RESEÑAS (mini cards) ===== */
      .mrb{
        margin-top: 14px;
        background: transparent;
      }

      .mrb-label{
        font-size: .70rem;
        font-weight: 800;
        letter-spacing: .07em;
        text-transform: uppercase;
        color: rgba(11,18,32,.38);
        margin-bottom: 8px;
      }

      .mrb-viewport{ overflow: hidden; }

      .mrb-track{
        display: flex;
        width: 100%;
        transition: transform .35s cubic-bezier(.4,0,.2,1);
        will-change: transform;
      }

      .mrb-slide{ flex: 0 0 100%; width: 100%; }

      .mrb-card{
        background: #fff;
        border: 1px solid rgba(2,8,23,.09);
        border-radius: 14px;
        padding: 12px 14px;
        box-shadow: 0 2px 12px rgba(10,20,40,.07);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .mrb-card-header{
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mrb-card-avatar{
        width: 34px;
        height: 34px;
        border-radius: 50%;
        color: #fff;
        font-weight: 900;
        font-size: .95rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        letter-spacing: 0;
      }

      .mrb-card-meta{
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .mrb-card-name{
        font-size: .80rem;
        font-weight: 800;
        color: rgba(11,18,32,.82);
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mrb-card-stars .stars-inline .s{ font-size: 11px; }

      .mrb-card-text{
        margin: 0;
        font-size: .84rem;
        font-style: italic;
        color: rgba(11,18,32,.65);
        font-weight: 500;
        line-height: 1.5;
      }

      .mrb-dots{
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-top: 10px;
      }

      .mrb-dot{
        width: 5px;
        height: 5px;
        border-radius: 999px;
        border: none;
        background: rgba(2,8,23,.18);
        cursor: pointer;
        padding: 0;
        transition: width .22s ease, background .18s ease;
      }
      .mrb-dot.on{
        background: rgb(var(--pd-accent-rgb) / .80);
        width: 16px;
      }

      /* ===== Delivery Notice ===== */
      .pd-deliveryNotice{
        margin: 14px 0 10px;
        display:flex;
        gap: 12px;
        align-items:center;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgb(var(--green-500-rgb) / .25);
        background: linear-gradient(180deg, rgb(var(--green-500-rgb) / .10), rgb(var(--green-500-rgb) / .06));
        box-shadow: 0 12px 28px rgba(16,185,129,.10);
      }

      .pd-deliveryIcon{
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display:grid;
        place-items:center;
        background: rgb(var(--green-500-rgb) / .14);
        border: 1px solid rgb(var(--green-500-rgb) / .22);
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
        background: rgb(var(--green-500-rgb) / .14);
        border: 1px solid rgb(var(--green-500-rgb) / .22);
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
        margin: 12px 0 10px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid rgba(11,18,32,.08);
        background: rgba(11,18,32,.03);
        display:flex;
        align-items:center;
      }

      .pd-codLeft{
        display:flex;
        align-items:center;
        gap: 10px;
      }

      .pd-codIcon{
        color: rgba(11,18,32,.45);
        flex-shrink: 0;
      }

      .pd-codText{
        font-size: .84rem;
        color: rgba(11,18,32,.60);
        line-height: 1.4;
        font-weight: 500;
      }
      .pd-codText b{
        color: rgba(11,18,32,.85);
        font-weight: 800;
      }

      /* ===== RETOQUE VISUAL GLOBAL ===== */

      /* Refined band backgrounds */
      .pd-bands > section:first-child{ padding-top: 28px; }
      .pd-band--light{ background: #ffffff; }
      .pd-band--blue { background: #0b172a; }
      .pd-band--blue .sec-title{ color: rgba(255,255,255,.92); }
      .pd-band--blue .sec-sub{ color: rgba(255,255,255,.50); }
      .pd-band--blue .flow-title{ color: rgba(255,255,255,.90); }
      .pd-band--blue .flow-p{ color: rgba(255,255,255,.65); }

      /* ===== WAVE DIVIDER (Shopify gentle-wave) ===== */
      .wave-divider {
        position: relative;
        width: 100%;
        overflow: hidden;
        background: var(--wave-top-color);
        line-height: 0;
        pointer-events: none;
        margin-top: -1px;
        margin-bottom: -1px;
      }
      .waves-anim {
        display: block;
        width: 100%;
        height: auto;
        max-height: 3rem;
        margin: 0;
      }
      @media (min-width: 1000px) {
        .waves-anim { max-height: 6rem; }
      }
      .parallax1 > use { animation: wMove1 10s linear infinite; animation-delay: -2s; }
      .parallax2 > use { animation: wMove2 8s linear infinite; opacity: 0.4; animation-delay: -2s; }
      .parallax3 > use { animation: wMove3 6s linear infinite; opacity: 0.3; animation-delay: -2s; }
      .parallax4 > use { animation: wMove4 4s linear infinite; opacity: 0.2; animation-delay: -2s; }
      @keyframes wMove1 { 0%{transform:translate(85px,0)} 100%{transform:translate(-90px,0)} }
      @keyframes wMove2 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)} }
      @keyframes wMove3 { 0%{transform:translate(85px,0)} 100%{transform:translate(-90px,0)} }
      @keyframes wMove4 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)} }
      @media (prefers-reduced-motion: reduce) {
        .parallax1 > use, .parallax2 > use, .parallax3 > use, .parallax4 > use { animation: none !important; }
      }

      /* ===== SCROLL ANIMATIONS (IntersectionObserver) ===== */
      /* Elementos visibles por defecto; JS añade anim-hidden solo a los de abajo del fold */
      .anim-el.anim-hidden{
        opacity: 0;
        transform: translateY(22px);
        /* La transición vive AQUÍ — cuando in-view se agrega arriba, el browser anima */
        transition: opacity .60s cubic-bezier(.22,1,.36,1),
                    transform .60s cubic-bezier(.22,1,.36,1);
      }
      /* in-view viene después en el CSS → gana el empate de especificidad → anima */
      .anim-el.in-view{
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      /* stagger sutil para bloques de historia */
      .pd-flow .anim-el.anim-hidden:nth-child(2){ transition-delay:.10s; }
      .pd-flow .anim-el.anim-hidden:nth-child(3){ transition-delay:.18s; }
      /* sticky siempre encima */
      .sticky-pro{ z-index:9000 !important; }

      /* Section spacing harmony */
      .pd-block{ padding-top: 12px; padding-bottom: 12px; }
      .pd-block:last-child{ padding-bottom: 0; }
      .pd-sections-new{ padding-top: 8px; padding-bottom: 36px; }
      #authority{ padding-bottom: 0; margin-bottom: -20px; }

      /* ===== BEFORE / AFTER SLIDER ===== */
      .ba-wrap{
        display: flex;
        justify-content: center;
        padding: 4px 0 8px;
      }
      .ba-container{
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        --position: 50%;
        width: 100%;
        max-width: 680px;
        box-shadow: 0 16px 48px rgba(0,0,0,.28);
        cursor: col-resize;
      }
      .ba-img-wrap{
        display: grid;
        position: relative;
        user-select: none;
      }
      /* After image: base layer, full width */
      .ba-img-after{
        display: block;
        width: 100%;
        max-height: 460px;
        object-fit: cover;
        object-position: center;
        grid-area: 1/1;
      }
      /* Before image: on top, clipped to --position */
      .ba-img-before{
        display: block;
        position: absolute;
        inset: 0;
        width: var(--position);
        height: 100%;
        object-fit: cover;
        object-position: left center;
        grid-area: 1/1;
      }
      /* Badges */
      .ba-badge{
        position: absolute;
        bottom: 14px;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(6px);
        color: #0f172a;
        font-size: .78rem;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 999px;
        pointer-events: none;
        z-index: 4;
        box-shadow: 0 2px 8px rgba(0,0,0,.18);
      }
      .ba-badge-before{ left: 14px; }
      .ba-badge-after{  right: 14px; }
      /* Invisible range — covers whole container for drag */
      .ba-range{
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: col-resize;
        z-index: 10;
        margin: 0;
        padding: 0;
        -webkit-appearance: none;
      }
      .ba-range:focus-visible ~ .ba-handle{
        outline: 3px solid #fff;
        outline-offset: 3px;
      }
      /* Divider line */
      .ba-line{
        position: absolute;
        inset: 0;
        left: var(--position);
        transform: translateX(-50%);
        width: 2px;
        height: 100%;
        background: rgba(255,255,255,.9);
        pointer-events: none;
        z-index: 5;
      }
      /* Handle button */
      .ba-handle{
        position: absolute;
        top: 50%;
        left: var(--position);
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(4px);
        border-radius: 999px;
        display: grid;
        place-items: center;
        pointer-events: none;
        z-index: 6;
        box-shadow: 0 2px 12px rgba(0,0,0,.30);
        color: #1e293b;
      }
      @media (max-width: 520px){
        .ba-container{ border-radius: 12px; }
        .ba-img-after, .ba-img-before{ max-height: 280px; }
      }

      /* ===== SOCIAL COMMENTS (Facebook style) ===== */
      .fbsc-wrap{
        max-width: 680px;
        margin: 0 auto;
        padding: 24px 0 8px;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-card{
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        padding: 16px;
        background: #fff;
      }
      .fbsc-title{
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 12px;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-write{
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        align-items: center;
      }
      .fbsc-fb-icon{
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }
      .fbsc-input{
        flex: 1;
        background: #f0f2f5;
        border-radius: 999px;
        padding: 9px 14px;
        color: #65676b;
        font-size: 13px;
        cursor: default;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-list{ display: flex; flex-direction: column; }
      .fbsc-thread{ margin-bottom: 12px; }
      .fbsc-thread > .fbsc-comment{ margin-bottom: 6px; }
      .fbsc-comment{
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }
      .fbsc-avatar{
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }
      .fbsc-avatar--sm{
        width: 36px;
        height: 36px;
      }
      .fbsc-bubble{
        background: #f0f2f5;
        border-radius: 14px;
        padding: 10px 12px;
        flex: 1;
        min-width: 0;
      }
      .fbsc-name{
        font-weight: 700;
        font-size: 13px;
        color: #1c1e21;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-text{
        font-size: 13px;
        margin-top: 4px;
        color: #1c1e21;
        line-height: 1.38;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-meta{
        font-size: 11.5px;
        color: #65676b;
        margin-top: 6px;
        font-family: Arial, Helvetica, sans-serif;
      }
      .fbsc-likes{ color: #1877f2; margin-left: 6px; }
      .fbsc-reply{
        margin-left: 52px;
        position: relative;
        padding-left: 12px;
        margin-top: 2px;
        margin-bottom: 8px;
      }
      .fbsc-reply::before{
        content: "";
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 2px;
        background: #d8dadf;
        border-radius: 2px;
      }
      .fbsc-pagination{
        text-align: center;
        margin-top: 12px;
      }
      .fbsc-pagination--dual{
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .fbsc-btn{
        appearance: none;
        border: 0;
        background: #1877f2;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        padding: 10px 18px;
        border-radius: 10px;
        cursor: pointer;
        font-family: Arial, Helvetica, sans-serif;
        transition: filter .15s ease;
      }
      .fbsc-btn:hover{ filter: brightness(0.93); }
      .fbsc-btn--ghost{
        background: #eef1f5;
        color: #1c1e21;
      }
      @media (max-width: 480px){
        .fbsc-avatar{ width: 38px; height: 38px; }
        .fbsc-avatar--sm{ width: 34px; height: 34px; }
        .fbsc-reply{ margin-left: 46px; }
      }

      /* ===== GARANTÍA — medalla dorada 30 días ===== */
      .grt-section {
        text-align: center;
        padding: 56px 20px 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* Medalla CSS — anillo dorado cónico + cara interior oscura */
      .grt-medal {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 38% 32%, rgba(255,245,120,.55) 0%, transparent 38%),
          conic-gradient(
            #9A6B00 0deg,   #FFD700 8deg,   #DAA520 16deg,  #FFD700 24deg,
            #9A6B00 32deg,  #FFD700 40deg,  #DAA520 48deg,  #FFD700 56deg,
            #9A6B00 64deg,  #FFD700 72deg,  #DAA520 80deg,  #FFD700 88deg,
            #9A6B00 96deg,  #FFD700 104deg, #DAA520 112deg, #FFD700 120deg,
            #9A6B00 128deg, #FFD700 136deg, #DAA520 144deg, #FFD700 152deg,
            #9A6B00 160deg, #FFD700 168deg, #DAA520 176deg, #FFD700 184deg,
            #9A6B00 192deg, #FFD700 200deg, #DAA520 208deg, #FFD700 216deg,
            #9A6B00 224deg, #FFD700 232deg, #DAA520 240deg, #FFD700 248deg,
            #9A6B00 256deg, #FFD700 264deg, #DAA520 272deg, #FFD700 280deg,
            #9A6B00 288deg, #FFD700 296deg, #DAA520 304deg, #FFD700 312deg,
            #9A6B00 320deg, #FFD700 328deg, #DAA520 336deg, #FFD700 344deg,
            #9A6B00 352deg, #FFD700 360deg
          );
        clip-path: polygon(
          50% 0%,   55% 4%,  62% 2%,  65% 7%,  72% 6%,  74% 12%,
          81% 12%,  82% 18%, 89% 20%, 88% 27%, 95% 30%, 92% 37%,
          99% 41%,  95% 48%, 100% 53%, 95% 59%, 99% 65%, 93% 70%,
          96% 77%,  89% 80%, 90% 87%, 83% 89%, 82% 96%, 74% 96%,
          71% 100%, 64% 97%, 59% 100%, 53% 97%, 47% 100%, 41% 97%,
          36% 100%, 29% 97%, 26% 96%, 18% 96%, 17% 89%, 10% 87%,
          11% 80%,  4% 77%,  7% 70%,  1% 65%,  5% 59%,  0% 53%,
          5% 48%,   1% 41%,  8% 37%,  5% 30%, 12% 27%, 11% 20%,
          18% 18%,  19% 12%, 26% 12%, 28% 6%, 35% 7%, 38% 2%, 45% 4%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 28px;
        filter: drop-shadow(0 12px 32px rgba(218,165,32,.60));
        animation: grtShine 3.5s ease-in-out infinite;
        flex-shrink: 0;
      }
      @keyframes grtShine {
        0%,100% { filter: drop-shadow(0 10px 28px rgba(218,165,32,.55)); }
        50%      { filter: drop-shadow(0 14px 44px rgba(255,215,0,.85)); }
      }
      @media (prefers-reduced-motion: reduce) {
        .grt-medal { animation: none; }
      }
      .grt-medal-face {
        width: 136px;
        height: 136px;
        border-radius: 50%;
        background: linear-gradient(160deg, #1c1a0e 0%, #0b172a 55%, #060d1a 100%);
        border: 2px solid rgba(255,215,0,.22);
        box-shadow: inset 0 3px 10px rgba(0,0,0,.50), inset 0 -1px 4px rgba(255,215,0,.10);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
      }
      .grt-medal-sup {
        font-size: .50rem;
        font-weight: 900;
        letter-spacing: .16em;
        text-transform: uppercase;
        color: #FFD700;
        line-height: 1.2;
      }
      .grt-medal-num {
        font-size: 3.6rem;
        font-weight: 1100;
        line-height: .95;
        color: #FFD700;
        letter-spacing: -.06em;
        text-shadow: 0 2px 14px rgba(255,215,0,.50);
      }
      .grt-medal-bot {
        font-size: .65rem;
        font-weight: 900;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: rgba(255,215,0,.75);
        line-height: 1.2;
      }

      .grt-title {
        margin: 0 0 14px;
        font-weight: 1100;
        letter-spacing: .03em;
        text-transform: uppercase;
        font-size: 2.1rem;
        line-height: 1.05;
        color: #fff;
      }
      @media (max-width: 520px) {
        .grt-title { font-size: 1.6rem; }
        .grt-medal { width: 148px; height: 148px; }
        .grt-medal-face { width: 112px; height: 112px; }
        .grt-medal-num { font-size: 2.9rem; }
      }
      .grt-sub {
        margin: 0 auto 28px;
        max-width: 420px;
        font-weight: 700;
        font-size: 1rem;
        color: rgba(255,255,255,.65);
        line-height: 1.70;
        white-space: pre-line;
      }
      .grt-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-bottom: 32px;
      }
      .grt-pill {
        padding: 9px 16px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.05);
        font-weight: 800;
        font-size: .83rem;
        color: rgba(255,255,255,.78);
        white-space: nowrap;
      }
      .grt-cta {
        display: inline-block;
        padding: 16px 42px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(135deg, #B8860B 0%, #DAA520 40%, #FFD700 100%);
        color: #0b172a;
        font-weight: 1100;
        font-size: 1rem;
        letter-spacing: .04em;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 14px 42px rgba(218,165,32,.40);
        transition: transform .15s ease, box-shadow .15s ease;
      }
      .grt-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 52px rgba(255,215,0,.55);
      }
      .grt-cta:active { transform: scale(.98); }
      @media (max-width: 520px) {
        .grt-section { padding: 44px 16px 40px; }
        .grt-pill { font-size: .79rem; padding: 8px 12px; }
        .grt-cta { width: 100%; padding: 16px; }
      }
      #guarantee .sec-title, #guarantee .sec-sub { color: #fff; }

      /* Story blocks: smoother image cards */
      .flow-imgBox{
        border-radius: 18px;
        transition: transform .28s ease, box-shadow .28s ease;
        box-shadow: 0 8px 32px rgba(10,20,40,.10);
      }
      .flow-imgBox:hover{
        transform: translateY(-5px) scale(1.01);
        box-shadow: 0 20px 56px rgba(10,20,40,.16);
      }
      .flow-row{ gap: 28px; }

      /* Reviews carousel cards */
      .rv-card{
        transition: transform .22s ease, box-shadow .22s ease;
      }
      .rv-slide:hover .rv-card{
        transform: translateY(-4px);
        box-shadow: 0 18px 50px rgba(10,20,40,.16);
      }

      /* Global interactive transitions */
      .hero-ctaBig{
        transition: transform .15s ease, box-shadow .18s ease, background .18s ease;
      }
      .hero-ctaBig:hover{
        transform: translateY(-2px);
        box-shadow: 0 22px 60px rgb(var(--pd-accent-rgb) / .32);
      }
      .hero-ctaBig:active{ transform: translateY(0) scale(.98); }

      .pd-ctaPrimary-outline{
        transition: transform .15s ease, box-shadow .18s ease;
      }
      .pd-ctaPrimary-outline:hover{
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(10,20,40,.12);
      }

      /* Accordion smooth open */
      .accordion-content{
        transition: max-height .28s cubic-bezier(.4,0,.2,1), opacity .22s ease;
        overflow:hidden;
        max-height:0;
        opacity:0;
      }
      .accordion-content.open{
        max-height:600px;
        opacity:1;
      }


      /* About stats */
      .about2-stat{ transition: transform .18s ease; }
      .about2-stat:hover{ transform: translateY(-3px); }

      /* Section header: subtle underline accent */
      .sec-head{ position:relative; }
      .sec-head::after{
        content:"";
        display:block;
        width:38px;
        height:3px;
        border-radius:999px;
        background:linear-gradient(90deg,var(--pd-accent),var(--pd-accent-soft));
        margin:10px auto 0;
      }
      .pd-band--blue .sec-head::after{
        background:linear-gradient(90deg,#60a5fa,#34d399);
      }

      /* ===== STOCK ALERT ===== */
      .limited-stock-container{
        display:flex; align-items:center;
        font-size:14px; color:#282828; line-height:22px;
        margin-top:10px;
      }
      .limited-stock-dot{
        width:10px; height:10px; background-color:#d74f33;
        border-radius:50%; margin-right:15px; flex-shrink:0;
        animation: limitedPulse 1.5s infinite;
      }
      .limited-stock-text1{
        font-weight:bold; font-size:14px; line-height:10px;
      }
      .limited-stock-text2{
        font-size:14px; line-height:10px;
      }
      .limited-stock-highlight{
        color:#d74f33;
      }
      @keyframes limitedPulse{
        0%{ box-shadow:0 0 10px #d74f33; transform:scale(1); }
        50%{ box-shadow:0 0 20px #d74f33; transform:scale(1); }
        100%{ box-shadow:0 0 10px #d74f33; transform:scale(1); }
      }

      /* ===== GUARANTEE BADGE ===== */
      .pd-guarantee{
        display:flex; align-items:center; gap:10px;
        background:#f0fdf4; border:1px solid #bbf7d0;
        border-radius:10px; padding:10px 14px;
        margin-top:8px;
      }
      .pd-guaranteeIcon{ font-size:1.3rem; flex-shrink:0; line-height:1; }
      .pd-guaranteeText{
        display:flex; flex-direction:column; gap:1px;
      }
      .pd-guaranteeText strong{
        font-size:.82rem; font-weight:800; color:var(--color-success-ink);
      }
      .pd-guaranteeText span{
        font-size:.72rem; font-weight:600; color:var(--color-success-text); opacity:.75;
      }

      }

      /* ===== PAYMENT ICONS ===== */
      .hero-payments{
        text-align: center;
        margin: 6px 0 2px;
      }
      .hero-payments-title{
        font-size: 13px;
        font-weight: 600;
        color: #555;
        margin: 0 0 6px;
        text-align: center;
        width: 100%;
      }
      .hero-payments-icons{
        display: flex;
        justify-content: center;
        gap: 4px;
        flex-wrap: wrap;
      }
      .hero-pay-icon{
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hero-pay-icon svg{
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,.07);
      }

      /* ===== TRUST LINES ===== */
      .pd-trustLines{
        display:flex; flex-direction:column; gap:4px; margin-top:10px;
      }
      .pd-trustLine{
        font-size:.78rem; font-weight:700; color:var(--color-success-ink); line-height:1.4;
      }

      /* ===== PROBLEM / BREATHING CYCLE SECTION ===== */
      .pd-problem{ text-align:center; max-width:640px; margin:0 auto; }
      .pd-problem-text{
        font-size:.92rem; line-height:1.7; color:rgba(11,18,32,.7);
        white-space:pre-line; margin-top:12px;
      }
      .pd-problem-steps{
        list-style:none; padding:0; margin:16px auto; text-align:left;
        display:inline-flex; flex-direction:column; gap:6px;
      }
      .pd-problem-steps li{
        font-size:.95rem; font-weight:700; color:rgba(11,18,32,.85); line-height:1.5;
      }
      .pd-problem-footer{
        font-size:1rem; font-weight:800; color:rgba(11,18,32,.9); margin-top:16px;
        font-style:italic;
      }

      /* ===== HOW TO BUY SECTION ===== */
      .pd-howToBuy{ text-align:center; }
      .pd-htb-grid{
        display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
        margin-top:20px;
      }
      @media (max-width:700px){
        .pd-htb-grid{ grid-template-columns:1fr; gap:14px; }
      }
      .pd-htb-step{
        background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
        border-radius:16px; padding:24px 16px; text-align:center;
      }
      .pd-htb-icon{ font-size:2rem; display:block; margin-bottom:8px; }
      .pd-htb-num{
        display:block; font-size:.7rem; font-weight:800; text-transform:uppercase;
        letter-spacing:.08em; color:rgba(255,255,255,.5); margin-bottom:6px;
      }
      .pd-htb-text{
        font-size:.88rem; font-weight:700; color:rgba(255,255,255,.9); line-height:1.45; margin:0;
      }

      /* ===== WHATSAPP TAB LATERAL ===== */
      .wa-tab{
        position:fixed;
        left:0;
        bottom:90px;
        transform:translateX(calc(-100% + 38px));
        z-index:8500;
        display:flex;
        flex-direction:row-reverse;
        align-items:center;
        gap:8px;
        background:#25D366;
        border-radius:0 24px 24px 0;
        padding:10px 12px 10px 14px;
        text-decoration:none;
        box-shadow:2px 2px 12px rgba(37,211,102,.35);
        transition:transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s ease;
        cursor:pointer;
      }
      .wa-tab--open{
        transform:translateX(0);
        box-shadow:4px 4px 24px rgba(37,211,102,.45);
      }
      .wa-tab-icon{
        flex-shrink:0;
      }
      .wa-tab-label{
        color:#fff;
        font-size:.82rem;
        font-weight:800;
        white-space:nowrap;
        opacity:0;
        max-width:0;
        overflow:hidden;
        transition:opacity .25s ease .05s, max-width .3s ease;
      }
      .wa-tab--open .wa-tab-label{
        opacity:1;
        max-width:200px;
      }
      .wa-tab:active{
        transform:translateX(0) scale(.96);
      }
      @media (min-width:991px){
        .wa-tab{
          bottom:24px;
          padding:12px 14px 12px 16px;
        }
        .wa-tab-icon{ width:26px; height:26px; }
        .wa-tab:hover{
          transform:translateX(0);
          box-shadow:4px 4px 24px rgba(37,211,102,.45);
        }
        .wa-tab:hover .wa-tab-label{
          opacity:1;
          max-width:200px;
        }
      }

      `}</style>

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