// frontend/src/pages/MundialLanding.jsx
// ─────────────────────────────────────────────────────────────
// Landing B2B para revendedores de productos del Mundial Argentina.
// URL: /lp/mundial-revendedores
// Esta página solo orquesta datos (productos, carrito, checkout, contexto
// de WhatsApp); las secciones viven en components/landing/mundial/, cada
// una con su CSS al lado, scopeado bajo :where(.ml-page).
// El corazón del pitch B2B es la CALCULADORA DE GANANCIA.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useCart } from '../hooks/useCart';
import { trackWithCapi } from "../lib/metaPixel";
import { CheckoutSheet } from "./CheckoutSheet";
import MC from "../landings/mundial-revendedores.js";
import { moneyARS } from "../components/landing/mundial/utils";
import { Band, MundialWave, SectionHeader } from "../components/landing/mundial/LandingChrome";
import WhatsAppTab from "../components/landing/WhatsAppTab";
import { HeroSection, SocialProofBar, TrustStrip } from "../components/landing/mundial/HeroSection";
import { ProfitCalculator } from "../components/landing/mundial/ProfitCalculator";
import { KitHighlight, ProductCarousel } from "../components/landing/mundial/ProductCatalog";
import { MundialMiniReviews, ResellerReviews } from "../components/landing/mundial/ResellerReviews";
import { AboutB2B, HowItWorks, ResellerFaq } from "../components/landing/mundial/InfoSections";
import { StickyBarMundial } from "../components/landing/mundial/StickyBarMundial";
// Último import: la base de la landing (bandas, botones, toast, reveal) va
// después del CSS de CheckoutSheet y del de cada sección.
import "../components/landing/mundial/MundialLanding.css";

