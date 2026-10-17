import { useRef, useState } from "react";
import MC from "../../../landings/mundial-revendedores.js";
import { responsiveImage } from "../../../utils/imageCdn";
import { SectionHeader } from "./LandingChrome";
import { FALLBACK_IMG, getStockFor, moneyARS } from "./utils";
import "./ProductCatalog.css";

/* =========================
   PRODUCT CARD
========================= */
export function ProductCard({ cfg, productData, onAdd, onBuy }) {
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
          {...responsiveImage(liveImg)}
          sizes="(min-width: 960px) 33vw, 100vw"
          alt={cfg.name}
          width={600}
          height={600}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.removeAttribute("srcset");
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
export function ProductCarousel({ group, products, onAdd, onBuy, light = false }) {
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
export function KitHighlight({ products, onBuyKit, onAddKit }) {
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
            {...responsiveImage(liveImg)}
            sizes="(min-width: 960px) 50vw, 100vw"
            alt={cfg.name}
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.removeAttribute("srcset");
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
