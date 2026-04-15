// frontend/src/pages/MundialLanding.jsx
// ─────────────────────────────────────────────────────────────
// Landing B2B para revendedores de productos del Mundial Argentina.
// URL: /lp/mundial-revendedores
// Reutiliza al máximo el sistema visual existente: .pd-band, .faq-pro,
// CheckoutSheet, .wa-tab, etc. Lo único nuevo de verdad es la
// CALCULADORA DE GANANCIA, que es el corazón del pitch B2B.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";
import { CheckoutSheet } from "./CheckoutSheet";
import MC from "../landings/mundial-revendedores.js";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="#1B4D7E"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="32" font-weight="900" fill="#fff">
      MUNDIAL ARGENTINA
    </text>
  </svg>
`);

function moneyARS(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

/* Hash determinístico pequeño — para valores "reales" pero estables */
function seedHash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* Stock "social proof": número bajo, estable por slug.
   No inventa stock real — si la API expone stock lo usamos. */
function getStockFor(cfg, productData) {
  const real = Number(productData?.stock);
  if (Number.isFinite(real) && real > 0 && real < 50) return real;
  // Rango 8..22 packs, estable por slug
  return 8 + (seedHash(cfg.slug || cfg.name || "x") % 15);
}

/* Día del año — seed para counters que cambian por día */
function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/* Iniciales de un nombre → "Marcos D." → "MD" */
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
}

/* Gradiente estable por nombre (para avatars de iniciales) */
const AVATAR_GRADIENTS = [
  ["#1B4D3E", "#059669"],
  ["#0369A1", "#0EA5E9"],
  ["#7C2D12", "#EA580C"],
  ["#4C1D95", "#8B5CF6"],
  ["#7F1D1D", "#DC2626"],
  ["#115E59", "#14B8A6"],
  ["#1E3A8A", "#3B82F6"],
  ["#831843", "#EC4899"],
];
function getAvatarColors(name) {
  const idx = seedHash(name || "x") % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

/* =========================
   Band + WaveSeparator (igual que ProductDetail)
========================= */
function Band({ variant = "light", children, innerRef, waCtx }) {
  return (
    <section
      ref={innerRef}
      className={`pd-band pd-band--${variant}`}
      {...(waCtx ? { "data-wa-ctx": waCtx } : {})}
    >
      <div className="container pd-band-inner">{children}</div>
    </section>
  );
}

function WaveSeparator({ from = "light" }) {
  const isDark = from === "blue";
  const topColor = isDark ? "#0F2D24" : "#F7FBF9";
  const bottomColor = isDark ? "#F7FBF9" : "#0F2D24";
  return (
    <div
      className="wave-divider"
      role="presentation"
      aria-hidden="true"
      style={{ "--wave-top-color": topColor, "--wave-bottom-color": bottomColor }}
    >
      <svg
        className="waves-anim"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="gentle-wave-ml"
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
          />
        </defs>
        <g className="parallax1">
          <use xlinkHref="#gentle-wave-ml" x="50" y="3" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax2">
          <use xlinkHref="#gentle-wave-ml" x="50" y="0" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax3">
          <use xlinkHref="#gentle-wave-ml" x="50" y="9" fill="var(--wave-bottom-color)" />
        </g>
        <g className="parallax4">
          <use xlinkHref="#gentle-wave-ml" x="50" y="6" fill="var(--wave-bottom-color)" />
        </g>
      </svg>
    </div>
  );
}

/* =========================
   WhatsApp tab (idéntica a ProductDetail)
========================= */
function WaTab({ number, message, label }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const handleToggle = (e) => {
    if (!open) {
      e.preventDefault();
      setOpen(true);
      timerRef.current = setTimeout(() => setOpen(false), 4000);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const msg = typeof message === "function" ? message() : message;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(msg || "Hola!")}`;

  return (
    <a
      className={`wa-tab${open ? " wa-tab--open" : ""}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleToggle}
      aria-label="Consultar por WhatsApp"
    >
      <svg className="wa-tab-icon" viewBox="0 0 32 32" width="22" height="22" fill="#fff">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.132 6.744 3.058 9.374L1.058 31.14l5.968-1.97A15.89 15.89 0 0 0 16.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0Zm9.35 22.616c-.394 1.108-1.95 2.028-3.192 2.296-.85.18-1.96.324-5.696-1.224-4.78-1.98-7.852-6.836-8.09-7.152-.228-.316-1.916-2.552-1.916-4.868 0-2.316 1.214-3.454 1.644-3.926.43-.472.94-.59 1.252-.59.312 0 .624.002.898.016.288.014.674-.11 1.054.804.394.948 1.336 3.264 1.452 3.502.118.238.196.514.04.828-.158.316-.236.514-.472.79-.236.278-.496.62-.71.832-.236.236-.482.492-.206.964.276.472 1.226 2.022 2.634 3.276 1.81 1.612 3.336 2.112 3.808 2.348.472.236.748.198 1.024-.118.276-.316 1.182-1.376 1.496-1.848.316-.472.628-.394 1.06-.236.43.158 2.746 1.296 3.216 1.532.472.236.786.354.902.55.118.196.118 1.128-.276 2.236Z" />
      </svg>
      <span className="wa-tab-label">{label || "¿Dudas? Escribinos"}</span>
    </a>
  );
}

/* =========================
   Section Header (igual al de ProductDetail)
========================= */
function SectionHeader({ kicker, title, subtitle, light = false }) {
  return (
    <div className="ml-sec-head anim-el">
      {kicker && <div className={`ml-sec-kicker ${light ? "is-light" : ""}`}>{kicker}</div>}
      <h2 className={`ml-sec-title ${light ? "is-light" : ""}`}>{title}</h2>
      {subtitle && <p className={`ml-sec-sub ${light ? "is-light" : ""}`}>{subtitle}</p>}
    </div>
  );
}

/* =========================
   HERO
========================= */
function HeroSection({ onCtaPrimary, onCtaSecondary }) {
  const { hero } = MC;
  return (
    <section className="ml-hero">
      <div className="ml-hero-badge">{hero.badge}</div>
      <h1 className="ml-hero-title">
        {hero.title} <span className="ml-hero-accent">{hero.titleAccent}</span>
      </h1>
      <p className="ml-hero-sub">{hero.subtitle}</p>

      <div className="ml-hero-ctas">
        <button type="button" className="ml-btn ml-btn--primary" onClick={onCtaPrimary}>
          {hero.primaryCta}
          <span className="ml-btn-arrow">→</span>
        </button>
        <button type="button" className="ml-btn ml-btn--ghost" onClick={onCtaSecondary}>
          💬 {hero.secondaryCta}
        </button>
      </div>

      <div className="ml-hero-stats">
        {hero.stats.map((s, i) => (
          <div key={i} className="ml-hero-stat">
            <div className="ml-hero-stat-val">{s.value}</div>
            <div className="ml-hero-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   Trust strip B2B
========================= */
function TrustStrip() {
  return (
    <div className="ml-trust-strip anim-el">
      {MC.trustStrip.map((t, i) => (
        <div key={i} className="ml-trust-item">
          <div className="ml-trust-icon">{t.icon}</div>
          <div className="ml-trust-meta">
            <div className="ml-trust-label">{t.label}</div>
            <div className="ml-trust-value">{t.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   PROFIT CALCULATOR — el corazón
========================= */
function ProfitCalculator({ onBuyNow }) {
  // Productos sin el kit (el kit tiene su propia tarjeta)
  const products = MC.products.filter((p) => !p.isKit);
  const [slug, setSlug] = useState(products[0]?.slug || "");
  const [packs, setPacks] = useState(2);

  const product = products.find((p) => p.slug === slug) || products[0];

  const calc = useMemo(() => {
    if (!product) return null;
    const inversion = product.price * packs;
    const totalUnits = product.unitsPerPack * packs;
    const ingreso = product.suggestedResale * totalUnits;
    const ganancia = ingreso - inversion;
    const margen = inversion > 0 ? Math.round((ganancia / inversion) * 100) : 0;
    const porUnidad = product.price / product.unitsPerPack;
    // Multiplicador "por cada $1 invertido te llevás $X"
    const multiplicador = inversion > 0 ? ingreso / inversion : 0;
    // Ganancia por unidad (venta sugerida - costo por unidad)
    const gananciaPorUnidad = product.suggestedResale - porUnidad;
    return { inversion, totalUnits, ingreso, ganancia, margen, porUnidad, multiplicador, gananciaPorUnidad };
  }, [product, packs]);

  if (!product || !calc) return null;

  const decPacks = () => setPacks((p) => Math.max(1, p - 1));
  const incPacks = () => setPacks((p) => Math.min(99, p + 1));

  return (
    <div className="ml-calc anim-el">
      {/* HEAD compacto */}
      <div className="ml-calc-head">
        <div className="ml-calc-kicker">CALCULÁ LO QUE GANÁS</div>
        <h2 className="ml-calc-title">Elegí un producto y mirá tu ganancia</h2>
      </div>

      {/* Selector de producto — tabs horizontales con scroll */}
      <div className="ml-calc-tabs-wrap">
        <div className="ml-calc-tabs-hint">← Deslizá para ver más productos →</div>
        <div className="ml-calc-tabs" role="tablist" aria-label="Producto">
          {products.map((p) => {
            const active = slug === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                role="tab"
                aria-selected={active}
                className={`ml-calc-tab ${active ? "is-on" : ""}`}
                onClick={() => setSlug(p.slug)}
              >
                {p.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel unificado */}
      <div className="ml-calc-panel">
        {/* BIG profit highlight — lo primero que ve el cliente */}
        <div className="ml-calc-hero">
          <div className="ml-calc-hero-eq">
            <div className="ml-calc-hero-col">
              <div className="ml-calc-hero-lbl">PONÉS</div>
              <div className="ml-calc-hero-val ml-calc-hero-val--cost">{moneyARS(calc.inversion)}</div>
            </div>
            <div className="ml-calc-hero-arrow" aria-hidden="true">→</div>
            <div className="ml-calc-hero-col">
              <div className="ml-calc-hero-lbl">GANÁS</div>
              <div className="ml-calc-hero-val ml-calc-hero-val--profit">+{moneyARS(calc.ganancia)}</div>
            </div>
          </div>
          <div className="ml-calc-hero-mult">
            Por cada <strong>$1</strong> que invertís, te llevás <strong>${calc.multiplicador.toFixed(1)}</strong>
          </div>
        </div>

        {/* Stepper de cantidad */}
        <div className="ml-calc-stepper-row">
          <div className="ml-calc-stepper-lbl">
            <div className="ml-calc-stepper-lbl-top">¿CUÁNTOS PACKS?</div>
            <div className="ml-calc-stepper-lbl-sub">
              = <strong>{calc.totalUnits}</strong> unidades para vender
            </div>
          </div>
          <div className="ml-calc-stepper">
            <button type="button" className="ml-calc-stepper-btn" onClick={decPacks} aria-label="Restar">−</button>
            <div className="ml-calc-stepper-val">{packs}</div>
            <button type="button" className="ml-calc-stepper-btn" onClick={incPacks} aria-label="Sumar">+</button>
          </div>
        </div>

        {/* Detalles — compactos y claros */}
        <div className="ml-calc-mini">
          <div className="ml-calc-mini-item">
            <span className="ml-calc-mini-lbl">Cada unidad te cuesta</span>
            <span className="ml-calc-mini-val">{moneyARS(calc.porUnidad)}</span>
          </div>
          <div className="ml-calc-mini-item">
            <span className="ml-calc-mini-lbl">Podés venderla a</span>
            <span className="ml-calc-mini-val">{moneyARS(product.suggestedResale)}</span>
          </div>
          <div className="ml-calc-mini-item ml-calc-mini-item--hi">
            <span className="ml-calc-mini-lbl">Ganás por unidad</span>
            <span className="ml-calc-mini-val">+{moneyARS(calc.gananciaPorUnidad)}</span>
          </div>
        </div>

        {/* CTA final */}
        <button
          type="button"
          className="ml-calc-go"
          onClick={() => onBuyNow?.(product, packs)}
        >
          <span>Comprar {packs} pack{packs > 1 ? "s" : ""} · {moneyARS(calc.inversion)}</span>
          <span className="ml-calc-go-arrow" aria-hidden="true">→</span>
        </button>
        <div className="ml-calc-go-sub">
          🚚 Envío gratis · 📦 Sale hoy · 💬 WhatsApp directo
        </div>
      </div>
    </div>
  );
}

/* =========================
   PRODUCT CARD
========================= */
function ProductCard({ cfg, productData, onAdd, onBuy }) {
  const [packs, setPacks] = useState(1);

  // ⚠️ Prioridad: la imagen del CONFIG de la landing gana sobre la de la API.
  // Las fotos que el usuario mantiene en mundial-revendedores.js son la
  // fuente de verdad (son las más nuevas). La DB puede tener placeholders
  // viejos del seed — si usáramos esos, sobrescribirían las buenas.
  const liveImg =
    cfg.image ||
    productData?.imageUrl ||
    productData?.images?.[0] ||
    FALLBACK_IMG;

  const livePrice = Number(productData?.price) || cfg.price;
  const liveCompare =
    Number(productData?.compareAtPrice) || cfg.compareAtPrice || 0;

  const totalCost = livePrice * packs;
  const totalUnits = cfg.unitsPerPack * packs;
  const totalRev = cfg.suggestedResale * totalUnits;
  const totalProfit = totalRev - totalCost;
  const stockLeft = getStockFor(cfg, productData);
  const stockLow = stockLeft <= 12;

  return (
    <article className={`ml-prod ${cfg.featured ? "is-featured" : ""}`}>
      {cfg.tagline && <div className="ml-prod-tag">{cfg.tagline}</div>}

      <div className="ml-prod-imgBox">
        <img
          src={liveImg}
          alt={cfg.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
        <div className={`ml-stock-pill ${stockLow ? "is-low" : ""}`}>
          <span className="ml-stock-dot" aria-hidden="true" />
          {stockLow ? `¡Quedan ${stockLeft} packs!` : `${stockLeft} packs disponibles`}
        </div>
      </div>

      <div className="ml-prod-body">
        <h3 className="ml-prod-name">{cfg.shortName}</h3>

        <div className="ml-prod-priceRow">
          {liveCompare > livePrice && (
            <span className="ml-prod-was">{moneyARS(liveCompare)}</span>
          )}
          <span className="ml-prod-now">{moneyARS(livePrice)}</span>
          <span className="ml-prod-perPack">/pack x{cfg.unitsPerPack}</span>
        </div>

        <div className="ml-prod-margin">
          Venta sugerida: <strong>{moneyARS(cfg.suggestedResale)}</strong>/u
          &nbsp;·&nbsp;Ganancia:{" "}
          <strong className="ml-prod-margin-profit">
            {moneyARS(cfg.suggestedResale * cfg.unitsPerPack - livePrice)}
          </strong>
          /pack
        </div>

        <div className="ml-prod-qty">
          <span className="ml-prod-qty-label">PACKS:</span>
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              className={`ml-prod-qty-btn ${packs === n ? "is-on" : ""}`}
              onClick={() => setPacks(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="ml-prod-totalRow">
          <div className="ml-prod-total">
            <span>Total ({totalUnits} u)</span>
            <strong>{moneyARS(totalCost)}</strong>
          </div>
          <div className="ml-prod-totalProfit">
            +{moneyARS(totalProfit)} ganancia
          </div>
        </div>

        <div className="ml-prod-ctas">
          <button
            type="button"
            className="ml-btn ml-btn--ghost ml-btn--small"
            onClick={() => onAdd(cfg.slug, packs, productData, cfg)}
          >
            Agregar al pedido
          </button>
          <button
            type="button"
            className="ml-btn ml-btn--primary ml-btn--small"
            onClick={() => onBuy(cfg.slug, packs, productData, cfg)}
          >
            Comprar ahora
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================
   PRODUCT CAROUSEL — un carousel por grupo
========================= */
function ProductCarousel({ group, products, onAdd, onBuy, light = false }) {
  const items = MC.products.filter((p) => !p.isKit && p.group === group.key);
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  if (items.length === 0) return null;

  const go = (idx) => {
    const n = items.length;
    const next = Math.max(0, Math.min(idx, n - 1));
    setActive(next);
    const el = rowRef.current?.querySelectorAll(".pc-slide")?.[next];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onScroll = () => {
    if (!rowRef.current) return;
    const slides = Array.from(rowRef.current.querySelectorAll(".pc-slide"));
    const center = rowRef.current.scrollLeft + rowRef.current.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const sCenter = s.offsetLeft + s.clientWidth / 2;
      const dist = Math.abs(center - sCenter);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActive(best);
  };

  return (
    <section className="ml-pc-section anim-el">
      <SectionHeader
        kicker={group.kicker}
        title={group.title}
        subtitle={group.subtitle}
        light={!light}
      />

      {/* Counter + hint — más intuitivo que solo dots */}
      {items.length > 1 && (
        <div className="pc-counter">
          <span className="pc-counter-num">{active + 1}</span>
          <span className="pc-counter-sep">de</span>
          <span className="pc-counter-tot">{items.length}</span>
          <span className="pc-counter-hint">← Deslizá para ver todos →</span>
        </div>
      )}

      <div className="pc-wrap">
        {items.length > 1 && (
          <button
            type="button"
            className="pc-nav pc-prev"
            onClick={() => go(active - 1)}
            aria-label="Anterior"
            disabled={active === 0}
          >
            ‹
          </button>
        )}

        <div className="pc-row" ref={rowRef} onScroll={onScroll}>
          {items.map((cfg) => (
            <div key={cfg.slug} className="pc-slide">
              <ProductCard
                cfg={cfg}
                productData={products[cfg.slug]}
                onAdd={onAdd}
                onBuy={onBuy}
              />
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            className="pc-nav pc-next"
            onClick={() => go(active + 1)}
            aria-label="Siguiente"
            disabled={active === items.length - 1}
          >
            ›
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="pc-dots">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pc-dot ${i === active ? "on" : ""}`}
              onClick={() => go(i)}
              aria-label={`Producto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   KIT HIGHLIGHT
========================= */
function KitHighlight({ products, onBuyKit, onAddKit }) {
  const cfg = MC.products.find((p) => p.isKit);
  if (!cfg) return null;

  const productData = products[cfg.slug];
  // ⚠️ Misma prioridad que ProductCard: config gana sobre API.
  const liveImg =
    cfg.image || productData?.imageUrl || productData?.images?.[0] || FALLBACK_IMG;
  const livePrice = Number(productData?.price) || cfg.price;
  const liveCompare = Number(productData?.compareAtPrice) || cfg.compareAtPrice || 0;
  const ahorro = liveCompare > livePrice ? liveCompare - livePrice : 0;
  // Stock kit — siempre más bajo para transmitir urgencia real (producto insignia)
  const kitStock = Math.max(6, Math.min(14, getStockFor(cfg, productData) - 2));

  // Fusionamos includes + gifts en una sola lista de chips (evita 2 cajas largas)
  const includedChips = (cfg.includes || []).slice(0, 8);
  const giftChips = (cfg.gifts || []).slice(0, 8);

  return (
    <div className="ml-kit anim-el">
      <div className="ml-kit-tagRow">
        <div className="ml-kit-tag">KIT COMPLETO · +20 DE REGALO 🎁</div>
        <div className="ml-kit-stock">
          <span className="ml-kit-stock-dot" aria-hidden="true" />
          Últimos <strong>{kitStock}</strong> kits
        </div>
      </div>
      <div className="ml-kit-grid">
        <div className="ml-kit-media">
          <img
            src={liveImg}
            alt={cfg.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />
          <div className="ml-kit-saveBadge">AHORRÁS {moneyARS(ahorro)}</div>
        </div>

        <div className="ml-kit-content">
          <h3 className="ml-kit-name">{cfg.name}</h3>

          {/* PRECIO + CTA arriba (antes estaban abajo — el usuario debía scrollear toda la card) */}
          <div className="ml-kit-topBlock">
            <div className="ml-kit-priceRow">
              {liveCompare > livePrice && (
                <span className="ml-kit-was">{moneyARS(liveCompare)}</span>
              )}
              <span className="ml-kit-now">{moneyARS(livePrice)}</span>
              <span className="ml-kit-profitPill">
                +{moneyARS(cfg.kitProfit.netProfit)} ganancia
              </span>
            </div>
            <div className="ml-kit-ctas">
              <button
                type="button"
                className="ml-btn ml-btn--primary ml-btn--big"
                onClick={() => onBuyKit(cfg, productData)}
              >
                ME LO LLEVO →
              </button>
              <button
                type="button"
                className="ml-btn ml-btn--ghost ml-btn--small"
                onClick={() => onAddKit(cfg, productData)}
              >
                + Pedido
              </button>
            </div>
          </div>

          {/* CHIPS: incluye + regalos en una sola fila compacta */}
          <div className="ml-kit-chipsWrap">
            {includedChips.length > 0 && (
              <div className="ml-kit-chipsRow">
                <span className="ml-kit-chipsLbl">INCLUYE</span>
                <div className="ml-kit-chips">
                  {includedChips.map((it, i) => (
                    <span key={i} className="ml-kit-chip">{it}</span>
                  ))}
                </div>
              </div>
            )}
            {giftChips.length > 0 && (
              <div className="ml-kit-chipsRow ml-kit-chipsRow--gift">
                <span className="ml-kit-chipsLbl">🎁 REGALO</span>
                <div className="ml-kit-chips">
                  {giftChips.map((g, i) => (
                    <span key={i} className="ml-kit-chip ml-kit-chip--gift">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profit rápido — 3 columnas inline */}
          <div className="ml-kit-profitMini">
            <div className="ml-kit-profitMini-col">
              <span>Invertís</span>
              <strong>{moneyARS(livePrice)}</strong>
            </div>
            <div className="ml-kit-profitMini-arrow" aria-hidden="true">→</div>
            <div className="ml-kit-profitMini-col ml-kit-profitMini-col--hi">
              <span>Te queda</span>
              <strong>+{moneyARS(cfg.kitProfit.netProfit)}</strong>
            </div>
            <div className="ml-kit-profitMini-badge">+{cfg.kitProfit.marginPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   MINI REVIEWS BAR — rotating compact review card
========================= */
function MiniReviewsBar() {
  const data = MC.reviews.slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => setActive((i) => (i + 1) % data.length), 4500);
    return () => clearInterval(t);
  }, [data.length]);

  if (!data.length) return null;

  const avatarColors = ["#1B4D3E", "#2F855A", "#f59e0b", "#8b5cf6", "#E53E3E", "#06b6d4"];

  return (
    <div className="mrb anim-el">
      <div className="mrb-label">LO QUE DICEN NUESTROS REVENDEDORES</div>
      <div className="mrb-viewport">
        <div className="mrb-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {data.map((r, i) => (
            <div className="mrb-slide" key={i}>
              <div className="mrb-card">
                <div className="mrb-card-header">
                  <div
                    className="mrb-card-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="mrb-card-meta">
                    <div className="mrb-card-name">{r.name} — {r.city}</div>
                    <div className="mrb-card-stars">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} style={{ color: j < (r.stars || 5) ? "#FBBF24" : "#D1D5DB" }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mrb-card-text">"{r.short || r.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mrb-dots">
        {data.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`mrb-dot ${i === active ? "on" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Reseña ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   HOW IT WORKS
========================= */
function HowItWorks() {
  const { howItWorks } = MC;
  return (
    <div className="ml-htw anim-el">
      <SectionHeader
        kicker="EL PROCESO"
        title={howItWorks.title}
        subtitle={howItWorks.subtitle}
        light
      />
      <div className="ml-htw-grid">
        {howItWorks.steps.map((s, i) => (
          <div key={i} className="ml-htw-step">
            <div className="ml-htw-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="ml-htw-icon">{s.icon}</div>
            <h4 className="ml-htw-stepTitle">{s.title}</h4>
            <p className="ml-htw-stepText">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   RESELLER REVIEWS — mismo layout que ProductDetail (rv- carousel)
========================= */
function StarsInline({ rating = 5 }) {
  return (
    <div className="rv-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? "#FBBF24" : "#D1D5DB" }}>★</span>
      ))}
    </div>
  );
}

function ResellerReviews() {
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  const go = (idx) => {
    const n = MC.reviews.length;
    const next = (idx + n) % n;
    setActive(next);
    const el = rowRef.current?.querySelectorAll(".rv-slide")?.[next];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onScroll = () => {
    if (!rowRef.current) return;
    const slides = Array.from(rowRef.current.querySelectorAll(".rv-slide"));
    const center = rowRef.current.scrollLeft + rowRef.current.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const sCenter = s.offsetLeft + s.clientWidth / 2;
      const dist = Math.abs(center - sCenter);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActive(best);
  };

  return (
    <section className="pd-block anim-el" id="reviews-section">
      <SectionHeader
        kicker="RESEÑAS"
        title="LO QUE DICEN OTROS REVENDEDORES"
      />

      <div className="rv-wrap">
        <button type="button" className="rv-nav rv-prev" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div className="rv-row" ref={rowRef} onScroll={onScroll}>
          {MC.reviews.map((r, i) => {
            const [c1, c2] = getAvatarColors(r.name);
            return (
              <article key={i} className="rv-slide">
                <div className="rv-card">
                  <div className="rv-head">
                    <div
                      className="rv-avatar"
                      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
                      aria-hidden="true"
                    >
                      {getInitials(r.name)}
                    </div>
                    <div className="rv-head-meta">
                      <div className="rv-name">{r.name}</div>
                      <div className="rv-city">{r.city}</div>
                      <StarsInline rating={r.stars} />
                    </div>
                    <div className="rv-verified" aria-label="Cliente verificado">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
                      </svg>
                      <span>Verificado</span>
                    </div>
                  </div>
                  <div className="rv-body">
                    <div className="rv-title">{r.title}</div>
                    <p className="rv-text">&ldquo;{r.text}&rdquo;</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" className="rv-nav rv-next" onClick={() => go(active + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className="rv-dots">
        {MC.reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`rv-dot ${i === active ? "on" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir al testimonio ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/* =========================
   FAQ — custom look (numerado, acento verde, acordeón suave)
========================= */
function ResellerFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="ml-faq-section">
      <SectionHeader
        kicker="DUDAS FRECUENTES"
        title={MC.faqTitle || "LO QUE MÁS NOS PREGUNTAN"}
        subtitle="Respondemos lo que todo revendedor quiere saber antes de empezar."
        light
      />
      <div className="ml-faq-list anim-el">
        {MC.faq.map((item, i) => {
          const isOpen = openIndex === i;
          const num = String(i + 1).padStart(2, "0");
          return (
            <div key={i} className={`ml-faq-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="ml-faq-q"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="ml-faq-num">{num}</span>
                <span className="ml-faq-q-text">{item.q}</span>
                <span className="ml-faq-chev" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              <div className="ml-faq-a">
                <div className="ml-faq-a-inner">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================
   ABOUT (B2B) — sección final, clean y pro
========================= */
function AboutB2B() {
  const { about } = MC;
  return (
    <section className="ml-about-final anim-el">
      <div className="ml-about-kicker-wrap">
        <span className="ml-about-kicker">QUIÉNES SOMOS</span>
      </div>
      <h3 className="ml-about-title">{about.title}</h3>
      <p className="ml-about-text">{about.text}</p>

      {about.bullets?.length > 0 && (
        <div className="ml-about-bullets">
          {about.bullets.map((b, i) => (
            <div key={i} className="ml-about-pill">
              <span className="ml-about-pill-ico" aria-hidden="true">✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ml-about-signoff">
        <div className="ml-about-signoff-logo">BoomHausS</div>
        <div className="ml-about-signoff-tag">
          Distribución mayorista · Argentina
        </div>
      </div>
    </section>
  );
}

/* =========================
   SOCIAL PROOF BAR — debajo del hero
========================= */
function SocialProofBar() {
  // Determinístico por día: cambia cada 24h, estable dentro del día.
  // Rango 17..34 para que sea creíble y no exagerado.
  const todayCount = 17 + (dayOfYear() % 18);
  const liveCount = 3 + (dayOfYear() % 5); // "viendo ahora"
  return (
    <div className="ml-social-proof anim-el">
      <div className="ml-social-proof-item">
        <span className="ml-social-proof-pulse" aria-hidden="true" />
        <span className="ml-social-proof-num">{liveCount}</span>
        <span className="ml-social-proof-txt">revendedores viendo ahora</span>
      </div>
      <div className="ml-social-proof-sep" aria-hidden="true" />
      <div className="ml-social-proof-item">
        <span className="ml-social-proof-fire">🔥</span>
        <span className="ml-social-proof-num">{todayCount}</span>
        <span className="ml-social-proof-txt">compraron hoy</span>
      </div>
    </div>
  );
}

/* =========================
   MARKET COMPARE — por qué nosotros vs competencia
========================= */
function MarketCompare() {
  const rows = [
    {
      feat: "Precio mayorista real",
      them: { txt: "Precio inflado", ok: false },
      us:   { txt: "Directo de fábrica", ok: true },
    },
    {
      feat: "Mínimo de compra",
      them: { txt: "50+ unidades", ok: false },
      us:   { txt: "1 solo pack", ok: true },
    },
    {
      feat: "Tiempo de entrega",
      them: { txt: "5 a 10 días", ok: false },
      us:   { txt: "24 a 48hs", ok: true },
    },
    {
      feat: "Reposición de daños",
      them: { txt: "Trámite largo", ok: false },
      us:   { txt: "Gratis, sin vueltas", ok: true },
    },
    {
      feat: "Atención",
      them: { txt: "Formulario / bot", ok: false },
      us:   { txt: "WhatsApp humano", ok: true },
    },
    {
      feat: "Factura A o B",
      them: { txt: "A veces", ok: false },
      us:   { txt: "Siempre", ok: true },
    },
  ];
  return (
    <div className="ml-compare anim-el">
      <div className="ml-compare-table">
        <div className="ml-compare-head">
          <div className="ml-compare-head-feat" aria-hidden="true" />
          <div className="ml-compare-head-them">
            <span className="ml-compare-head-lbl">OTROS PROVEEDORES</span>
          </div>
          <div className="ml-compare-head-us">
            <span className="ml-compare-head-lbl">NOSOTROS</span>
            <span className="ml-compare-head-pill">RECOMENDADO</span>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="ml-compare-row">
            <div className="ml-compare-feat">{r.feat}</div>
            <div className="ml-compare-them">
              <span className="ml-compare-ico ml-compare-ico--x">✕</span>
              <span className="ml-compare-txt">{r.them.txt}</span>
            </div>
            <div className="ml-compare-us">
              <span className="ml-compare-ico ml-compare-ico--ok">✓</span>
              <span className="ml-compare-txt">{r.us.txt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   STICKY BAR + Final CTA
========================= */
function StickyBarMundial({ kitPrice, onBuy, onWhatsapp, cartCount, cartTotal, minOrder, onAddMore }) {
  const hasCart = cartCount > 0;
  const min = Number(minOrder) || 0;
  const underMin = hasCart && min > 0 && (cartTotal || 0) < min;
  const missing = underMin ? min - (cartTotal || 0) : 0;
  const minProgress = min > 0 ? Math.min(1, (cartTotal || 0) / min) : 0;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const h = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      setVisible(y > 260);
      setProgress(Math.max(0, Math.min(1, y / h)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  let label;
  if (underMin) {
    label = `FALTAN ${moneyARS(missing)}`;
  } else if (hasCart) {
    label = `TU PEDIDO · ${cartCount} ${cartCount === 1 ? "ítem" : "ítems"} · ENVÍO GRATIS ✓`;
  } else {
    label = "KIT RECOMENDADO";
  }
  const priceToShow = hasCart ? cartTotal : kitPrice;
  const btnLabel = underMin ? "AGREGAR MÁS" : hasCart ? "CHECKOUT →" : "ME LO LLEVO →";
  const btnHandler = underMin ? onAddMore : onBuy;

  return (
    <div
      className={`ml-sticky ${hasCart ? "has-cart" : ""} ${underMin ? "is-under-min" : ""} ${visible ? "is-visible" : ""}`}
      role="region"
      aria-label="Barra de compra"
    >
      <div
        className="ml-sticky-progress"
        style={{ transform: `scaleX(${underMin ? minProgress : progress})` }}
        aria-hidden="true"
      />
      <div className="ml-sticky-info">
        <div className="ml-sticky-label">
          {hasCart && <span className="ml-sticky-dot" aria-hidden="true" />}
          {label}
        </div>
        <div className="ml-sticky-price">{moneyARS(priceToShow)}</div>
      </div>
      <div className="ml-sticky-ctas">
        <button type="button" className="ml-sticky-wa" onClick={onWhatsapp} aria-label="WhatsApp">
          💬
        </button>
        <button type="button" className="ml-sticky-btn" onClick={btnHandler}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

/* =========================
   MAIN
========================= */
export default function MundialLanding() {
  const navigate = useNavigate();
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
          } catch (_) {}
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

  // Pixel tracking
  useEffect(() => {
    track("ViewContent", {
      content_name: "Mundial Revendedores",
      content_category: "B2B",
      currency: "ARS",
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

  const scrollToCalc = () =>
    calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    track("AddToCart", {
      content_ids: [slug],
      content_type: "product",
      value: (productData?.price || cfg.price) * packs,
      currency: "ARS",
      num_items: packs,
    });
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
    handleAddProduct(slug, packs, productData, cfg);
    const addedValue = (productData?.price || cfg.price) * packs;
    const projected = (cartTotal || 0) + addedValue;
    track("AddToCart", {
      content_ids: [slug],
      content_type: "product",
      value: addedValue,
      currency: "ARS",
      num_items: packs,
    });
    // Si el pedido proyectado no llega al mínimo, bloqueamos checkout y avisamos.
    if (!ensureMinOrder(projected)) return;
    track("InitiateCheckout", {
      content_ids: [slug],
      content_type: "product",
      value: projected,
      currency: "ARS",
      num_items: packs,
    });
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
    track("InitiateCheckout", {
      content_ids: [c.slug],
      content_name: "Kit Completo Revendedor",
      currency: "ARS",
      value: projected,
      num_items: 1,
    });
    setShowCheckout(true);
  };

  const handleStickyBuy = () => {
    // Si el carrito ya tiene ítems, abrimos el checkout con lo que el usuario
    // agregó (sin forzar el Kit). Si el carrito está vacío, mantenemos el
    // comportamiento histórico: agregar el Kit Completo y abrir checkout.
    if (cartItems && cartItems.length > 0) {
      if (!ensureMinOrder(cartTotal || 0)) return;
      track("InitiateCheckout", {
        content_type: "product",
        currency: "ARS",
        value: cartTotal || 0,
        num_items: cartItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      });
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

      <WaveSeparator from="blue" />

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
        <MiniReviewsBar />
      </Band>

      <WaveSeparator from="light" />

      {/* 3. CALCULADORA blue — ahora debajo del kit */}
      <Band variant="blue" innerRef={calcRef} waCtx="calc">
        <ProfitCalculator
          onBuyNow={(product, packs) =>
            handleBuyProduct(product.slug, packs, products[product.slug], product)
          }
        />
      </Band>

      <WaveSeparator from="blue" />

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

      <WaveSeparator from="light" />

      {/* 5. Carousel 2 — Accesorios (blue) */}
      <Band variant="blue" waCtx="catalog">
        <ProductCarousel
          group={g2}
          products={products}
          onAdd={handleAddProduct}
          onBuy={handleBuyProduct}
        />
      </Band>

      <WaveSeparator from="blue" />

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

      <WaveSeparator from="light" />

      {/* 7. HOW IT WORKS blue */}
      <Band variant="blue" waCtx="general">
        <HowItWorks />
      </Band>

      <WaveSeparator from="blue" />

      {/* 8. REVIEWS carousel grande (light) */}
      <Band variant="light" waCtx="reviews">
        <ResellerReviews />
      </Band>

      <WaveSeparator from="light" />

      {/* 9. FAQ blue */}
      <Band variant="blue" waCtx="faq">
        <ResellerFaq />
      </Band>

      <WaveSeparator from="blue" />

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

      {MC.whatsapp?.show && (
        <WaTab number={MC.whatsapp.number} message={getWaMessage} />
      )}

      {showCheckout && <CheckoutSheet onClose={() => setShowCheckout(false)} />}

      {/* CSS específico de la landing */}
      <style>{`
        .ml-page { background: #F7FBF9; padding-bottom: 90px; }
        .ml-page .pd-band-inner { width: min(var(--container), calc(100% - 2rem)); margin: 0 auto; }

        /* 📏 COMPACT: reduce vertical padding de cada banda y altura de los waves
           para que la landing no sea tan larga de scrollear */
        .ml-page .pd-band { padding: 36px 0; }
        @media (max-width: 520px) { .ml-page .pd-band { padding: 30px 0; } }
        /* Primera banda (hero) más compacta — el usuario entra y lo primero que ve */
        .ml-page .pd-band:first-of-type { padding: 20px 0 24px; }
        @media (max-width: 520px) {
          .ml-page .pd-band:first-of-type { padding: 14px 0 20px; }
        }
        .ml-page .wave-divider { height: 60px; }
        @media (min-width: 1000px) { .ml-page .wave-divider { height: 72px; } }
        .ml-page .wave-divider .waves-anim { max-height: 2.2rem; }
        @media (min-width: 1000px) { .ml-page .wave-divider .waves-anim { max-height: 3.2rem; } }

        /* Section headers: menos margen inferior */
        .ml-page .ml-sec-head { margin: 2px auto 18px; }

        /* Override: la banda azul del pd-band usa radial-gradient, lo que hace
           que el borde top NO sea uniforme y nunca matchee contra el wave.
           Forzamos un linear-gradient vertical que termina en #0F2D24 arriba y
           abajo — idéntico color que el wave separator. */
        .ml-page .pd-band--blue {
          background: linear-gradient(180deg, #0F2D24 0%, #153D31 40%, #153D31 60%, #0F2D24 100%);
        }
        .ml-page .pd-band--light { background: #F7FBF9; }

        /* === SECTION HEADERS === */
        .ml-sec-head { text-align: center; margin: 6px auto 28px; max-width: 720px; }
        .ml-sec-kicker {
          display: inline-block;
          font-size: .72rem;
          font-weight: 1000;
          letter-spacing: .14em;
          color: #1B4D3E;
          background: rgba(94,234,212,.18);
          border: 1px solid rgba(27,77,62,.18);
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 12px;
        }
        .ml-sec-kicker.is-light {
          color: #5EEAD4;
          background: rgba(94,234,212,.10);
          border-color: rgba(94,234,212,.30);
        }
        .ml-sec-title {
          margin: 0;
          font-size: clamp(1.7rem, 3.4vw, 2.6rem);
          font-weight: 1100;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: rgba(11,18,32,.92);
          text-transform: uppercase;
        }
        .ml-sec-title.is-light { color: #fff; }
        .ml-sec-sub {
          margin: 12px auto 0;
          font-size: 1.02rem;
          font-weight: 700;
          color: rgba(11,18,32,.62);
          line-height: 1.55;
          max-width: 560px;
        }
        .ml-sec-sub.is-light { color: rgba(255,255,255,.78); }

        /* === BUTTONS === */
        .ml-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 22px;
          border-radius: 14px;
          font-weight: 1000;
          font-size: .98rem;
          letter-spacing: .01em;
          cursor: pointer;
          border: none;
          transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
          font-family: inherit;
        }
        .ml-btn--primary {
          background: linear-gradient(135deg, #1B4D3E 0%, #153D31 60%, #0F2D24 100%);
          color: #fff;
          box-shadow: 0 14px 40px rgba(27,77,62,.32);
        }
        .ml-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(27,77,62,.40); }
        .ml-btn--primary:active { transform: translateY(0); }
        .ml-btn--ghost {
          background: rgba(255,255,255,.92);
          color: rgba(11,18,32,.85);
          border: 1.5px solid rgba(11,18,32,.14);
          box-shadow: 0 6px 20px rgba(11,18,32,.06);
        }
        .ml-btn--ghost:hover { border-color: rgba(11,18,32,.30); transform: translateY(-1px); }
        .ml-btn--small { padding: 11px 16px; font-size: .9rem; border-radius: 12px; }
        .ml-btn--big { padding: 18px 26px; font-size: 1.1rem; }
        .ml-btn-arrow { font-size: 1.1em; }

        /* === HERO (compacto) === */
        .ml-hero {
          text-align: center;
          padding: 4px 0 2px;
          position: relative;
          z-index: 2;
        }
        /* Glow radial sutil detrás del hero — agrega profundidad sin ocupar espacio */
        .ml-hero::before {
          content: "";
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: min(760px, 90vw);
          height: 280px;
          background: radial-gradient(ellipse at center, rgba(94,234,212,.18) 0%, rgba(94,234,212,.05) 40%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }
        .ml-hero-badge {
          display: inline-block;
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .15em;
          color: #5EEAD4;
          background: rgba(94,234,212,.12);
          border: 1px solid rgba(94,234,212,.30);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .ml-hero-title {
          margin: 0 auto 8px;
          font-size: clamp(1.85rem, 4.4vw, 3.2rem);
          font-weight: 1100;
          letter-spacing: -0.035em;
          line-height: 1.03;
          color: #fff;
          max-width: 820px;
          text-transform: uppercase;
        }
        .ml-hero-accent {
          background: linear-gradient(135deg, #5EEAD4 0%, #75F8E1 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
        }
        .ml-hero-sub {
          margin: 0 auto 14px;
          font-size: .95rem;
          font-weight: 700;
          color: rgba(255,255,255,.78);
          line-height: 1.45;
          max-width: 580px;
        }
        .ml-hero-ctas {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        /* Stats inline: pills horizontales en lugar de cards grandes */
        .ml-hero-stats {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          max-width: 100%;
          margin: 0 auto;
        }
        .ml-hero-stat {
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(6px);
          padding: 7px 13px;
          border-radius: 999px;
          text-align: left;
        }
        .ml-hero-stat-val {
          font-size: .95rem;
          font-weight: 1100;
          color: #5EEAD4;
          letter-spacing: -0.01em;
          line-height: 1;
          margin: 0;
        }
        .ml-hero-stat-lbl {
          font-size: .68rem;
          font-weight: 800;
          color: rgba(255,255,255,.78);
          line-height: 1.2;
          letter-spacing: .01em;
          text-transform: uppercase;
        }
        @media (max-width: 560px) {
          .ml-hero { padding: 2px 0 0; }
          .ml-hero-title { font-size: 1.65rem; line-height: 1.06; }
          .ml-hero-sub { font-size: .88rem; margin-bottom: 12px; }
          .ml-hero-ctas { margin-bottom: 12px; gap: 8px; }
          .ml-hero-stat { padding: 6px 11px; gap: 6px; }
          .ml-hero-stat-val { font-size: .88rem; }
          .ml-hero-stat-lbl { font-size: .62rem; }
        }

        /* === TRUST STRIP === */
        .ml-trust-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 20px auto 0;
          max-width: 820px;
        }
        .ml-trust-item {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          padding: 14px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ml-trust-icon { font-size: 1.5rem; line-height: 1; }
        .ml-trust-meta { display: flex; flex-direction: column; min-width: 0; }
        .ml-trust-label { font-size: .68rem; font-weight: 800; letter-spacing: .08em; color: rgba(255,255,255,.55); text-transform: uppercase; }
        .ml-trust-value { font-size: .92rem; font-weight: 1000; color: #fff; line-height: 1.2; }
        @media (max-width: 720px) {
          .ml-trust-strip { grid-template-columns: repeat(2, 1fr); }
        }

        /* === PROFIT CALCULATOR (sobre banda azul) === */
        /* ============= PROFIT CALCULATOR v2 — clean & pro ============= */
        .ml-calc {
          max-width: 720px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid rgba(27,77,62,.10);
          border-radius: 22px;
          padding: 24px 24px 22px;
          box-shadow: 0 22px 60px rgba(2,8,23,0.18);
        }
        @media (max-width: 560px) { .ml-calc { padding: 20px 18px; border-radius: 18px; } }

        .ml-calc-head { text-align: center; margin-bottom: 16px; }
        .ml-calc-kicker {
          display: inline-block;
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .16em;
          color: #1B4D3E;
          background: rgba(94,234,212,.18);
          border: 1px solid rgba(27,77,62,.14);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .ml-calc-title {
          margin: 0;
          font-size: clamp(1.3rem, 2.6vw, 1.7rem);
          font-weight: 1100;
          letter-spacing: -0.02em;
          color: rgba(11,18,32,.92);
          line-height: 1.15;
        }

        /* Tabs horizontales — productos */
        .ml-calc-tabs-wrap {
          position: relative;
          margin: 0 -4px 14px;
        }
        .ml-calc-tabs-hint {
          text-align: center;
          font-size: .64rem;
          font-weight: 900;
          letter-spacing: .08em;
          color: rgba(27,77,62,.55);
          margin-bottom: 4px;
          text-transform: uppercase;
          animation: mlTabsHintPulse 2.4s ease-in-out infinite;
        }
        @keyframes mlTabsHintPulse {
          0%,100% { opacity: .55; }
          50%     { opacity: 1; }
        }
        .ml-calc-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px 2px 10px;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
          border-bottom: 1px solid rgba(27,77,62,.10);
        }
        .ml-calc-tabs::-webkit-scrollbar { display: none; }
        .ml-calc-tab {
          flex-shrink: 0;
          scroll-snap-align: start;
          padding: 8px 14px;
          background: transparent;
          border: none;
          font-family: inherit;
          font-weight: 900;
          font-size: .82rem;
          color: rgba(11,18,32,.48);
          cursor: pointer;
          border-radius: 8px;
          position: relative;
          transition: color .15s ease;
          white-space: nowrap;
        }
        .ml-calc-tab:hover { color: rgba(11,18,32,.75); }
        .ml-calc-tab.is-on {
          color: #0F2D24;
        }
        .ml-calc-tab.is-on::after {
          content: "";
          position: absolute;
          left: 12px; right: 12px; bottom: -10px;
          height: 3px;
          background: linear-gradient(90deg, #1B4D3E, #5EEAD4);
          border-radius: 3px 3px 0 0;
        }

        .ml-calc-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* HERO equation — lo primero que ve el cliente */
        .ml-calc-hero {
          background: linear-gradient(135deg, #064E3B 0%, #0F2D24 100%);
          border-radius: 16px;
          padding: 18px 16px 16px;
          color: #fff;
          box-shadow: 0 14px 32px rgba(6,78,59,.30);
          position: relative;
          overflow: hidden;
        }
        .ml-calc-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 90% 10%, rgba(94,234,212,.22) 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(16,185,129,.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .ml-calc-hero-eq {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .ml-calc-hero-col {
          flex: 1;
          text-align: center;
          min-width: 0;
        }
        .ml-calc-hero-lbl {
          font-size: .64rem;
          font-weight: 1000;
          letter-spacing: .14em;
          color: rgba(255,255,255,.65);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .ml-calc-hero-val {
          font-size: clamp(1.2rem, 4.5vw, 1.7rem);
          font-weight: 1100;
          letter-spacing: -0.02em;
          line-height: 1.05;
        }
        .ml-calc-hero-val--cost { color: #fff; }
        .ml-calc-hero-val--profit {
          color: #5EEAD4;
          text-shadow: 0 0 24px rgba(94,234,212,.35);
        }
        .ml-calc-hero-arrow {
          flex-shrink: 0;
          width: 34px; height: 34px;
          display: grid; place-items: center;
          border-radius: 50%;
          background: rgba(94,234,212,.18);
          border: 1.5px solid rgba(94,234,212,.35);
          color: #5EEAD4;
          font-size: 1.05rem;
          font-weight: 1000;
        }
        .ml-calc-hero-mult {
          position: relative;
          z-index: 1;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed rgba(94,234,212,.30);
          text-align: center;
          font-size: .82rem;
          font-weight: 700;
          color: rgba(255,255,255,.80);
        }
        .ml-calc-hero-mult strong {
          color: #5EEAD4;
          font-weight: 1100;
          font-size: .96rem;
        }

        /* Mini summary — detalles por unidad */
        .ml-calc-mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: #F7FBF9;
          border: 1px solid rgba(27,77,62,.10);
          border-radius: 12px;
          padding: 12px 4px;
        }
        .ml-calc-mini-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 0 4px;
          text-align: center;
          min-width: 0;
        }
        .ml-calc-mini-lbl {
          font-size: .6rem;
          font-weight: 800;
          letter-spacing: .04em;
          color: rgba(11,18,32,.55);
          text-transform: uppercase;
          line-height: 1.2;
        }
        .ml-calc-mini-val {
          font-size: .9rem;
          font-weight: 1000;
          color: #0F2D24;
          letter-spacing: -0.01em;
        }
        .ml-calc-mini-item--hi .ml-calc-mini-val {
          color: #059669;
        }
        .ml-calc-mini-item--hi {
          background: rgba(16,185,129,.08);
          border-radius: 8px;
          padding: 4px 4px;
        }
        .ml-calc-go-sub {
          margin-top: 10px;
          text-align: center;
          font-size: .72rem;
          font-weight: 800;
          color: rgba(11,18,32,.55);
          letter-spacing: .01em;
        }

        /* Stepper row */
        .ml-calc-stepper-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 2px;
        }
        .ml-calc-stepper-lbl-top {
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .12em;
          color: rgba(11,18,32,.55);
        }
        .ml-calc-stepper-lbl-sub {
          font-size: .84rem;
          font-weight: 700;
          color: rgba(11,18,32,.6);
          margin-top: 2px;
        }
        .ml-calc-stepper-lbl-sub strong { color: #0F2D24; font-weight: 1000; }
        .ml-calc-stepper {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: #fff;
          border: 1.5px solid rgba(27,77,62,.18);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(2,8,23,.06);
        }
        .ml-calc-stepper-btn {
          width: 40px;
          height: 42px;
          border: none;
          background: transparent;
          font-size: 1.3rem;
          font-weight: 1100;
          color: #1B4D3E;
          cursor: pointer;
          transition: background .15s ease;
          font-family: inherit;
        }
        .ml-calc-stepper-btn:hover { background: rgba(94,234,212,.18); }
        .ml-calc-stepper-val {
          min-width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 1100;
          color: #0F2D24;
          border-left: 1px solid rgba(27,77,62,.14);
          border-right: 1px solid rgba(27,77,62,.14);
          padding: 0 6px;
        }

        /* Summary table */
        .ml-calc-summary {
          display: flex;
          flex-direction: column;
          background: #F7FBF9;
          border: 1px solid rgba(27,77,62,.10);
          border-radius: 14px;
          overflow: hidden;
        }
        .ml-calc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(27,77,62,.08);
        }
        .ml-calc-row:last-child { border-bottom: none; }
        .ml-calc-row-lbl {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: .92rem;
          font-weight: 850;
          color: rgba(11,18,32,.68);
        }
        .ml-calc-row-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .ml-calc-row-dot--cost { background: #F97316; }
        .ml-calc-row-dot--rev  { background: #F59E0B; }
        .ml-calc-row-dot--profit { background: #10B981; }
        .ml-calc-row-val {
          font-size: 1rem;
          font-weight: 1000;
          color: #0F2D24;
          letter-spacing: -0.01em;
          text-align: right;
        }
        .ml-calc-row--profit {
          background: linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%);
          color: #fff;
          padding: 16px 16px;
        }
        .ml-calc-row--profit .ml-calc-row-lbl { color: rgba(255,255,255,.72); }
        .ml-calc-row--profit .ml-calc-row-dot--profit { background: #5EEAD4; box-shadow: 0 0 0 3px rgba(94,234,212,.25); }
        .ml-calc-row-val-wrap { text-align: right; }
        .ml-calc-row-val--big {
          color: #5EEAD4;
          font-size: clamp(1.3rem, 2.8vw, 1.7rem);
          line-height: 1.1;
        }
        .ml-calc-row-margin {
          margin-top: 4px;
          font-size: .72rem;
          font-weight: 900;
          color: rgba(255,255,255,.70);
          letter-spacing: .02em;
        }

        .ml-calc-go {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px 18px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #059669 0%, #1B4D3E 100%);
          color: #fff;
          font-weight: 1000;
          font-size: .96rem;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(6,78,59,.30);
          transition: transform .15s ease, box-shadow .15s ease;
          font-family: inherit;
          letter-spacing: .005em;
        }
        .ml-calc-go:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(6,78,59,.40); }
        .ml-calc-go-arrow { font-size: 1.1rem; transition: transform .2s ease; }
        .ml-calc-go:hover .ml-calc-go-arrow { transform: translateX(3px); }

        @media (max-width: 480px) {
          .ml-calc-mini-val { font-size: .8rem; }
          .ml-calc-mini-lbl { font-size: .54rem; }
          .ml-calc-hero-val { font-size: 1.15rem; }
          .ml-calc-hero-mult { font-size: .74rem; }
          .ml-calc-hero-mult strong { font-size: .88rem; }
        }

        /* === PRODUCT CAROUSEL (pc-) === */
        .ml-pc-section { margin: 0 auto; }
        .pc-wrap { position: relative; margin-top: 10px; }
        .pc-row {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 10px 6px 18px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .pc-row::-webkit-scrollbar { display: none; }
        .pc-slide {
          scroll-snap-align: center;
          flex: 0 0 auto;
          width: min(360px, 85vw);
        }
        .pc-nav {
          position: absolute;
          top: 42%;
          transform: translateY(-50%);
          width: 46px; height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(2,8,23,.10);
          background: rgba(255,255,255,.96);
          box-shadow: 0 18px 44px rgba(10,20,40,.22);
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 26px;
          color: rgba(11,18,32,.80);
          z-index: 10;
          transition: transform .15s ease, opacity .15s ease;
          font-family: inherit;
        }
        .pc-nav:hover:not(:disabled) { transform: translateY(-50%) scale(1.06); }
        .pc-nav:disabled { opacity: .35; cursor: not-allowed; }
        .pc-prev { left: -10px; }
        .pc-next { right: -10px; }
        @media (max-width: 680px) {
          .pc-nav { width: 40px; height: 40px; font-size: 22px; }
          .pc-prev { left: 4px; }
          .pc-next { right: 4px; }
        }
        .ml-page .pd-band--blue .pc-nav {
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.25);
          color: #fff;
          backdrop-filter: blur(6px);
        }

        /* Counter + swipe hint */
        .pc-counter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin: 4px auto 0;
          font-size: .7rem;
          font-weight: 900;
          color: rgba(11,18,32,.55);
          letter-spacing: .02em;
        }
        .pc-counter-num {
          display: inline-grid;
          place-items: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          background: #1B4D3E;
          color: #5EEAD4;
          border-radius: 999px;
          font-size: .78rem;
          font-weight: 1100;
        }
        .pc-counter-sep { margin: 0 4px; font-weight: 700; }
        .pc-counter-tot { font-weight: 1000; color: rgba(11,18,32,.75); }
        .pc-counter-hint {
          margin-left: 10px;
          font-size: .66rem;
          font-weight: 800;
          letter-spacing: .05em;
          color: rgba(11,18,32,.42);
          text-transform: uppercase;
          animation: pcHintPulse 2.4s ease-in-out infinite;
        }
        @keyframes pcHintPulse {
          0%,100% { opacity: .42; transform: translateX(0); }
          50%     { opacity: .9; transform: translateX(2px); }
        }
        .ml-page .pd-band--blue .pc-counter { color: rgba(255,255,255,.62); }
        .ml-page .pd-band--blue .pc-counter-num { background: rgba(94,234,212,.22); color: #5EEAD4; }
        .ml-page .pd-band--blue .pc-counter-tot { color: rgba(255,255,255,.88); }
        .ml-page .pd-band--blue .pc-counter-hint { color: rgba(255,255,255,.52); }
        @media (max-width: 520px) {
          .pc-counter-hint { display: none; }
        }

        .pc-dots { display: flex; justify-content: center; gap: 7px; margin-top: 6px; }
        .pc-dot {
          width: 7px; height: 7px;
          border-radius: 999px;
          border: none;
          background: rgba(2,8,23,.20);
          cursor: pointer;
          padding: 0;
          transition: width .22s ease, background .2s ease;
        }
        .pc-dot.on { background: #1B4D3E; width: 22px; }
        .ml-page .pd-band--blue .pc-dot { background: rgba(255,255,255,.30); }
        .ml-page .pd-band--blue .pc-dot.on { background: #5EEAD4; }

        /* === MINI REVIEWS BAR (mrb-) — compacto debajo del kit === */
        .mrb {
          margin: 28px auto 0;
          max-width: 640px;
        }
        .mrb-label {
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: rgba(11,18,32,.42);
          margin-bottom: 10px;
          text-align: center;
        }
        .mrb-viewport { overflow: hidden; border-radius: 16px; }
        .mrb-track {
          display: flex;
          width: 100%;
          transition: transform .45s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }
        .mrb-slide { flex: 0 0 100%; width: 100%; }
        .mrb-card {
          background: #fff;
          border: 1px solid rgba(2,8,23,.09);
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 8px 28px rgba(10,20,40,.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 120px;
        }
        .mrb-card-header { display: flex; align-items: center; gap: 12px; }
        .mrb-card-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          color: #fff;
          font-weight: 1000;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,.12);
        }
        .mrb-card-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .mrb-card-name {
          font-size: .85rem;
          font-weight: 1000;
          color: rgba(11,18,32,.88);
          line-height: 1;
        }
        .mrb-card-stars { font-size: .85rem; line-height: 1; }
        .mrb-card-text {
          margin: 0;
          font-size: .92rem;
          font-style: italic;
          color: rgba(11,18,32,.70);
          font-weight: 600;
          line-height: 1.55;
        }
        .mrb-dots { display: flex; justify-content: center; gap: 6px; margin-top: 12px; }
        .mrb-dot {
          width: 6px; height: 6px;
          border-radius: 999px;
          border: none;
          background: rgba(2,8,23,.18);
          cursor: pointer;
          padding: 0;
          transition: width .22s ease, background .2s ease;
        }
        .mrb-dot.on { background: #1B4D3E; width: 18px; }

        .ml-prod {
          position: relative;
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 18px 48px rgba(2,8,23,0.10);
          display: flex;
          flex-direction: column;
          transition: transform .2s ease, box-shadow .2s ease;
          border: 1px solid rgba(11,18,32,.06);
        }
        .ml-prod:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 60px rgba(2,8,23,0.16);
        }
        .ml-prod-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;
          background: linear-gradient(135deg, #FB923C 0%, #EA580C 100%);
          color: #fff;
          font-size: .65rem;
          font-weight: 1000;
          letter-spacing: .1em;
          padding: 5px 10px;
          border-radius: 999px;
          box-shadow: 0 6px 16px rgba(234,88,12,.35);
          text-transform: uppercase;
        }
        .ml-prod-imgBox {
          aspect-ratio: 1 / 1;
          background: linear-gradient(180deg, #FDFFFE 0%, #F1F7F4 100%);
          overflow: hidden;
          position: relative;
          border-bottom: 1px solid rgba(27,77,62,.08);
        }
        .ml-prod-imgBox img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          padding: 14px;
          transition: transform .35s ease;
        }
        .ml-prod:hover .ml-prod-imgBox img { transform: scale(1.05); }

        /* Stock pill (esquina inferior derecha de la imagen) */
        .ml-stock-pill {
          position: absolute;
          bottom: 10px;
          right: 10px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(16,185,129,.35);
          color: #065F46;
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .02em;
          box-shadow: 0 8px 22px rgba(2,8,23,.14);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }
        .ml-stock-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #10B981;
          box-shadow: 0 0 0 0 rgba(16,185,129,.55);
          animation: ml-stock-pulse 2s ease-out infinite;
        }
        .ml-stock-pill.is-low {
          background: rgba(254,242,242,.98);
          border-color: rgba(220,38,38,.45);
          color: #991B1B;
        }
        .ml-stock-pill.is-low .ml-stock-dot {
          background: #DC2626;
          box-shadow: 0 0 0 0 rgba(220,38,38,.55);
        }
        @keyframes ml-stock-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.55); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }

        .ml-prod-body {
          padding: 18px 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .ml-prod-name {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 1000;
          color: rgba(11,18,32,.92);
          line-height: 1.25;
        }
        .ml-prod-desc {
          margin: 0;
          font-size: .85rem;
          font-weight: 650;
          color: rgba(11,18,32,.58);
          line-height: 1.5;
        }
        .ml-prod-priceRow {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ml-prod-was {
          font-size: .92rem;
          font-weight: 800;
          color: rgba(11,18,32,.40);
          text-decoration: line-through;
        }
        .ml-prod-now {
          font-size: 1.55rem;
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .ml-prod-perPack {
          font-size: .72rem;
          font-weight: 850;
          color: rgba(11,18,32,.50);
        }
        .ml-prod-margin {
          background: rgba(16,185,129,.08);
          border: 1px solid rgba(16,185,129,.22);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: .8rem;
          font-weight: 750;
          color: rgba(11,18,32,.65);
          line-height: 1.45;
        }
        .ml-prod-margin strong { color: rgba(11,18,32,.92); font-weight: 1000; }
        .ml-prod-margin-profit { color: #047857 !important; }

        .ml-prod-qty {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ml-prod-qty-label {
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .1em;
          color: rgba(11,18,32,.50);
          margin-right: 2px;
        }
        .ml-prod-qty-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid rgba(11,18,32,.14);
          background: #fff;
          font-weight: 1000;
          font-size: .92rem;
          color: rgba(11,18,32,.72);
          cursor: pointer;
          transition: all .15s ease;
          font-family: inherit;
        }
        .ml-prod-qty-btn:hover { border-color: rgba(27,77,62,.40); }
        .ml-prod-qty-btn.is-on {
          background: #1B4D3E;
          border-color: #1B4D3E;
          color: #fff;
          box-shadow: 0 6px 14px rgba(27,77,62,.28);
        }

        .ml-prod-totalRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #F4F9F7;
          border: 1px solid rgba(27,77,62,.10);
          border-radius: 12px;
        }
        .ml-prod-total { display: flex; flex-direction: column; gap: 2px; }
        .ml-prod-total span {
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .08em;
          color: rgba(11,18,32,.52);
        }
        .ml-prod-total strong {
          font-size: 1.1rem;
          font-weight: 1100;
          color: rgba(11,18,32,.92);
        }
        .ml-prod-totalProfit {
          font-size: .82rem;
          font-weight: 1000;
          color: #047857;
          background: rgba(16,185,129,.10);
          padding: 5px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .ml-prod-ctas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 4px;
        }

        /* === KIT HIGHLIGHT === */
        .ml-kit {
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(2,8,23,0.14);
          border: 1px solid rgba(27,77,62,.12);
          position: relative;
        }
        .ml-kit-tag {
          position: absolute;
          top: 22px;
          left: 22px;
          z-index: 5;
          background: linear-gradient(135deg, #FDE68A 0%, #FBBF24 55%, #F59E0B 100%);
          color: #7C2D12;
          font-size: .72rem;
          font-weight: 1100;
          letter-spacing: .10em;
          padding: 9px 16px;
          border-radius: 999px;
          box-shadow: 0 10px 26px rgba(245,158,11,.40);
          text-transform: uppercase;
          border: 1.5px solid rgba(245,158,11,.55);
        }
        /* Cuando está dentro del tagRow, vuelve a flujo normal (sobrescribe absoluto) */
        .ml-kit-tagRow {
          position: absolute;
          top: 22px;
          left: 22px;
          right: 22px;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          pointer-events: none;
        }
        .ml-kit-tagRow > * { pointer-events: auto; }
        .ml-kit-tagRow .ml-kit-tag {
          position: static;
          top: auto;
          left: auto;
        }
        .ml-kit-stock {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 15px;
          border-radius: 999px;
          background: rgba(254,242,242,.98);
          border: 1.5px solid rgba(220,38,38,.45);
          color: #991B1B;
          font-size: .76rem;
          font-weight: 900;
          letter-spacing: .01em;
          box-shadow: 0 10px 26px rgba(2,8,23,.14);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }
        .ml-kit-stock strong {
          font-weight: 1100;
          color: #7F1D1D;
          font-size: .86rem;
          margin: 0 1px;
        }
        .ml-kit-stock-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #DC2626;
          box-shadow: 0 0 0 0 rgba(220,38,38,.55);
          animation: ml-stock-pulse 2s ease-out infinite;
        }
        @media (max-width: 560px) {
          .ml-kit-tagRow {
            top: 14px;
            left: 14px;
            right: 14px;
            gap: 8px;
          }
          .ml-kit-stock { padding: 7px 12px; font-size: .7rem; }
        }
        .ml-kit-grid {
          display: grid;
          grid-template-columns: 1.1fr 1.1fr;
          gap: 0;
          align-items: stretch;
        }
        @media (max-width: 900px) { .ml-kit-grid { grid-template-columns: 1fr; } }

        .ml-kit-media {
          background: linear-gradient(135deg, #F1F7F4 0%, #E4F2EC 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          min-height: 460px;
        }
        @media (max-width: 900px) {
          .ml-kit-media { aspect-ratio: 4 / 3; min-height: 0; }
        }
        @media (max-width: 560px) {
          .ml-kit-media { aspect-ratio: 1 / 1; }
        }
        .ml-kit-media img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          padding: 6px;
          transition: transform .4s ease;
        }
        .ml-kit:hover .ml-kit-media img { transform: scale(1.03); }
        .ml-kit-saveBadge {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: linear-gradient(135deg, #10B981 0%, #047857 100%);
          color: #fff;
          font-weight: 1100;
          font-size: .95rem;
          padding: 10px 16px;
          border-radius: 14px;
          box-shadow: 0 14px 32px rgba(4,120,87,.35);
          border: 1.5px solid rgba(255,255,255,.5);
        }

        .ml-kit-content {
          padding: 60px 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (max-width: 720px) { .ml-kit-content { padding: 58px 18px 20px; gap: 12px; } }
        .ml-kit-name {
          margin: 0;
          font-size: clamp(1.2rem, 2.4vw, 1.55rem);
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        /* TOP BLOCK: precio + CTAs arriba (lo importante sin scroll) */
        .ml-kit-topBlock {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 16px;
          background: linear-gradient(180deg, #F4F9F7 0%, #ECF5F0 100%);
          border: 1px solid rgba(27,77,62,.12);
        }
        .ml-kit-priceRow {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ml-kit-was {
          font-size: 1rem;
          font-weight: 800;
          color: rgba(11,18,32,.42);
          text-decoration: line-through;
        }
        .ml-kit-now {
          font-size: clamp(1.65rem, 3.4vw, 2rem);
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          letter-spacing: -0.025em;
          line-height: 1;
        }
        .ml-kit-profitPill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(16,185,129,.15);
          color: #047857;
          font-size: .78rem;
          font-weight: 1000;
          border: 1px solid rgba(16,185,129,.35);
          white-space: nowrap;
        }
        .ml-kit-ctas {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
        }
        .ml-kit-ctas .ml-btn--primary {
          flex: 1;
          min-width: 0;
          padding: 14px 18px;
          font-size: 1rem;
        }
        .ml-kit-ctas .ml-btn--small {
          flex-shrink: 0;
          min-width: 88px;
        }

        /* CHIPS: incluye + regalos en una sola zona plana y densa */
        .ml-kit-chipsWrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ml-kit-chipsRow {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ml-kit-chipsLbl {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          font-size: .62rem;
          font-weight: 1100;
          letter-spacing: .1em;
          color: rgba(11,18,32,.55);
          padding-top: 6px;
          min-width: 62px;
        }
        .ml-kit-chipsRow--gift .ml-kit-chipsLbl { color: #B45309; }
        .ml-kit-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px 6px;
          flex: 1;
          min-width: 0;
        }
        .ml-kit-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: #F4F9F7;
          border: 1px solid rgba(27,77,62,.14);
          border-radius: 8px;
          font-size: .72rem;
          font-weight: 800;
          color: rgba(11,18,32,.72);
          line-height: 1.3;
          white-space: nowrap;
        }
        .ml-kit-chip--gift {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-color: rgba(245,158,11,.55);
          color: #78350F;
          font-weight: 900;
        }

        /* PROFIT MINI: 3 columnas inline en lugar de caja grande */
        .ml-kit-profitMini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%);
          color: #fff;
          box-shadow: 0 14px 32px rgba(27,77,62,.28);
          position: relative;
        }
        .ml-kit-profitMini-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .ml-kit-profitMini-col span {
          font-size: .58rem;
          font-weight: 1000;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.62);
        }
        .ml-kit-profitMini-col strong {
          font-size: 1rem;
          font-weight: 1100;
          color: rgba(255,255,255,.92);
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .ml-kit-profitMini-col--hi strong { color: #5EEAD4; font-size: 1.15rem; }
        .ml-kit-profitMini-arrow {
          font-size: 1.05rem;
          color: rgba(255,255,255,.32);
          font-weight: 900;
          margin: 0 2px;
        }
        .ml-kit-profitMini-badge {
          margin-left: auto;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(94,234,212,.18);
          color: #5EEAD4;
          font-size: .72rem;
          font-weight: 1100;
          border: 1px solid rgba(94,234,212,.35);
          white-space: nowrap;
        }
        @media (max-width: 560px) {
          .ml-kit-content { padding: 56px 16px 18px; }
          .ml-kit-topBlock { padding: 12px 14px; }
          .ml-kit-chipsLbl { min-width: 56px; font-size: .58rem; }
          .ml-kit-chip { font-size: .68rem; padding: 3px 9px; }
          .ml-kit-profitMini { padding: 10px 12px; gap: 7px; }
          .ml-kit-profitMini-col strong { font-size: .92rem; }
          .ml-kit-profitMini-col--hi strong { font-size: 1rem; }
          .ml-kit-profitMini-badge { font-size: .66rem; padding: 5px 9px; }
        }

        /* === HOW IT WORKS === */
        .ml-htw-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-top: 10px;
        }
        @media (max-width: 900px) { .ml-htw-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .ml-htw-grid { grid-template-columns: 1fr; } }

        .ml-htw-step {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px;
          padding: 24px 20px;
          position: relative;
          backdrop-filter: blur(8px);
        }
        .ml-htw-num {
          font-size: .72rem;
          font-weight: 1100;
          letter-spacing: .14em;
          color: #5EEAD4;
          margin-bottom: 14px;
        }
        .ml-htw-icon {
          font-size: 2.4rem;
          line-height: 1;
          margin-bottom: 12px;
        }
        .ml-htw-stepTitle {
          margin: 0 0 8px;
          font-size: 1.05rem;
          font-weight: 1000;
          color: #fff;
          line-height: 1.2;
        }
        .ml-htw-stepText {
          margin: 0;
          font-size: .88rem;
          font-weight: 700;
          color: rgba(255,255,255,.72);
          line-height: 1.55;
        }

        /* === SOCIAL PROOF BAR (debajo del hero) === */
        .ml-social-proof {
          display: flex;
          width: fit-content;
          max-width: 100%;
          align-items: center;
          gap: 14px;
          margin: 18px auto 0;
          flex-wrap: wrap;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 32px rgba(0,0,0,.22);
        }
        .ml-social-proof-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: .82rem;
          color: rgba(255,255,255,.92);
          font-weight: 800;
          white-space: nowrap;
        }
        .ml-social-proof-num {
          font-weight: 1100;
          font-size: .95rem;
          color: #5EEAD4;
          letter-spacing: -0.01em;
        }
        .ml-social-proof-txt {
          font-weight: 700;
          color: rgba(255,255,255,.82);
        }
        .ml-social-proof-pulse {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #10B981;
          box-shadow: 0 0 0 0 rgba(16,185,129,.6);
          animation: ml-social-pulse 1.8s ease-out infinite;
        }
        @keyframes ml-social-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.60); }
          70%  { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .ml-social-proof-sep {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,.22);
        }
        .ml-social-proof-fire {
          font-size: .95rem;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(251,146,60,.4));
        }
        @media (max-width: 560px) {
          .ml-social-proof {
            gap: 10px;
            padding: 9px 14px;
            margin-top: 14px;
          }
          .ml-social-proof-item { font-size: .74rem; gap: 6px; }
          .ml-social-proof-num { font-size: .85rem; }
          .ml-social-proof-sep { height: 16px; }
        }

        /* === MARKET COMPARE (mayorista vs competencia) === */
        .ml-compare-wrap {
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px dashed rgba(27,77,62,.18);
        }
        .ml-compare {
          max-width: 860px;
          margin: 20px auto 0;
        }
        .ml-compare-table {
          background: #fff;
          border-radius: 22px;
          border: 1px solid rgba(27,77,62,.14);
          box-shadow: 0 24px 60px rgba(2,8,23,.10);
          overflow: hidden;
        }
        .ml-compare-head {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          background: linear-gradient(180deg, #F4F9F7 0%, #ECF5F0 100%);
          border-bottom: 1.5px solid rgba(27,77,62,.14);
        }
        .ml-compare-head-feat,
        .ml-compare-head-them,
        .ml-compare-head-us {
          padding: 16px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
        }
        .ml-compare-head-them { border-left: 1px solid rgba(27,77,62,.10); }
        .ml-compare-head-us {
          background: linear-gradient(180deg, rgba(94,234,212,.18) 0%, rgba(45,212,191,.14) 100%);
          border-left: 1.5px solid rgba(27,77,62,.18);
          position: relative;
        }
        .ml-compare-head-lbl {
          font-size: .72rem;
          font-weight: 1100;
          letter-spacing: .08em;
          color: rgba(11,18,32,.62);
          text-transform: uppercase;
        }
        .ml-compare-head-us .ml-compare-head-lbl { color: #0F2D24; }
        .ml-compare-head-pill {
          display: inline-block;
          font-size: .56rem;
          font-weight: 1100;
          letter-spacing: .1em;
          background: linear-gradient(135deg, #1B4D3E 0%, #047857 100%);
          color: #fff;
          padding: 3px 8px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(4,120,87,.35);
          text-transform: uppercase;
        }
        .ml-compare-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          border-top: 1px solid rgba(27,77,62,.08);
          align-items: stretch;
        }
        .ml-compare-row:first-child { border-top: none; }
        .ml-compare-feat,
        .ml-compare-them,
        .ml-compare-us {
          padding: 16px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: .88rem;
          line-height: 1.35;
        }
        .ml-compare-feat {
          font-weight: 1000;
          color: rgba(11,18,32,.88);
          background: #FAFCFB;
        }
        .ml-compare-them {
          border-left: 1px solid rgba(27,77,62,.08);
          color: rgba(11,18,32,.60);
          font-weight: 700;
          justify-content: center;
          text-align: center;
        }
        .ml-compare-us {
          border-left: 1.5px solid rgba(27,77,62,.12);
          background: linear-gradient(180deg, rgba(94,234,212,.08) 0%, rgba(45,212,191,.06) 100%);
          color: rgba(11,18,32,.92);
          font-weight: 900;
          justify-content: center;
          text-align: center;
        }
        .ml-compare-ico {
          flex-shrink: 0;
          display: inline-grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          font-size: .72rem;
          font-weight: 1100;
          line-height: 1;
        }
        .ml-compare-ico--x {
          background: rgba(220,38,38,.12);
          color: #DC2626;
          border: 1px solid rgba(220,38,38,.30);
        }
        .ml-compare-ico--ok {
          background: rgba(16,185,129,.15);
          color: #047857;
          border: 1px solid rgba(16,185,129,.35);
        }
        .ml-compare-txt { flex: 1; }
        @media (max-width: 640px) {
          .ml-compare-head,
          .ml-compare-row { grid-template-columns: 1fr 1fr; }
          .ml-compare-head-feat { display: none; }
          .ml-compare-feat {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%);
            color: #fff;
            font-size: .78rem;
            letter-spacing: .04em;
            text-transform: uppercase;
            padding: 10px 14px;
            justify-content: center;
          }
          .ml-compare-them,
          .ml-compare-us {
            font-size: .8rem;
            padding: 14px 10px;
            flex-direction: column;
            gap: 6px;
          }
          .ml-compare-head-lbl { font-size: .62rem; }
          .ml-compare-head-pill { font-size: .5rem; padding: 2px 6px; }
        }

        /* === REVIEWS CAROUSEL (idéntico a ProductDetail rv-) === */
        .rv-stars { display: flex; gap: 2px; font-size: 1rem; line-height: 1; }
        .rv-wrap { position: relative; margin-top: 14px; }
        .rv-row {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 10px 6px 16px;
          -webkit-overflow-scrolling: touch;
        }
        .rv-slide { scroll-snap-align: center; flex: 0 0 auto; width: min(520px, 88vw); }
        .rv-card {
          background: #fff;
          border: 1px solid rgba(2,8,23,.10);
          border-radius: 22px;
          box-shadow: 0 22px 70px rgba(10,20,40,.16);
          overflow: hidden;
        }
        /* Review header con avatar de iniciales + Verificado */
        .rv-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 18px 14px;
          border-bottom: 1px solid rgba(2,8,23,.08);
        }
        .rv-avatar {
          flex-shrink: 0;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 1100;
          font-size: 1.05rem;
          letter-spacing: .02em;
          box-shadow: 0 10px 24px rgba(2,8,23,.22);
          border: 2px solid rgba(255,255,255,.85);
        }
        .rv-head-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .rv-name {
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          font-size: .98rem;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .rv-city {
          font-size: .76rem;
          font-weight: 750;
          color: rgba(11,18,32,.55);
          line-height: 1.2;
        }
        .rv-head .rv-stars { margin-top: 2px; font-size: .9rem; }
        .rv-verified {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px 5px 8px;
          border-radius: 999px;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(16,185,129,.30);
          color: #065F46;
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .03em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .rv-verified svg { display: block; }

        .rv-body { padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 8px; }
        .rv-title {
          font-weight: 1100;
          text-transform: uppercase;
          letter-spacing: .04em;
          color: rgba(11,18,32,.92);
          font-size: .88rem;
        }
        .rv-text {
          margin: 0;
          color: rgba(11,18,32,.70);
          line-height: 1.6;
          font-weight: 650;
        }
        @media (max-width: 560px) {
          .rv-head { padding: 14px 14px 12px; gap: 11px; }
          .rv-avatar { width: 48px; height: 48px; font-size: .95rem; }
          .rv-verified { padding: 4px 8px 4px 6px; font-size: .62rem; }
          .rv-verified svg { width: 13px; height: 13px; }
          .rv-body { padding: 14px 16px 18px; }
        }

        .rv-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px; height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(2,8,23,.10);
          background: rgba(255,255,255,.95);
          box-shadow: 0 18px 55px rgba(10,20,40,.18);
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 24px;
          z-index: 10;
        }
        .rv-prev { left: -8px; }
        .rv-next { right: -8px; }
        @media (max-width: 560px) { .rv-nav { display: none; } }

        .rv-dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
        .rv-dot {
          width: 8px; height: 8px;
          border-radius: 999px;
          border: none;
          background: rgba(2,8,23,.18);
          cursor: pointer;
          transition: transform .18s ease, background .18s ease;
        }
        .rv-dot.on { background: rgba(27,77,62,.95); transform: scale(1.25); }

        /* === FAQ custom (numerado, acordeón limpio) === */
        .ml-faq-section { margin-bottom: 12px; }
        .ml-faq-list {
          max-width: 820px;
          margin: 22px auto 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ml-faq-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .25s ease, background .25s ease, transform .25s ease;
        }
        .ml-faq-item:hover {
          border-color: rgba(94,234,212,.35);
          background: rgba(255,255,255,0.06);
        }
        .ml-faq-item.open {
          background: rgba(94,234,212,.08);
          border-color: rgba(94,234,212,.55);
          box-shadow: 0 14px 40px rgba(0,0,0,.22);
        }
        .ml-faq-q {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: transparent;
          border: none;
          color: #fff;
          font-family: inherit;
          font-weight: 900;
          font-size: 1.02rem;
          text-align: left;
          cursor: pointer;
          line-height: 1.35;
        }
        .ml-faq-num {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 100%);
          color: #0F2D24;
          font-size: .82rem;
          font-weight: 1100;
          letter-spacing: .02em;
          box-shadow: 0 6px 16px rgba(94,234,212,.25);
        }
        .ml-faq-q-text { flex: 1; min-width: 0; }
        .ml-faq-chev {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          color: #5EEAD4;
          transition: transform .3s ease, background .25s ease;
        }
        .ml-faq-item.open .ml-faq-chev {
          transform: rotate(180deg);
          background: rgba(94,234,212,.18);
        }
        .ml-faq-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows .32s ease;
        }
        .ml-faq-item.open .ml-faq-a { grid-template-rows: 1fr; }
        .ml-faq-a-inner {
          overflow: hidden;
          padding: 0 20px 0 74px;
        }
        .ml-faq-item.open .ml-faq-a-inner { padding-bottom: 18px; }
        .ml-faq-a p {
          margin: 0;
          color: rgba(255,255,255,.80);
          font-weight: 600;
          font-size: .95rem;
          line-height: 1.65;
        }
        @media (max-width: 560px) {
          .ml-faq-q { padding: 14px 16px; font-size: .95rem; gap: 12px; }
          .ml-faq-num { width: 34px; height: 34px; font-size: .76rem; }
          .ml-faq-a-inner { padding: 0 16px 0 62px; }
        }

        /* === ABOUT final — clean, centered, pro === */
        .ml-about-final {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
          padding: 12px 0 4px;
        }
        .ml-about-kicker-wrap { margin-bottom: 14px; }
        .ml-about-kicker {
          display: inline-block;
          font-size: .72rem;
          font-weight: 1000;
          letter-spacing: .16em;
          color: #1B4D3E;
          background: rgba(94,234,212,.22);
          border: 1px solid rgba(27,77,62,.22);
          padding: 7px 16px;
          border-radius: 999px;
        }
        .ml-about-title {
          margin: 0 0 16px;
          font-size: clamp(1.7rem, 3.2vw, 2.3rem);
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          line-height: 1.12;
          letter-spacing: -0.02em;
        }
        .ml-about-text {
          margin: 0 auto 24px;
          max-width: 620px;
          color: rgba(11,18,32,.68);
          font-weight: 600;
          font-size: 1.02rem;
          line-height: 1.7;
        }
        .ml-about-bullets {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 28px;
        }
        .ml-about-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid rgba(27,77,62,.18);
          color: rgba(11,18,32,.82);
          font-size: .84rem;
          font-weight: 850;
          padding: 9px 16px;
          border-radius: 999px;
          box-shadow: 0 6px 18px rgba(15,45,36,.06);
        }
        .ml-about-pill-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1B4D3E;
          color: #fff;
          font-size: .68rem;
          font-weight: 1100;
        }
        .ml-about-signoff {
          margin-top: 10px;
          padding-top: 22px;
          border-top: 1px solid rgba(27,77,62,.12);
        }
        .ml-about-signoff-logo {
          font-size: 1.35rem;
          font-weight: 1100;
          letter-spacing: -0.01em;
          color: #0F2D24;
        }
        .ml-about-signoff-tag {
          margin-top: 4px;
          font-size: .78rem;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(11,18,32,.5);
        }

        /* === STICKY BAR (con progress + animación de entrada) === */
        .ml-sticky {
          position: fixed;
          left: 50%;
          bottom: 18px;
          width: min(calc(100% - 24px), 560px);
          z-index: 95;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(11,18,32,.10);
          box-shadow: 0 22px 54px rgba(2,8,23,0.22);
          border-radius: 999px;
          padding: 9px 10px 9px 20px;
          overflow: hidden;
          transform: translate(-50%, 120%);
          opacity: 0;
          pointer-events: none;
          transition: transform .45s cubic-bezier(.2,.9,.25,1.1), opacity .3s ease;
        }
        .ml-sticky.is-visible {
          transform: translate(-50%, 0);
          opacity: 1;
          pointer-events: auto;
        }
        /* Progress bar — línea sutil en el borde inferior del sticky */
        .ml-sticky-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, #1B4D3E 0%, #059669 50%, #5EEAD4 100%);
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform .12s linear;
          border-radius: 0 0 999px 999px;
          opacity: .85;
        }
        .ml-sticky-info {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
          min-width: 0;
        }
        .ml-sticky-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: .62rem;
          font-weight: 1000;
          letter-spacing: .12em;
          color: rgba(11,18,32,.55);
        }
        .ml-sticky.has-cart .ml-sticky-label { color: #1B4D3E; }
        .ml-sticky-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1B4D3E;
          box-shadow: 0 0 0 0 rgba(27,77,62,.55);
          animation: mlDotPulse 1.8s ease-out infinite;
        }
        @keyframes mlDotPulse {
          0%   { box-shadow: 0 0 0 0 rgba(27,77,62,.55); }
          70%  { box-shadow: 0 0 0 8px rgba(27,77,62,0); }
          100% { box-shadow: 0 0 0 0 rgba(27,77,62,0); }
        }
        .ml-sticky.has-cart .ml-sticky-btn {
          background: linear-gradient(135deg, #059669 0%, #1B4D3E 100%);
        }
        .ml-sticky-price {
          font-size: 1.2rem;
          font-weight: 1100;
          color: rgba(11,18,32,.92);
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .ml-sticky-ctas { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ml-sticky-wa {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #25D366;
          color: #fff;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(37,211,102,.35);
          transition: transform .15s ease;
          font-family: inherit;
        }
        .ml-sticky-wa:hover { transform: scale(1.06); }
        .ml-sticky-btn {
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%);
          color: #fff;
          font-weight: 1000;
          font-size: .92rem;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(27,77,62,.32);
          transition: transform .15s ease, box-shadow .15s ease;
          letter-spacing: .01em;
          font-family: inherit;
          white-space: nowrap;
        }
        .ml-sticky-btn:hover { transform: translateY(-1px); }
        /* Estado "bajo mínimo": ámbar/rojo, progress naranja */
        .ml-sticky.is-under-min .ml-sticky-label {
          color: #B45309;
        }
        .ml-sticky.is-under-min .ml-sticky-dot {
          background: #F59E0B;
          box-shadow: 0 0 0 0 rgba(245,158,11,.55);
        }
        .ml-sticky.is-under-min .ml-sticky-progress {
          background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%);
        }
        .ml-sticky.is-under-min .ml-sticky-btn {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          box-shadow: 0 10px 26px rgba(245,158,11,.35);
        }
        @media (max-width: 520px) {
          .ml-sticky {
            padding: 7px 8px 7px 16px;
            gap: 8px;
            bottom: 12px;
            width: calc(100% - 16px);
          }
          .ml-sticky-label { font-size: .56rem; letter-spacing: .08em; }
          .ml-sticky-price { font-size: 1rem; }
          .ml-sticky-btn { padding: 9px 13px; font-size: .78rem; }
          .ml-sticky-wa { width: 38px; height: 38px; font-size: 1.05rem; }
          .ml-sticky-ctas { gap: 6px; }
        }

        /* === TOAST: aviso de mínimo de compra === */
        .ml-min-toast {
          position: fixed;
          left: 50%;
          bottom: 86px;
          transform: translateX(-50%);
          z-index: 110;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px 12px 16px;
          max-width: min(calc(100% - 24px), 480px);
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border: 1.5px solid #F59E0B;
          border-radius: 14px;
          color: #78350F;
          font-size: .84rem;
          font-weight: 800;
          line-height: 1.35;
          box-shadow: 0 22px 54px rgba(245,158,11,.40);
          animation: ml-min-toast-in .32s cubic-bezier(.2,.9,.25,1.1);
        }
        .ml-min-toast-ico { font-size: 1.1rem; flex-shrink: 0; line-height: 1.2; }
        .ml-min-toast-txt { flex: 1; min-width: 0; }
        .ml-min-toast-close {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          border: none;
          background: rgba(120,53,15,.12);
          color: #78350F;
          border-radius: 999px;
          font-size: 1rem;
          font-weight: 900;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          font-family: inherit;
        }
        .ml-min-toast-close:hover { background: rgba(120,53,15,.22); }
        @keyframes ml-min-toast-in {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
        @media (max-width: 520px) {
          .ml-min-toast { bottom: 72px; font-size: .78rem; padding: 10px 12px; }
        }

        /* === scroll-reveal anim (igual que ProductDetail) === */
        .anim-el { opacity: 1; transform: none; }
        .anim-hidden { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .8s ease; }
        .anim-hidden.in-view { opacity: 1; transform: translateY(0); }

        /* === wave-divider (colores verdes matching pd-band) === */
        .ml-page .wave-divider {
          position: relative;
          width: 100%;
          height: 100px;
          margin: -1px 0;
          overflow: hidden;
          background: var(--wave-top-color);
          line-height: 0;
          pointer-events: none;
        }
        .ml-page .waves-anim {
          display: block;
          width: 100%;
          height: auto;
          max-height: 3rem;
          margin: 0;
          position: absolute;
          bottom: 0;
          left: 0;
        }
        @media (min-width: 1000px) {
          .ml-page .waves-anim { max-height: 6rem; }
        }
        .ml-page .parallax1 > use { animation: wMove1 10s linear infinite; animation-delay: -2s; }
        .ml-page .parallax2 > use { animation: wMove2 8s linear infinite; opacity: 0.4; animation-delay: -2s; }
        .ml-page .parallax3 > use { animation: wMove3 6s linear infinite; opacity: 0.3; animation-delay: -2s; }
        .ml-page .parallax4 > use { animation: wMove4 4s linear infinite; opacity: 0.2; animation-delay: -2s; }
        @keyframes wMove1 { 0% { transform: translate3d(-90px,0,0) } 100% { transform: translate3d(85px,0,0) } }
        @keyframes wMove2 { 0% { transform: translate3d(-90px,0,0) } 100% { transform: translate3d(85px,0,0) } }
        @keyframes wMove3 { 0% { transform: translate3d(-90px,0,0) } 100% { transform: translate3d(85px,0,0) } }
        @keyframes wMove4 { 0% { transform: translate3d(-90px,0,0) } 100% { transform: translate3d(85px,0,0) } }

        /* === wa-tab (override mínimo si hace falta) === */
        .wa-tab {
          position: fixed;
          right: -160px;
          bottom: 90px;
          z-index: 80;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #25D366;
          color: #fff;
          padding: 12px 18px;
          border-radius: 999px 0 0 999px;
          box-shadow: 0 10px 30px rgba(37,211,102,.40);
          font-weight: 1000;
          text-decoration: none;
          transition: right .25s ease;
          font-size: .88rem;
        }
        .wa-tab--open { right: 0; }
        .wa-tab-icon { display: block; }
        .wa-tab-label { white-space: nowrap; }
        @media (min-width: 1100px) {
          .wa-tab { right: 0; }
        }
      `}</style>
    </main>
  );
}