/* =========================
   MAIN
========================= */
export default function MundialLanding() {
  const { addItem, items: cartItems, totalPrice: cartTotal } = useCart();

  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  // Contexto del scroll — cambia el mensaje de WhatsApp según la sección visible
  const [waContext, setWaContext] = useState("general");
  // Warning temporal si el usuario intenta comprar por debajo del mínimo
  const [minOrderWarning, setMinOrderWarning] = useState("");

  const calcRef = useRef(null);
  const catalogRef = useRef(null);

  // Mínimo de compra (envío gratis a partir de este monto)
  const MIN_ORDER = Number(MC.minOrder?.amount) || 50000;

  // Title + meta
  useEffect(() => {
    if (MC.pageTitle) document.title = MC.pageTitle;
  }, []);

  // Fetch all products in parallel — fallback al config si la API falla
  useEffect(() => {
    let cancel = false;
    async function fetchAll() {
      const results = await Promise.all(
        MC.products.map(async (cfg) => {
          try {
            const res = await api.get(`/products/slug/${cfg.slug}`);
            if (res.data?.ok && res.data.data) {
              return [cfg.slug, res.data.data];
            }
          } catch { /* best-effort: se ignora */ }
          // Fallback sintético — la página funciona aunque no haya seed
          return [
            cfg.slug,
            {
              _id: cfg.slug,
              name: cfg.name,
              slug: cfg.slug,
              price: cfg.price,
              compareAtPrice: cfg.compareAtPrice,
              imageUrl: cfg.image,
              images: [cfg.image],
              description: cfg.description,
            },
          ];
        })
      );
      if (cancel) return;
      setProducts(Object.fromEntries(results));
      setLoading(false);
    }
    fetchAll();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    trackWithCapi("ViewContent", {
      content_name:     "Mundial Revendedores",
      content_category: "B2B",
      currency:         "ARS",
    });
  }, []);

  // Scroll-reveal animations (mismo patrón que ProductDetail)
  useEffect(() => {
    if (loading) return;
    let io = null;
    const timer = setTimeout(() => {
      const all = Array.from(document.querySelectorAll(".anim-el"));
      if (!all.length) return;
      const vh = window.innerHeight;
      const belowFold = all.filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top > vh + 40;
      });
      belowFold.forEach((el) => el.classList.add("anim-hidden"));
      if (!belowFold.length) return;

      const fallback = setTimeout(() => {
        belowFold.forEach((el) => el.classList.add("in-view"));
      }, 3000);

      if (!("IntersectionObserver" in window)) {
        clearTimeout(fallback);
        belowFold.forEach((el) => el.classList.add("in-view"));
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in-view");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.04, rootMargin: `0px 0px -80px 0px` }
      );
      belowFold.forEach((el) => io.observe(el));
      return () => {
        clearTimeout(fallback);
        io?.disconnect();
      };
    }, 200);
    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [loading]);

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Mensajes de WhatsApp contextuales — cambian según dónde está el scroll
  const WA_MESSAGES = {
    general: "Hola! Quiero info sobre los packs revendedor del mundial Argentina",
    kit:     "Hola! Me interesa el Kit Completo Revendedor — quiero más info",
    calc:    "Hola! Vi la calculadora de ganancia. Quiero armar un pedido",
    catalog: "Hola! Estoy mirando los packs del catálogo, tengo una consulta",
    reviews: "Hola! Vi las reseñas y quiero sumarme como revendedor",
    faq:     "Hola! Tengo una duda sobre los packs del mundial",
    compare: "Hola! Quiero saber más sobre los precios mayoristas",
  };
  const getWaMessage = () => WA_MESSAGES[waContext] || WA_MESSAGES.general;

  const openWhatsapp = () => {
    if (!MC.whatsapp?.number) return;
    window.open(
      `https://wa.me/${MC.whatsapp.number}?text=${encodeURIComponent(getWaMessage())}`,
      "_blank",
      "noopener"
    );
  };

  // IntersectionObserver — detecta qué sección está visible y actualiza waContext
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const nodes = Array.from(document.querySelectorAll("[data-wa-ctx]"));
      if (!nodes.length) return;
      const io = new IntersectionObserver(
        (entries) => {
          // Tomamos la más visible
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) {
            const ctx = visible.target.getAttribute("data-wa-ctx");
            if (ctx) setWaContext(ctx);
          }
        },
        { threshold: [0.25, 0.6] }
      );
      nodes.forEach((n) => io.observe(n));
      return () => io.disconnect();
    }, 400);
    return () => clearTimeout(timer);
  }, [loading]);

  // Helpers para agregar al carrito
  const buildCartProduct = (cfg, productData) => {
    const base = productData || {
      _id: cfg.slug,
      name: cfg.name,
      slug: cfg.slug,
      price: cfg.price,
      imageUrl: cfg.image,
      images: [cfg.image],
    };
    return { ...base, name: cfg.checkoutName || cfg.name };
  };

  const handleAddProduct = (slug, packs, productData, cfg) => {
    const cartProduct = buildCartProduct(cfg, productData);
    const compareAt = Number(productData?.compareAtPrice) || cfg.compareAtPrice || null;
    addItem(cartProduct, packs, compareAt ? { compareAtPrice: compareAt } : undefined);
  };

  // Chequea si un total proyectado llega al mínimo; si no, dispara warning y
  // devuelve false para bloquear el checkout.
  const ensureMinOrder = (projectedTotal) => {
    if (projectedTotal >= MIN_ORDER) return true;
    const missing = MIN_ORDER - projectedTotal;
    setMinOrderWarning(
      `Te faltan ${moneyARS(missing)} para llegar al mínimo de ${moneyARS(MIN_ORDER)}. Sumá más packs y el envío sale gratis.`
    );
    // Auto-clear después de 5s
    setTimeout(() => setMinOrderWarning(""), 5000);
    return false;
  };

  const handleBuyProduct = (slug, packs, productData, cfg) => {
    // handleAddProduct ya dispara AddToCart internamente — no duplicamos acá.
    handleAddProduct(slug, packs, productData, cfg);
    const addedValue = parseFloat((productData?.price ?? cfg.price ?? 0) * packs) || 0;
    const projected = (cartTotal || 0) + addedValue;
    // Si el pedido proyectado no llega al mínimo, bloqueamos checkout y avisamos.
    if (!ensureMinOrder(projected)) return;
    setShowCheckout(true);
  };

  const handleAddKit = (cfg, productData) => {
    handleAddProduct(cfg.slug, 1, productData, cfg);
  };

  const handleBuyKit = (cfg, productData) => {
    const c = cfg || MC.products.find((p) => p.isKit);
    if (!c) return;
    const pd = productData || products[c.slug];
    handleAddProduct(c.slug, 1, pd, c);
    // El kit siempre supera el mínimo, pero dejamos la validación por si cambia
    const kitPrice = Number(pd?.price) || c.price || 0;
    const projected = (cartTotal || 0) + kitPrice;
    if (!ensureMinOrder(projected)) return;
    setShowCheckout(true);
  };

  const handleStickyBuy = () => {
    // Si el carrito ya tiene ítems, abrimos el checkout con lo que el usuario
    // agregó (sin forzar el Kit). Si el carrito está vacío, mantenemos el
    // comportamiento histórico: agregar el Kit Completo y abrir checkout.
    if (cartItems && cartItems.length > 0) {
      if (!ensureMinOrder(cartTotal || 0)) return;
      setShowCheckout(true);
      return;
    }
    const cfg = MC.products.find((p) => p.isKit);
    if (cfg) handleBuyKit(cfg, products[cfg.slug]);
  };

  const cartCount = (cartItems || []).reduce(
    (s, i) => s + (Number(i.quantity) || 0),
    0
  );

  const kitProduct = products[MC.products.find((p) => p.isKit)?.slug];
  const kitPrice = Number(kitProduct?.price) || MC.products.find((p) => p.isKit)?.price || 0;

  const [g1, g2, g3] = MC.productGroups;

  return (
    <main className="section pd-page ml-page">
      {/* 1. HERO blue */}
      <Band variant="blue" waCtx="general">
        <HeroSection onCtaPrimary={scrollToCatalog} onCtaSecondary={openWhatsapp} />
        <SocialProofBar />
        <TrustStrip />
      </Band>

      <MundialWave from="dark" />

      {/* 2. KIT HIGHLIGHT light — subido al principio, con énfasis en regalos */}
      <Band variant="light" innerRef={catalogRef} waCtx="kit">
        <SectionHeader
          kicker="LA OFERTA INSIGNIA"
          title="EL KIT QUE LO TIENE TODO"
          subtitle="7 productos + 20 unidades de regalo. El mejor precio por unidad."
        />
        <KitHighlight
          products={products}
          onBuyKit={handleBuyKit}
          onAddKit={handleAddKit}
        />
        {/* Mini reviews rotativo — prueba social inmediatamente después del kit */}
        <MundialMiniReviews />
      </Band>

      <MundialWave from="light" />

      {/* 3. CALCULADORA blue — ahora debajo del kit */}
      <Band variant="blue" innerRef={calcRef} waCtx="calc">
        <ProfitCalculator
          onBuyNow={(product, packs) =>
            handleBuyProduct(product.slug, packs, products[product.slug], product)
          }
        />
      </Band>

      <MundialWave from="dark" />

      {/* 4. Carousel 1 — Cabeza (light) */}
      <Band variant="light" waCtx="catalog">
        <ProductCarousel
          group={g1}
          products={products}
          onAdd={handleAddProduct}
          onBuy={handleBuyProduct}
          light
        />
      </Band>

      <MundialWave from="light" />

      {/* 5. Carousel 2 — Accesorios (blue) */}
      <Band variant="blue" waCtx="catalog">
        <ProductCarousel
          group={g2}
          products={products}
          onAdd={handleAddProduct}
          onBuy={handleBuyProduct}
        />
      </Band>

      <MundialWave from="dark" />

      {/* 6. Carousel 3 — Ruido (light) */}
      <Band variant="light" waCtx="catalog">
        <ProductCarousel
          group={g3}
          products={products}
          onAdd={handleAddProduct}
          onBuy={handleBuyProduct}
          light
        />
      </Band>

      <MundialWave from="light" />

      {/* 7. HOW IT WORKS blue */}
      <Band variant="blue" waCtx="general">
        <HowItWorks />
      </Band>

      <MundialWave from="dark" />

      {/* 8. REVIEWS carousel grande (light) */}
      <Band variant="light" waCtx="reviews">
        <ResellerReviews />
      </Band>

      <MundialWave from="light" />

      {/* 9. FAQ blue */}
      <Band variant="blue" waCtx="faq">
        <ResellerFaq />
      </Band>

      <MundialWave from="dark" />

      {/* 10. ABOUT final section (light) — cierre limpio y profesional */}
      <Band variant="light" waCtx="general">
        <AboutB2B />
      </Band>

      <StickyBarMundial
        kitPrice={kitPrice}
        onBuy={handleStickyBuy}
        onWhatsapp={openWhatsapp}
        cartCount={cartCount}
        cartTotal={cartTotal || 0}
        minOrder={MIN_ORDER}
        onAddMore={scrollToCatalog}
      />

      {/* Toast flotante: aparece si el usuario intenta comprar por debajo del mínimo */}
      {minOrderWarning && (
        <div className="ml-min-toast" role="alert" aria-live="polite">
          <span className="ml-min-toast-ico" aria-hidden="true">⚠️</span>
          <span className="ml-min-toast-txt">{minOrderWarning}</span>
          <button
            type="button"
            className="ml-min-toast-close"
            onClick={() => setMinOrderWarning("")}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {/* Subido (`raised`) para no quedar debajo de la barra de compra fija. */}
      <WhatsAppTab
        wa={{ ...MC.whatsapp, message: getWaMessage() }}
        raised
        label="¿Dudas? Escribinos"
      />

      {showCheckout && <CheckoutSheet onClose={() => setShowCheckout(false)} />}

    </main>
  );
}
