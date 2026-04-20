// frontend/src/pages/home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { LANDING_CONFIGS } from "../landings/index.js";

/* ── useCountdown — mismo hook que marquee.jsx y ProductDetail.jsx ── */
/* Misma sessionStorage key "pd_countdown" → sincronizado con el marquee */
function useCountdown(storageKey, minutes) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    const target =
      saved && saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;
    sessionStorage.setItem(storageKey, String(target));
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, minutes]);
  const totalSec = Math.floor(left / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const moneyARS = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function discountPct(price, compare) {
  const p = Number(price) || 0;
  const c = Number(compare) || 0;
  return c > p && p > 0 ? Math.round(((c - p) / c) * 100) : 0;
}

const CAT_LABELS = {
  general:    "General",
  gorros:     "Gorros",
  accesorios: "Accesorios",
  inflables:  "Inflables",
  ruido:      "Ruido",
  hogar:      "Hogar",
  kits:       "Kits",
  mundial:    "Mundial",
  otro:       "Otro",
};
const VALID_CATS = new Set(Object.keys(CAT_LABELS));
const catLabel = (k) => CAT_LABELS[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : "General");

/* ── ProductCard ─────────────────────────────────────────────────── */
function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const img  = product.images?.[0] || product.imageUrl || "";
  const pct  = discountPct(product.price, product.compareAtPrice);
  const href = product.slug ? `/lp/${product.slug}` : `/products/${product._id}`;
  // Stagger up to 7 cards, after that no extra delay (below fold anyway)
  const delay = Math.min(index, 7) * 70;

  return (
    <article
      className="hc-card reveal"
      style={{ transitionDelay: `${delay}ms` }}
      onClick={() => navigate(href)}
    >
      <div className="hc-card-img">
        {img
          ? <img src={img} alt={product.name} loading="lazy" decoding="async" />
          : <div className="hc-card-no-img">📦</div>}
        {pct > 0 && <span className="hc-badge-off">-{pct}%</span>}
      </div>
      <div className="hc-card-body">
        <div className="hc-card-name">{product.name}</div>
        <div className="hc-card-prices">
          {product.compareAtPrice > product.price && (
            <span className="hc-price-was">{moneyARS(product.compareAtPrice)}</span>
          )}
          <span className="hc-price-now">{moneyARS(product.price)}</span>
          {pct > 0 && <span className="hc-price-pct">-{pct}%</span>}
        </div>
        <Link
          className="btn btn-primary hc-card-cta"
          to={href}
          onClick={(e) => e.stopPropagation()}
        >
          Ver oferta →
        </Link>
      </div>
    </article>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="hc-card hc-card-skeleton">
      <div className="hc-card-img hc-skel" />
      <div className="hc-card-body" style={{ gap: 10 }}>
        <div className="hc-skel" style={{ height: 16, borderRadius: 8, width: "75%" }} />
        <div className="hc-skel" style={{ height: 28, borderRadius: 8, width: "55%" }} />
        <div className="hc-skel" style={{ height: 40, borderRadius: 12 }} />
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function Home() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeCat, setActiveCat] = useState("todos");
  const catalogRef = useRef(null);

  const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";
  const whatsapp  = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const waLink    = whatsapp
    ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Hola! 👋 Quiero consultar sobre los productos de ${storeName}.`
      )}`
    : null;

  /* Productos virtuales desde configs de landing (aparecen aunque no estén en DB) */
  const landingVirtualProducts = useMemo(() => {
    return Object.entries(LANDING_CONFIGS).map(([slug, cfg]) => {
      const v0 = cfg.variants?.[0];
      const img = v0?.thumbImg || v0?.images?.[0] || "";
      const price = v0?.bundles?.[0]?.price || 0;
      const compareAt = v0?.bundles?.[0]?.compareAt || 0;
      return {
        _id: `lp-${slug}`,
        name: cfg.checkoutName || slug,
        slug,
        images: img ? [img] : [],
        price,
        compareAtPrice: compareAt,
        isActive: true,
      };
    });
  }, []);

  /* Fetch */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/products");
        const raw = res.data?.data ?? res.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        const apiProducts = arr.filter((p) => p.isActive !== false);
        // Slugs ya presentes en la DB — no duplicar
        const apiSlugs = new Set(apiProducts.map((p) => p.slug).filter(Boolean));
        const extras = landingVirtualProducts.filter((p) => !apiSlugs.has(p.slug));
        setProducts([...extras, ...apiProducts]);
      } catch (e) {
        console.error("Home catalog error:", e);
        // Si la API falla igual mostramos las landings
        setProducts(landingVirtualProducts);
      } finally {
        setLoading(false);
      }
    })();
  }, [landingVirtualProducts]);

  /* Scroll-reveal — mismo patrón que MundialLanding:
     elementos en viewport → is-visible inmediato (con stagger via transitionDelay)
     elementos bajo el fold → IO los revela al scrollear */
  useEffect(() => {
    if (loading) return;
    let io = null;
    const timer = setTimeout(() => {
      const vh = window.innerHeight;

      // ── Cards ──────────────────────────────────────────────────
      const cards = Array.from(document.querySelectorAll(".hc-card.reveal:not(.is-visible)"));
      const belowFoldCards = [];
      cards.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < vh + 60) {
          // Ya en viewport o muy cerca → visibilizar de inmediato
          // El transitionDelay inline maneja el stagger de la animación
          el.classList.add("is-visible");
        } else {
          belowFoldCards.push(el);
        }
      });

      // ── Trust items ────────────────────────────────────────────
      document.querySelectorAll(".hc-trust-item.reveal:not(.is-visible)")
        .forEach((el) => el.classList.add("is-visible"));

      // ── Section headers (hc-anim) ──────────────────────────────
      document.querySelectorAll(".hc-anim:not(.in-view)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("in-view");
        } else {
          el.classList.add("hc-hidden");
          belowFoldCards.push(el); // observar junto con las cards
        }
      });

      // ── IO solo para los elementos bajo el fold ────────────────
      if (belowFoldCards.length) {
        io = new IntersectionObserver(
          (entries) => entries.forEach((e) => {
            if (!e.isIntersecting) return;
            if (e.target.classList.contains("hc-card")) {
              e.target.classList.add("is-visible");
            } else {
              e.target.classList.remove("hc-hidden");
              e.target.classList.add("in-view");
            }
            io.unobserve(e.target);
          }),
          { threshold: 0.05 }
        );
        belowFoldCards.forEach((el) => io.observe(el));
      }
    }, 60);

    return () => {
      clearTimeout(timer);
      if (io) io.disconnect();
    };
  }, [loading, activeCat]);

  /* Categories — only known valid keys */
  const categories = useMemo(() => {
    const seen = new Set();
    products.forEach((p) => {
      const c = (p.category || "general").trim();
      if (VALID_CATS.has(c) && c !== "general") seen.add(c);
    });
    return Array.from(seen).sort();
  }, [products]);

  const showCategoryTabs = categories.length > 0;

  /* Featured: prioritize discounted products; fallback to first products */
  const featured = useMemo(() => {
    const discounted = products
      .filter((p) => discountPct(p.price, p.compareAtPrice) >= 5)
      .sort((a, b) => discountPct(b.price, b.compareAtPrice) - discountPct(a.price, a.compareAtPrice));
    // Use discounted if enough, otherwise show all products
    return (discounted.length >= 3 ? discounted : products).slice(0, 8);
  }, [products]);

  /* Filtered list */
  const filtered = useMemo(() => (
    activeCat === "todos"
      ? products
      : products.filter((p) => (p.category || "general") === activeCat)
  ), [products, activeCat]);

  const maxDiscount = products.reduce((best, p) => {
    const pct = discountPct(p.price, p.compareAtPrice);
    return pct > best ? pct : best;
  }, 0);

  /* Countdown — misma key que marquee.jsx → sincronizan */
  const countdownTime = useCountdown("pd_countdown", 18);

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const TRUST_ITEMS = [
    { ico: "🚚", lbl: "Envío",    val: "Gratis a todo el país" },
    { ico: "💳", lbl: "Pagás con", val: "Mercado Pago" },
    { ico: "🔒", lbl: "Compra",   val: "100% segura" },
    { ico: "📦", lbl: "Stock",    val: "Real · sale hoy" },
  ];

  return (
    <main className="section">
      {/* ────────────────────────────── CSS */}
      <style>{`
        /* =====================================================
           HOME CATALOG — hc- prefix
        ===================================================== */

        /* === HERO — full bleed, sin bordes ni márgenes === */
        .hc-hero {
          width: 100%;
          padding: 72px 24px 64px;
          background: linear-gradient(140deg, #091A14 0%, #1B4D3E 42%, #143D30 72%, #091A14 100%);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        /* Dot grid */
        .hc-hero::before {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(94,234,212,.13) 1px, transparent 1px);
          background-size: 26px 26px;
          pointer-events: none;
        }
        /* Top ambient glow */
        .hc-hero::after {
          content: "";
          position: absolute;
          top: -120px; left: 50%;
          transform: translateX(-50%);
          width: min(900px, 100vw);
          height: 380px;
          background: radial-gradient(ellipse at center, rgba(94,234,212,.22) 0%, transparent 65%);
          pointer-events: none;
        }
        .hc-hero-inner {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center;
        }
        .hc-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: .70rem; font-weight: 1000;
          letter-spacing: .14em; text-transform: uppercase;
          color: #5EEAD4; margin-bottom: 18px;
        }
        .hc-hero-eyebrow-dot {
          width: 7px; height: 7px; border-radius: 999px;
          background: #5EEAD4;
          box-shadow: 0 0 0 0 rgba(94,234,212,.6);
          animation: hcDotPulse 2.2s ease-out infinite;
        }
        @keyframes hcDotPulse {
          0%  { box-shadow: 0 0 0 0 rgba(94,234,212,.65); }
          70% { box-shadow: 0 0 0 9px rgba(94,234,212,0); }
          100%{ box-shadow: 0 0 0 0 rgba(94,234,212,0); }
        }
        .hc-hero-title {
          margin: 0 0 18px;
          font-size: clamp(2.4rem, 6vw, 4rem);
          font-weight: 1100;
          color: #fff;
          letter-spacing: -0.05em;
          line-height: 1.03;
        }
        .hc-hero-title span {
          background: linear-gradient(130deg, #5EEAD4 0%, #A5F3E3 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hc-hero-sub {
          font-size: 1.05rem; font-weight: 700;
          color: rgba(255,255,255,.55);
          margin: 0 0 30px; line-height: 1.55;
          max-width: 480px;
        }
        .hc-hero-actions {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; flex-wrap: wrap;
        }
        .hc-hero-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 30px; border-radius: 999px;
          background: linear-gradient(135deg, #5EEAD4, #2DD4BF);
          color: #0A1F19; font-weight: 1100; font-size: .97rem;
          letter-spacing: .01em; border: none; cursor: pointer;
          font-family: inherit;
          box-shadow: 0 10px 32px rgba(94,234,212,.32);
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .hc-hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(94,234,212,.48);
        }
        .hc-hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 20px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          color: rgba(255,255,255,.80); font-weight: 900; font-size: .88rem;
          background: rgba(255,255,255,.06); backdrop-filter: blur(6px);
        }
        @media (max-width: 600px) {
          .hc-hero { padding: 52px 20px 46px; }
          .hc-hero-title { font-size: clamp(2rem, 8vw, 2.6rem); }
          .hc-hero-sub { font-size: .92rem; margin-bottom: 24px; }
        }

        /* === COUNTDOWN BANNER (mismo estilo que .marquee) === */
        .hc-cd-bar {
          width: 100%;
          background: #0F2D24;
          border-bottom: 1px solid rgba(94,234,212,.14);
          padding: 11px 16px;
          display: flex; align-items: center; justify-content: center;
          gap: 14px; flex-wrap: wrap;
        }
        .hc-cd-text {
          font-size: .80rem; font-weight: 900;
          color: rgba(255,255,255,.80);
          letter-spacing: .03em; white-space: nowrap;
        }
        .hc-cd-sep {
          width: 1px; height: 14px;
          background: rgba(255,255,255,.18); flex-shrink: 0;
        }
        .hc-cd-time {
          font-variant-numeric: tabular-nums;
          font-weight: 900; font-size: 1.05rem;
          color: #5EEAD4; letter-spacing: 2px;
          white-space: nowrap;
        }
        .hc-cd-cta {
          font-size: .75rem; font-weight: 1000;
          color: rgba(255,255,255,.55);
          letter-spacing: .04em; text-transform: uppercase;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .hc-cd-bar { gap: 10px; padding: 9px 14px; }
          .hc-cd-text { font-size: .74rem; }
          .hc-cd-time { font-size: .95rem; }
          .hc-cd-cta { display: none; }
        }

        /* === TRUST STRIP — tarjetas con icono grande === */
        .hc-trust {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin: 14px auto 0;
          width: min(var(--container), calc(100% - 2rem));
        }
        .hc-trust-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 5px;
          text-align: center;
          padding: 18px 10px 16px;
          border-radius: var(--r);
          border: 1px solid var(--border);
          background: rgba(255,255,255,.94);
          box-shadow: var(--shadow-sm);
          transition: transform .2s var(--ease), box-shadow .2s var(--ease), border-color .2s var(--ease);
        }
        .hc-trust-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 34px rgba(20,40,34,.10);
          border-color: rgba(27,77,62,.22);
        }
        /* scroll-reveal para trust items */
        .hc-trust-item.reveal:not(.is-visible) {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .hc-trust-item.reveal.is-visible {
          opacity: 1; transform: translateY(0);
        }
        .hc-trust-item.reveal.is-visible:hover { transform: translateY(-3px); }
        .hc-trust-ico { font-size: 1.65rem; line-height: 1; }
        .hc-trust-lbl {
          font-size: .60rem; font-weight: 900;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--muted); margin-top: 1px;
        }
        .hc-trust-val {
          font-size: .80rem; font-weight: 1000;
          color: var(--text); line-height: 1.2;
        }
        @media (max-width: 720px) {
          .hc-trust { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 420px) {
          .hc-trust { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .hc-trust-item { padding: 14px 8px 12px; }
          .hc-trust-ico { font-size: 1.4rem; }
          .hc-trust-val { font-size: .75rem; }
        }

        /* === CONTAINER WRAPPER === */
        .hc-wrap {
          width: min(var(--container), calc(100% - 2rem));
          margin: 0 auto;
        }

        /* === SECTION HEADERS === */
        .hc-sec-head {
          display: flex; align-items: baseline;
          justify-content: space-between;
          gap: 10px; flex-wrap: wrap;
          margin-top: 34px;
        }
        .hc-sec-title {
          margin: 0;
          font-size: clamp(1.2rem, 2.4vw, 1.55rem);
          font-weight: 1100; letter-spacing: -0.03em; color: var(--text);
        }
        .hc-sec-pill {
          font-size: .72rem; font-weight: 1000;
          color: var(--primary);
          background: rgba(27,77,62,.07);
          border: 1px solid rgba(27,77,62,.16);
          padding: 4px 11px; border-radius: 999px;
          letter-spacing: .04em; text-transform: uppercase;
        }
        .hc-sec-count {
          font-size: .82rem; font-weight: 800; color: var(--muted);
        }

        /* Section headers — slide-in animation */
        .hc-anim {
          opacity: 1; transform: none;
        }
        .hc-hidden {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .hc-hidden.in-view {
          opacity: 1; transform: translateY(0);
        }

        /* === FEATURED CAROUSEL === */
        .hc-carousel-wrap { position: relative; margin-top: 14px; }
        .hc-carousel {
          display: flex; gap: 14px;
          overflow-x: auto; scroll-snap-type: x mandatory;
          scroll-behavior: smooth; -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .hc-carousel::-webkit-scrollbar { display: none; }
        .hc-carousel .hc-card {
          flex: 0 0 200px; width: 200px;
          scroll-snap-align: start;
          /* No stagger in carousel */
          transition-delay: 0ms !important;
        }
        .hc-carousel-wrap::after {
          content: ""; position: absolute;
          top: 0; right: 0; bottom: 4px; width: 52px;
          background: linear-gradient(to left, var(--bg), transparent);
          pointer-events: none;
        }
        @media (max-width: 480px) {
          .hc-carousel .hc-card { flex: 0 0 172px; width: 172px; }
        }

        /* === CATEGORY TABS === */
        .hc-tabs {
          display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap;
        }
        .hc-tab {
          padding: 7px 16px; border-radius: 999px;
          border: 1.5px solid rgba(27,77,62,.18);
          background: transparent; color: var(--muted);
          font-size: .79rem; font-weight: 900; cursor: pointer;
          transition: all .14s ease; font-family: inherit;
          letter-spacing: .02em;
        }
        .hc-tab:hover { border-color: var(--primary); color: var(--primary); }
        .hc-tab.is-on {
          background: var(--primary); border-color: var(--primary);
          color: #fff; box-shadow: 0 8px 20px rgba(27,77,62,.22);
        }

        /* === PRODUCT GRID === */
        .hc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px; margin-top: 18px;
        }
        @media (max-width: 500px) {
          .hc-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }

        /* === PRODUCT CARD === */
        .hc-card {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: var(--r);
          box-shadow: var(--shadow-sm);
          overflow: hidden; cursor: pointer;
          display: flex; flex-direction: column;
          transition:
            transform .22s var(--ease),
            box-shadow .22s var(--ease),
            border-color .22s var(--ease),
            opacity .55s ease;
        }
        .hc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 64px rgba(20,40,34,.15);
          border-color: rgba(27,77,62,.26);
        }
        .hc-card:hover .hc-card-img img { transform: scale(1.07); }

        /* scroll-reveal */
        .hc-card.reveal:not(.is-visible) {
          opacity: 0;
          transform: translateY(20px);
        }
        .hc-card.reveal.is-visible {
          opacity: 1; transform: translateY(0);
        }
        .hc-card.reveal.is-visible:hover { transform: translateY(-6px); }

        /* Image — 4:5 portrait */
        .hc-card-img {
          position: relative;
          aspect-ratio: 4 / 5;
          background: linear-gradient(180deg, #FDFFFE 0%, #EEF5F1 100%);
          overflow: hidden;
        }
        .hc-card-img img {
          width: 100%; height: 100%;
          object-fit: contain; display: block;
          padding: 10px;
          transition: transform .4s var(--ease);
        }
        .hc-card-no-img {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          font-size: 2.5rem; color: var(--muted); opacity: .4;
        }

        /* Discount badge — más llamativo */
        .hc-badge-off {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          padding: 6px 11px; border-radius: 8px;
          background: linear-gradient(135deg, #10B981 0%, #047857 100%);
          color: #fff; font-size: .72rem; font-weight: 1100;
          letter-spacing: .07em; text-transform: uppercase;
          box-shadow: 0 4px 14px rgba(4,120,87,.40);
        }

        /* Card body */
        .hc-card-body {
          padding: 14px 14px 16px;
          display: flex; flex-direction: column;
          gap: 8px; flex: 1;
        }
        .hc-card-name {
          font-size: .93rem; font-weight: 1000;
          color: var(--text); line-height: 1.28;
          display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .hc-card-prices {
          display: flex; align-items: baseline;
          gap: 7px; flex-wrap: wrap; margin-top: auto;
        }
        .hc-price-was {
          font-size: .80rem; font-weight: 700;
          color: var(--muted); text-decoration: line-through; opacity: .65;
        }
        .hc-price-now {
          font-size: 1.45rem; font-weight: 1100;
          color: var(--text); letter-spacing: -0.03em; line-height: 1;
        }
        .hc-price-pct {
          font-size: .70rem; font-weight: 1000; color: #047857;
          background: rgba(16,185,129,.09);
          border: 1px solid rgba(16,185,129,.20);
          padding: 3px 7px; border-radius: 999px;
        }
        .hc-card-cta {
          width: 100%; justify-content: center;
          font-size: .84rem; padding: 11px 14px; margin-top: 6px;
          letter-spacing: .01em;
          transition:
            transform var(--t) var(--ease),
            box-shadow var(--t) var(--ease),
            letter-spacing var(--t) var(--ease);
        }
        .hc-card-cta:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 30px rgba(27,77,62,.28) !important;
          letter-spacing: .04em;
        }

        /* === SKELETON === */
        .hc-card-skeleton { pointer-events: none; }
        .hc-skel {
          background: linear-gradient(90deg,
            rgba(27,77,62,.06) 25%, rgba(27,77,62,.11) 50%, rgba(27,77,62,.06) 75%);
          background-size: 200% 100%;
          animation: hcSkel 1.4s ease-in-out infinite;
        }
        .hc-card-skeleton .hc-card-img { aspect-ratio: 4/5; }
        @keyframes hcSkel {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* === EMPTY STATE === */
        .hc-empty {
          grid-column: 1 / -1; padding: 44px 20px;
          text-align: center; color: var(--muted);
        }
        .hc-empty-ico { font-size: 2.8rem; margin-bottom: 12px; }
        .hc-empty-title { font-size: 1.1rem; font-weight: 900; color: var(--text); margin: 0 0 6px; }
        .hc-empty-sub { font-size: .9rem; font-weight: 700; }

        /* === FLOATING WA BUTTON === */
        .hc-wa-fab {
          position: fixed; bottom: 24px; right: 20px; z-index: 9000;
          display: flex; align-items: center; gap: 8px;
          padding: 13px 20px; border-radius: 999px;
          background: #25D366; color: #fff;
          font-weight: 1000; font-size: .87rem;
          text-decoration: none; letter-spacing: .01em;
          box-shadow: 0 8px 26px rgba(37,211,102,.38);
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .hc-wa-fab:hover {
          color: #fff; transform: translateY(-3px);
          box-shadow: 0 14px 38px rgba(37,211,102,.52);
        }
        .hc-wa-fab-ico { font-size: 1.15rem; line-height: 1; }
        .hc-wa-fab-ring {
          position: absolute; inset: 0; border-radius: 999px;
          border: 2px solid rgba(37,211,102,.55);
          animation: hcWaRing 2.6s ease-out infinite;
        }
        @keyframes hcWaRing {
          0%   { transform: scale(1); opacity: .9; }
          75%  { transform: scale(1.38); opacity: 0; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        @media (max-width: 480px) {
          .hc-wa-fab { padding: 13px 15px; }
          .hc-wa-fab-lbl { display: none; }
        }

        /* === BOTTOM NAV === */
        .hc-bottom-nav {
          display: flex; gap: 10px; flex-wrap: wrap;
          justify-content: center;
          margin-top: 28px; padding-bottom: 14px;
        }

        @media (max-width: 480px) {
          .hc-card-body { padding: 10px 11px 13px; }
          .hc-card-name { font-size: .84rem; }
          .hc-price-now { font-size: 1.2rem; }
          .hc-card-cta { font-size: .78rem; padding: 10px 10px; }
        }
      `}</style>

      {/* ─── HERO — full bleed ──────────────────────────────────────── */}
      <section className="hc-hero">
        <div className="hc-hero-inner">
          <div className="hc-hero-eyebrow">
            <span className="hc-hero-eyebrow-dot" />
            {storeName}
          </div>
          <h1 className="hc-hero-title">
            Todo lo que buscás,<br />
            <span>al mejor precio</span>
          </h1>
          <p className="hc-hero-sub">
            Productos seleccionados · Stock real · Envío a todo el país
          </p>
          <div className="hc-hero-actions">
            <button className="hc-hero-cta" onClick={scrollToCatalog}>
              Explorar catálogo <span style={{ fontSize: "1.1em" }}>↓</span>
            </button>
            {maxDiscount > 0 && (
              <span className="hc-hero-badge">
                🔖 Hasta -{maxDiscount}% OFF
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── COUNTDOWN BANNER — mismo hook y key que marquee.jsx ────── */}
      <div className="hc-cd-bar">
        <span className="hc-cd-text">⚡ Oferta relámpago termina en</span>
        <span className="hc-cd-sep" />
        <span className="hc-cd-time">{countdownTime}</span>
        <span className="hc-cd-sep" />
        <span className="hc-cd-cta">Aprovechá ahora</span>
      </div>

      {/* ─── TRUST STRIP — tarjetas visuales ────────────────────────── */}
      <div className="hc-trust">
        {TRUST_ITEMS.map((t, i) => (
          <div
            key={i}
            className="hc-trust-item reveal"
            style={{ transitionDelay: `${i * 55}ms` }}
          >
            <span className="hc-trust-ico">{t.ico}</span>
            <span className="hc-trust-lbl">{t.lbl}</span>
            <span className="hc-trust-val">{t.val}</span>
          </div>
        ))}
      </div>

      <div className="hc-wrap">
        {/* ─── FEATURED CAROUSEL ──────────────────────────────────── */}
        {!loading && featured.length >= 2 && (
          <>
            <div className="hc-sec-head hc-anim">
              <h2 className="hc-sec-title">Ofertas destacadas</h2>
              <span className="hc-sec-pill">🔥 Mayor descuento</span>
            </div>
            <div className="hc-carousel-wrap">
              <div className="hc-carousel">
                {featured.map((p, i) => (
                  <ProductCard key={p._id} product={p} index={i} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── CATALOG HEADER + TABS ──────────────────────────────── */}
        <div className="hc-sec-head hc-anim" ref={catalogRef}>
          <h2 className="hc-sec-title">Catálogo</h2>
          {!loading && (
            <span className="hc-sec-count">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
              {activeCat !== "todos" ? ` en "${catLabel(activeCat)}"` : ""}
            </span>
          )}
        </div>

        {showCategoryTabs && (
          <div className="hc-tabs" role="tablist">
            <button
              type="button" role="tab" aria-selected={activeCat === "todos"}
              className={`hc-tab ${activeCat === "todos" ? "is-on" : ""}`}
              onClick={() => setActiveCat("todos")}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c} type="button" role="tab" aria-selected={activeCat === c}
                className={`hc-tab ${activeCat === c ? "is-on" : ""}`}
                onClick={() => setActiveCat(c)}
              >
                {catLabel(c)}
              </button>
            ))}
          </div>
        )}

        {/* ─── PRODUCT GRID ────────────────────────────────────────── */}
        <div className="hc-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="hc-empty">
                <div className="hc-empty-ico">🛍️</div>
                <h3 className="hc-empty-title">
                  {activeCat !== "todos"
                    ? "No hay productos en esta categoría"
                    : "Sin productos disponibles"}
                </h3>
                <p className="hc-empty-sub">
                  {activeCat !== "todos"
                    ? (
                      <button
                        className="btn btn-ghost"
                        style={{ display: "inline", padding: "4px 12px", fontSize: ".82rem" }}
                        onClick={() => setActiveCat("todos")}
                      >
                        Ver todos
                      </button>
                    )
                    : "Volvé pronto — estamos cargando novedades."}
                </p>
              </div>
            )
            : filtered.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
          }
        </div>

        {/* ─── BOTTOM NAV ──────────────────────────────────────────── */}
        {!loading && (
          <div className="hc-bottom-nav">
            <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
            <Link className="btn btn-ghost" to="/cart">Ver carrito</Link>
          </div>
        )}
      </div>

      {/* ─── FLOATING WA (fixed) ─────────────────────────────────────── */}
      {waLink && (
        <a
          className="hc-wa-fab"
          href={waLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Contactar por WhatsApp"
        >
          <span className="hc-wa-fab-ring" />
          <span className="hc-wa-fab-ico">💬</span>
          <span className="hc-wa-fab-lbl">WhatsApp</span>
        </a>
      )}
    </main>
  );
}
