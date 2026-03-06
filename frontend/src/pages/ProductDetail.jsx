// frontend/src/pages/ProductDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";
import Marquee from "../components/marquee.jsx";
import { LANDING_CONFIGS } from "../landings/index.js";
import { CheckoutSheet } from "./CheckoutSheet";

/* ========================================================================
   MARKETING CONTENT — se carga dinámicamente desde src/landings/index.js
   El fallback es 'porta-cepillos' cuando se abre por /products/:id
   Para agregar un producto nuevo: copiá src/landings/porta-cepillos.js,
   editá los textos y registralo en src/landings/index.js
   ======================================================================== */
const MARKETING_CONTENT = LANDING_CONFIGS["porta-cepillos"] || {};


const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="24" fill="#cbd5e1">
      Imagen no disponible
    </text>
  </svg>
`);

function StarsInline({ rating = 5 }) {
  return (
    <span className="stars-inline" aria-label={`${rating} estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`s ${i < rating ? "on" : ""}`}>★</span>
      ))}
    </span>
  );
}

function formatARS(n) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function moneyARS(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

function clampPct(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(99, x));
}

/* =========================
   Countdown
========================= */
function CountdownTimer({ storageKey = "pd_countdown", minutes = 18 }) {
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

  return <span className="cd">{mm}:{ss}</span>;
}

/* =========================
   Sections
========================= */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="sec-head">
      <h2 className="sec-title">{title}</h2>
      {subtitle ? <div className="sec-sub">{subtitle}</div> : null}
    </div>
  );
}

function BoxContents({ mc = MARKETING_CONTENT }) {
  const items = mc.boxItems || [];
  if (!items.length) return null;

  return (
    <section className="boxc">
      <div className="boxc-header">
        <span className="boxc-header-icon">📦</span>
        <div>
          <div className="boxc-header-kicker">TODO INCLUIDO</div>
          <div className="boxc-header-title">¿Qué viene en la caja?</div>
        </div>
      </div>
      <div className="boxc-grid">
        {items.map((item, i) => (
          <div
            key={i}
            className="boxc-item"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="boxc-item-icon">{item.icon}</div>
            <div className="boxc-item-info">
              <div className="boxc-item-name">{item.name}</div>
              {item.qty && <div className="boxc-item-qty">{item.qty}</div>}
            </div>
            <div className="boxc-item-check">✓</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonTablePro({ mc = MARKETING_CONTENT }) {
  const { comparison } = mc;

  return (
    <section className="pd-block">
      <SectionHeader title={comparison.title} />

      <div className="cmp-desktop">
        <div className="cmp-wrap cmp-anim cols-2">
          <div className="cmp-head">
            <div className="cmp-k"></div>
            <div className="cmp-col cmp-a">{comparison.cols[0]}</div>
            <div className="cmp-col">{comparison.cols[1]}</div>
          </div>

          {comparison.rows.map((r, i) => (
            <div key={i} className="cmp-row">
              <div className="cmp-k">{r.k}</div>
              <div className="cmp-col cmp-a">{r.a}</div>
              <div className="cmp-col">{r.b}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cmp-mobile">
        <div className="cmp-cards">
          {comparison.rows.map((r, i) => (
            <div key={i} className="cmp-card">
              <div className="cmp-card-k">{r.k}</div>

              <div className="cmp-card-grid">
                <div className="cmp-pill">
                  <div className="cmp-pill-label">{comparison.cols[0]}</div>
                  <div className="cmp-pill-val">{r.a}</div>
                </div>

                <div className="cmp-pill good">
                  <div className="cmp-pill-label">{comparison.cols[1]}</div>
                  <div className="cmp-pill-val">{r.b}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToSteps({ mc = MARKETING_CONTENT }) {
  const { howTo } = mc;

  return (
    <section className="pd-block" id="howto">
      <SectionHeader title={howTo.title} />

      <div className="how-imgWrap hover-float">
        <img
          src={howTo.image?.url}
          alt={howTo.image?.alt || howTo.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
      </div>
    </section>
  );
}

function AuthorityCard({ mc = MARKETING_CONTENT }) {
  const auth = mc.authority || {};
  if (!auth.show || !auth.quote) return null;

  const { photo, name, role, quote, disclaimer } = auth;

  return (
    <section className="pd-block" id="authority">
      <SectionHeader
        title="LO QUE DICEN LOS PROFESIONALES"
        subtitle="Recomendación de expertos"
      />

      <div className="auth2">
        <div className="auth2-body">
          <span className="auth2-qq" aria-hidden="true">❝</span>
          <p className="auth2-quote">{quote}</p>
        </div>

        <div className="auth2-foot">
          <img
            className="auth2-avatar"
            src={photo}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="auth2-meta">
            <div className="auth2-name">{name}</div>
            <div className="auth2-role">{role}</div>
          </div>
          <div className="auth2-badge">
            <span className="auth2-badge-dot" aria-hidden="true" />
            Verificado
          </div>
        </div>

        <div className="auth2-disclaimer">{disclaimer}</div>
      </div>
    </section>
  );
}

function FaqSectionPro({ mc = MARKETING_CONTENT }) {
  const [openIndex, setOpenIndex] = useState(null);
  const { faq, faqTitle } = mc;

  return (
    <section className="pd-block" id="faq-section">
      <SectionHeader title={faqTitle} />
      <div className="faq-pro">
        {faq.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`faq-pro-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="faq-pro-q"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-pro-ico" aria-hidden="true" />
              </button>
              <div className="faq-pro-a">
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StoryBlocks({ mc = MARKETING_CONTENT }) {
  const blocks = mc.storyBlocks;
  return (
    <section className="pd-flow">
      {blocks.map((b, i) => (
        <div key={i} className="flow-row">
          <div className="flow-text">
            {b.badge && <div className="flow-badge">{b.badge}</div>}
            <h3 className="flow-title">{b.title}</h3>
            <p className="flow-p">{b.text}</p>
          </div>

          <div className="flow-media">
            <div className="flow-imgBox hover-float">
              <img
                src={b.img}
                alt={b.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function MiniReviewsBar({ productImg, mc = MARKETING_CONTENT }) {
  const data = (mc.reviewsCarousel || []).slice(0, 5);
  const [active, setActive] = useState(0);

  const go = (idx) => {
    if (!data.length) return;
    const n = data.length;
    setActive((idx + n) % n);
  };

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => go(active + 1), 7000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, data.length]);

  if (!data.length) return null;

  return (
    <div className="mrb">
      <div className="mrb-section-header">
        <span className="mrb-section-badge">⭐</span>
        <span className="mrb-section-title">Lo que dicen otros compradores</span>
      </div>
      <div className="mrb-viewport">
        <div
          className="mrb-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {data.map((r, i) => {
            const avatar = r.img || productImg || FALLBACK_IMG;
            return (
              <div className="mrb-slide" key={i}>
                <div className="mrb-card">
                  <div className="mrb-header">
                    <img
                      className="mrb-avatar"
                      src={avatar}
                      alt={r.name || "Cliente"}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                    <div className="mrb-header-info">
                      <div className="mrb-name">{r.name}</div>
                      <div className="mrb-stars">
                        <StarsInline rating={r.rating || 5} />
                      </div>
                    </div>
                  </div>

                  {r.title && <div className="mrb-title">{r.title}</div>}
                  <div className="mrb-text">{r.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mrb-nav">
        <button type="button" className="mrb-arrow" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div className="mrb-dots">
          {data.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`mrb-dot ${i === active ? "on" : ""}`}
              onClick={() => go(i)}
              aria-label={`Ir a reseña ${i + 1}`}
            />
          ))}
        </div>

        <button type="button" className="mrb-arrow" onClick={() => go(active + 1)} aria-label="Siguiente">
          ›
        </button>
      </div>
    </div>
  );
}

function ReviewsCarouselPro({ productImg, mc = MARKETING_CONTENT }) {
  const data = mc.reviewsCarousel;
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  const go = (idx) => {
    const n = data.length;
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
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  };

  return (
    <section className="pd-block" id="reviews-section">
      <SectionHeader title={mc.reviewsTitle} subtitle={mc.reviewsSubtitle} />

      <div className="rv-wrap">
        <button type="button" className="rv-nav rv-prev" onClick={() => go(active - 1)} aria-label="Anterior">
          ‹
        </button>

        <div className="rv-row" ref={rowRef} onScroll={onScroll}>
          {data.map((r, i) => {
            const img = r.img || productImg || FALLBACK_IMG;
            return (
              <article key={i} className="rv-slide">
                <div className="rv-card">
                  <div className="rv-imgBox">
                    <img
                      src={img}
                      alt={r.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                    <div className="rv-quote">❞</div>
                  </div>

                  <div className="rv-body">
                    <StarsInline rating={r.rating} />
                    <div className="rv-title">{r.title}</div>
                    <p className="rv-text">{r.text}</p>
                    <div className="rv-name">{r.name}</div>
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
        {data.map((_, i) => (
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

function AboutSection({ mc = MARKETING_CONTENT }) {
  const { about, soldCount, reviewScore, reviewCount } = mc;

  const stats = [
    { value: soldCount  ? `+${soldCount}`              : "+500",  label: "Ventas realizadas"   },
    { value: reviewScore ? `${reviewScore} ⭐`          : "4.8 ⭐", label: "Calificación promedio" },
    { value: reviewCount ? `+${reviewCount}`            : "+100",  label: "Reseñas verificadas" },
  ];

  return (
    <section className="about2" id="about">
      <div className="about2-top">
        <div className="about2-brand">
          <span className="about2-live-dot" aria-hidden="true" />
          <span className="about2-brand-name">BoomHausS</span>
        </div>
        <p className="about2-tagline">Productos que realmente funcionan</p>
      </div>

      <div className="about2-hero">
        <img
          className="about2-img"
          src={about.img}
          alt="BoomHausS equipo"
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <div className="about2-overlay">
          <p className="about2-quote">{about.text}</p>
        </div>
      </div>

      <div className="about2-stats">
        {stats.map((s, i) => (
          <div key={i} className="about2-stat">
            <div className="about2-stat-val">{s.value}</div>
            <div className="about2-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="about2-pills">
        {about.bullets.map((b, i) => (
          <div key={i} className="about2-pill">{b}</div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   Upsell Sheet — aparece antes del checkout
========================= */
function UpsellSheet({ mc, mainProduct, onConfirm }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);
  const { upsell } = mc;
  const [accProducts, setAccProducts] = useState({});
  const [done, setDone] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Animar entrada
  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      sheetRef.current?.classList.add("ups-sheet--open");
      backdropRef.current?.classList.add("ups-backdrop--open");
    });
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fetch accesorios
  useEffect(() => {
    if (!upsell?.items?.length) return;
    let cancelled = false;
    async function fetchAll() {
      const results = await Promise.all(
        upsell.items.map(async (item) => {
          try {
            const res = await api.get(`/products/slug/${item.slug}`);
            return [item.slug, res.data?.ok ? res.data.data : null];
          } catch { return [item.slug, null]; }
        })
      );
      if (!cancelled) { setAccProducts(Object.fromEntries(results)); setDone(true); }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [upsell]);

  function animateClose(cb) {
    sheetRef.current?.classList.remove("ups-sheet--open");
    backdropRef.current?.classList.remove("ups-backdrop--open");
    setTimeout(cb, 340);
  }



  const handleToggle = (idx) => setSelectedIdx((p) => p === idx ? null : idx);

  const selectedItem = selectedIdx !== null ? upsell.items[selectedIdx] : null;
  const selectedAcc  = selectedItem ? accProducts[selectedItem.slug] : null;
  const mainPrice    = mainProduct?.price ?? 0;
  const mainCompareAt = mainProduct?.originalPrice || mainProduct?.compareAtPrice || mainPrice;
  const accPrice     = selectedAcc?.price ?? selectedItem?.fallbackPrice ?? 0;
  const accCompareAt = selectedAcc?.originalPrice || selectedAcc?.compareAtPrice || selectedItem?.fallbackCompareAt || accPrice;
  const bundleTotal  = mainPrice + accPrice;
  const bundleSaving = (mainCompareAt + accCompareAt) - bundleTotal;

  const confirm = (withBundle) => {
    animateClose(() => {
      onConfirm(withBundle && selectedIdx !== null ? { item: selectedItem, accProduct: selectedAcc } : null);
    });
  };

  return (
    <>
      <div ref={backdropRef} className="ups-backdrop" onClick={() => confirm(false)} aria-hidden="true" />
      <div ref={sheetRef} className="ups-sheet" role="dialog" aria-modal="true" aria-label="Agregá un extra">
        <div className="ups-sheet-scroll">
          {/* Cabecera */}
          <div className="ups-sheet-head">
            <div className="ups-sheet-promo-banner">
              <span className="ups-sheet-promo-icon">🏷️</span>
              <span className="ups-sheet-promo-text">DESCUENTOS EXCLUSIVOS PARA TU COMPRA</span>
            </div>
            <h2 className="ups-sheet-title">{upsell.title || "¿Querés agregar algo?"}</h2>
            <p className="ups-sheet-sub">Mismo envío · ahorrás más llevando los dos</p>
          </div>

          {/* Lista */}
          <div className="ups-list">
            {(upsell.items || []).map((item, idx) => {
              const acc     = accProducts[item.slug];
              const aPrice  = acc?.price ?? item.fallbackPrice ?? 0;
              const aCmpAt  = acc?.originalPrice || acc?.compareAtPrice || item.fallbackCompareAt || aPrice;
              const aImg    = acc?.imageUrl || item.fallbackImage || FALLBACK_IMG;
              const saving  = aCmpAt - aPrice;
              const isSel   = selectedIdx === idx;
              return (
                <div key={idx} className={`ups-row${isSel ? " ups-row--on" : ""}`}
                  onClick={() => done && handleToggle(idx)}>
                  <img src={aImg} alt={item.name} className="ups-row-img"
                    referrerPolicy="no-referrer" crossOrigin="anonymous"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
                  <div className="ups-row-info">
                    {item.badge && <span className="ups-row-badge">{item.badge}</span>}
                    <p className="ups-row-name">{item.name}</p>
                    <div className="ups-row-prices">
                      {saving > 0 && <s className="ups-row-was">{moneyARS(aCmpAt)}</s>}
                      <span className="ups-row-now">{moneyARS(aPrice)}</span>
                      {saving > 0 && <span className="ups-row-save">−{moneyARS(saving)}</span>}
                    </div>
                  </div>
                  <button type="button" aria-label={isSel ? "Quitar" : "Agregar"}
                    className={`ups-row-btn${isSel ? " ups-row-btn--on" : ""}`}
                    disabled={!done}
                    onClick={(e) => { e.stopPropagation(); done && handleToggle(idx); }}>
                    {isSel ? "✓" : "+"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="ups-sheet-ctas">
            {selectedIdx !== null ? (
              <>
                <button type="button" className="ups-sheet-btn-main" onClick={() => confirm(true)}>
                  Agregar y pagar — {moneyARS(bundleTotal)}
                  {bundleSaving > 0 && <span className="ups-sheet-btn-save"> · ahorrás {moneyARS(bundleSaving)}</span>}
                </button>
                <button type="button" className="ups-sheet-btn-skip" onClick={() => confirm(false)}>
                  No gracias, solo el producto
                </button>
              </>
            ) : (
              <button type="button" className="ups-sheet-btn-skip ups-sheet-btn-skip--solo" onClick={() => confirm(false)}>
                Continuar sin agregar →
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ups-backdrop { position:fixed; inset:0; background:rgba(11,17,32,0); z-index:10000; transition:background .30s ease; }
        .ups-backdrop--open { background:rgba(11,17,32,.65); backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px); }
        .ups-sheet { position:fixed; top:50%; left:50%; z-index:10001; background:#fff; border-radius:22px; box-shadow:0 24px 80px rgba(11,17,32,.28); width:calc(100% - 32px); max-width:420px; max-height:90dvh; max-height:90vh; display:flex; flex-direction:column; opacity:0; transform:translate(-50%,-50%) scale(.95); transition:opacity .28s ease, transform .28s cubic-bezier(.22,1,.36,1); will-change:transform,opacity; pointer-events:none; }
        .ups-sheet--open { opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto; }
        .ups-sheet-scroll { overflow-y:auto; flex:1; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:20px 18px 24px; }
        .ups-sheet-scroll::-webkit-scrollbar { display:none; }
        .ups-sheet-head { text-align:center; padding:0 0 18px; }
        .ups-sheet-promo-banner { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg,#ff6b00 0%,#ff9500 100%); color:#fff; font-size:.67rem; font-weight:900; letter-spacing:.1em; padding:5px 13px; border-radius:100px; margin-bottom:10px; box-shadow:0 4px 14px rgba(255,107,0,.35); }
        .ups-sheet-promo-icon { font-size:.85rem; line-height:1; }
        .ups-sheet-promo-text { line-height:1; }
        .ups-sheet-title { font-size:1.15rem; font-weight:900; margin:0 0 4px; }
        .ups-sheet-sub { font-size:.78rem; color:rgba(11,18,32,.45); margin:0; font-weight:600; }
        .ups-sheet-ctas { display:flex; flex-direction:column; gap:10px; margin-top:20px; }
        .ups-sheet-btn-main { width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(135deg,#1a6dff 0%,#0b5cff 60%,#0046e0 100%); color:#fff; font-weight:900; font-size:.97rem; letter-spacing:.03em; cursor:pointer; box-shadow:0 8px 28px rgba(11,92,255,.32); transition:transform .12s,box-shadow .12s; }
        .ups-sheet-btn-main:active { transform:scale(.98); box-shadow:0 4px 14px rgba(11,92,255,.22); }
        .ups-sheet-btn-save { font-size:.78rem; font-weight:700; opacity:.85; }
        .ups-sheet-btn-skip { width:100%; padding:12px; border:1.5px solid rgba(11,18,32,.15); border-radius:12px; background:none; color:rgba(11,18,32,.60); font-size:.88rem; font-weight:700; cursor:pointer; text-align:center; transition:border-color .15s,color .15s; }
        .ups-sheet-btn-skip:hover { border-color:rgba(11,18,32,.30); color:rgba(11,18,32,.80); }
        .ups-sheet-btn-skip--solo { border-color:rgba(11,18,32,.18); color:rgba(11,18,32,.65); font-size:.92rem; padding:13px; }
      `}</style>
    </>
  );
}

const WavesDivider = ({ fill = "#F8FBFF" }) => (
  <>
    <svg className="pd-wl pd-wl--1" viewBox="0 0 1800 80" preserveAspectRatio="none" aria-hidden="true">
      <path fill={fill} fillOpacity="0.25"
        d="M0,40 C100,65 200,15 300,40 C400,65 500,15 600,40 C700,65 800,15 900,40 C1000,65 1100,15 1200,40 C1300,65 1400,15 1500,40 C1600,65 1700,15 1800,40 V80 H0 Z" />
    </svg>
    <svg className="pd-wl pd-wl--2" viewBox="0 0 1800 80" preserveAspectRatio="none" aria-hidden="true">
      <path fill={fill} fillOpacity="0.50"
        d="M0,55 C150,25 300,70 450,55 C600,40 750,70 900,55 C1050,25 1200,70 1350,55 C1500,40 1650,70 1800,55 V80 H0 Z" />
    </svg>
    <svg className="pd-wl pd-wl--3" viewBox="0 0 1800 80" preserveAspectRatio="none" aria-hidden="true">
      <path fill={fill} fillOpacity="1"
        d="M0,60 C300,20 600,80 900,60 C1200,20 1500,80 1800,60 V80 H0 Z" />
    </svg>
  </>
);

const Band = ({
  variant = "light",
  topFill,
  bottomFill,
  noTop = false,
  noBottom = false,
  children,
}) => {
  return (
    <section className={`pd-band pd-band--${variant}`}>
      {!noTop && (
        <div className="pd-wave pd-wave--top">
          <WavesDivider fill={topFill} />
        </div>
      )}

      <div className="container pd-band-inner">{children}</div>

      {!noBottom && (
        <div className="pd-wave pd-wave--bottom">
          <WavesDivider fill={bottomFill} />
        </div>
      )}
    </section>
  );
};

/* =========================
   Main
========================= */
export default function ProductDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // ✅ Config dinámica: si viene de /lp/:slug usa esa config, si no usa la de porta-cepillos
  const MC = (slug && LANDING_CONFIGS[slug]) || MARKETING_CONTENT;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [bundle, setBundle] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUpsellSheet, setShowUpsellSheet] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 40;
  const lastViewedRef = useRef(null);

  useEffect(() => {
    async function fetchOne() {
      try {
        setLoading(true);
        // ✅ Soporte /lp/:slug (por slug) y /products/:id (por id)
        // MC.productSlug permite que el slug de la URL difiera del slug del producto en admin
        const fetchSlug = slug ? (MC.productSlug || slug) : null;
        const res = fetchSlug
          ? await api.get(`/products/slug/${fetchSlug}`)
          : await api.get(`/products/${id}`);
        if (res.data?.ok) setProduct(res.data.data);
        else setError(slug
          ? `Producto no encontrado. Asegurate de que el producto tenga el slug "${slug}" en el panel de administración (Admin → Productos → Editar → campo Slug).`
          : "No se pudo cargar el producto.");
      } catch (err) {
        const is404 = err?.response?.status === 404;
        setError(slug && is404
          ? `Producto no encontrado con slug "${slug}". Abrí Admin → Productos, editá el producto y setéalo como slug.`
          : err?.response?.data?.message || "Error al cargar el producto.");
      } finally {
        setLoading(false);
      }
    }
    fetchOne();
  }, [id, slug]);

  const images = useMemo(() => {
    if (!product) return [];
    const arr = [];
    if (product.imageUrl) arr.push(product.imageUrl);
    if (Array.isArray(product.images)) {
      product.images.forEach((x) => {
        if (x && typeof x === "string" && !arr.includes(x)) arr.push(x);
      });
    }
    return arr;
  }, [product]);

  const nextImage = () => {
    if (images.length > 0) setActiveImgIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    if (images.length > 0) setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextImage();
    if (distance < -minSwipeDistance) prevImage();
  };

  const price = Number(product?.price) || 0;

  const compareAt =
    Number(product?.originalPrice) ||
    Number(product?.compareAtPrice) ||
    60350;

  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 2105;

  const pack2Discount = 10;
  const unitPrice = price;

  const promoOn = bundle === 2;
  const totalQty = promoOn ? Math.max(2, qty) : 1;

  const displayTotal = promoOn
    ? Math.round(totalQty * unitPrice * (1 - pack2Discount / 100))
    : Math.round(totalQty * unitPrice);

  const oldTotal = Math.round(compareAt * totalQty);

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

    track("ViewContent", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(price) || 0,
      currency: "ARS",
    });
  }, [product, contentId, price]);

  const handleBuyNow = () => {
    if (!product) return;
    // Si hay config de upsell, mostrar el sheet de upsell primero
    if (MC.upsell) {
      setShowUpsellSheet(true);
      return;
    }
    // Sin upsell: ir directo al checkout
    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);
    track("InitiateCheckout", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(displayTotal) || 0,
      currency: "ARS",
      num_items: Number(totalQty) || 1,
    });
    setShowCheckout(true);
  };

  const handleUpsellConfirm = (bundle) => {
    setShowUpsellSheet(false);
    // Agregar producto principal
    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);
    // Si eligió un accesorio, agregarlo también
    if (bundle?.accProduct) addItem(bundle.accProduct, 1);
    track("InitiateCheckout", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(bundle ? displayTotal + (bundle.accProduct?.price ?? 0) : displayTotal) || 0,
      currency: "ARS",
      num_items: bundle?.accProduct ? totalQty + 1 : totalQty,
    });
    setShowCheckout(true);
  };

  const handleAddToCart = () => {
    if (!product) return;

    track("AddToCart", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(displayTotal) || 0,
      currency: "ARS",
      num_items: Number(totalQty) || 1,
    });

    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
    window.dispatchEvent(new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } }));
  };

  const scrollToReviews = (e) => {
    e.preventDefault();
    document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading)
    return (
      <main className="section">
        <div className="container">
          <div className="card">Cargando…</div>
        </div>
      </main>
    );

  if (error || !product)
    return (
      <main className="section">
        <div className="container">
          <div className="card pd-errorCard">
            <div className="pd-badge">Error</div>
            <p className="pd-error pd-errorText">{error || "Producto no encontrado."}</p>
            <div className="pd-errorActions">
              <Link className="btn btn-ghost" to="/products">
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </main>
    );

  // ✅ para el nuevo hero (como la captura)
  const discountPct = clampPct(Math.round((1 - unitPrice / compareAt) * 100));
  const heroViews = product?.viewingNow ?? product?.socialProofLive ?? 13;

  return (
    <main className="section main-wrapper pd-page">
      <div className="pd-page">
        <Marquee countdownKey={`pd_countdown_${id}`} />
      </div>

      <div className="container pd-container">
        <div className="pd-grid">
          {/* MEDIA */}
          <section className="card pd-media pd-media-sticky">
            <div
              className="pd-mediaMain pd-mediaMain--bigger"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {images.length > 0 ? (
                <img
                  className="pd-mainImg pd-mainImg--force"
                  src={images[activeImgIndex]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading={activeImgIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                />
              ) : (
                <div className="pd-empty">Sin imagen</div>
              )}

              {images.length > 1 && (
                <div className="">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={` ${idx === activeImgIndex ? "" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImgIndex(idx);
                      }}
                      aria-label={`Ver imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="pd-thumbs-row">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`}
                    onClick={() => setActiveImgIndex(idx)}
                    aria-label={`Miniatura ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt="thumb"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* INFO */}
          <aside className="pd-info">
            {/* ====== CAMBIO: HERO COMPACTO COMO LA IMAGEN ====== */}
            <div className="hero-top hero-top--compact">
              {/* (mini carrusel: ya lo tenés en MEDIA) */}

              {/* Trust badges row */}
              <div className="hero-trustline hero-trustline--logos" aria-label="Reseñas verificadas">

                {/* Trustpilot */}
                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    <svg viewBox="0 0 126.5 120" xmlns="http://www.w3.org/2000/svg" width="20" height="19">
                      <polygon fill="#00B67A" points="63.25,0 82.6,57.9 126.5,57.9 90.9,87.2 104.1,120 63.25,95.5 22.4,120 35.6,87.2 0,57.9 43.9,57.9"/>
                      <polygon fill="#005128" points="90.9,87.2 104.1,120 63.25,95.5 63.25,0 82.6,57.9 126.5,57.9"/>
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Trustpilot</span>
                    <div className="trust-score-row">
                      <span className="trust-stars">★★★★★</span>
                      <b className="trust-score">4.8</b>
                    </div>
                  </div>
                </div>

                <span className="hero-trustSep" />

                {/* Facebook */}
                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/>
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Facebook</span>
                    <div className="trust-score-row">
                      <span className="trust-stars">★★★★★</span>
                      <b className="trust-score">4.9</b>
                    </div>
                  </div>
                </div>

                <span className="hero-trustSep" />

                {/* Google */}
                <div className="trust-badge">
                  <span className="trust-logo" aria-hidden="true">
                    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
                      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0124 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 01-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                    </svg>
                  </span>
                  <div className="trust-text">
                    <span className="trust-name">Google</span>
                    <div className="trust-score-row">
                      <span className="trust-stars">★★★★★</span>
                      <b className="trust-score">4.8</b>
                    </div>
                  </div>
                </div>

              </div>



              {/* social proof chico arriba del título (como “Mabel H. + de 100.000 compraron”) */}
              <div className="hero-proof hero-proof--compact">
                <div className="hero-proofText">
                  <b>{Number(soldCount).toLocaleString("es-AR")}</b> personas compraron
                </div>
              </div>

              <h1 className="hero-title hero-title--compact">{product.name}</h1>

              <div className="hero-ratingRow hero-ratingRow--compact">
                <StarsInline rating={5} />
                <span className="hero-ratingText">4.7</span>
                <a href="#reviews-section" onClick={scrollToReviews} className="hero-reviews hero-reviews-link">
                  ({Number(274).toLocaleString("es-AR")} reseñas)
                </a>
              </div>

              {/* Subtítulo corto — viene del config de la landing */}
              {MC.heroSubtitle && (
                <div className="hero-subtitle">
                  {MC.heroSubtitle}
                </div>
              )}

              {/* ✅ Bullets: compactas, tipo check */}
              <ul className="hero-bullets-compact">
                {(MC.trustBullets || []).slice(0, 4).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              {/* Precio: antes tachado + ahora grande + descuento */}
              <div className="hero-priceRow">
                <span className="hero-was">{moneyARS(compareAt)}</span>
                <span className="hero-now">{moneyARS(unitPrice)}</span>
                <span className="hero-off">Descuento {discountPct}%</span>
              </div>

              {/* CTA grande 2 líneas (como la captura) */}
              <button
                className="hero-ctaBig"
                type="button"
                onClick={handleBuyNow}
              >
                Pagar Contra Reembolso
                <span>Envío GRATIS en 24/48Hs</span>
              </button>

              {/* viewing pill */}
              <div className="hero-viewingPill" aria-live="polite">
                <span className="hero-dot" aria-hidden="true" />
                <b>{heroViews}</b>&nbsp;personas están viendo este producto
              </div>
            </div>
            {/* ====== FIN CAMBIO HERO COMPACTO ====== */}

            {/* ✅ Mini reseñas: ya las tenés abajo del grid como MiniReviewsBar, NO TOCAMOS */}

            {/* ✅ CABA: PAGÁ AL RECIBIR */}
            <div className="pd-codBanner" role="note" aria-label="Pago al recibir en CABA">
              <div className="pd-codLeft">
                <div className="pd-codIcon">📍</div>
                <div className="pd-codText">
                  <div className="pd-codTitle">CABA: PAGÁ AL RECIBIR</div>
                  <div className="pd-codSub">
                    Pagá al recibir en <b>Punto de encuentro</b> o <b>Retiro</b>. Lo elegís al finalizar.
                  </div>
                </div>
              </div>

              <div className="pd-codBadge">CABA</div>
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


              <div className="pd-addToCartWrap">
                <button type="button" onClick={handleAddToCart} className="pd-ctaPrimary-outline">
                  Agregar al carrito
                </button>

                <button
                  type="button"
                  className="pd-howLink"
                  onClick={() => document.getElementById("howto")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Ver cómo se instala →
                </button>
              </div>
            </div>

            <div className="accordion-wrapper">
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsDescExpanded(!isDescExpanded)} type="button">
                  <span>Ficha técnica</span>
                  <span>{isDescExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isDescExpanded ? "open" : ""}`}>
                  <p>{product.description || MC.miniDescription}</p>

                  <ul className="pd-specs-list">
                    {product.specs &&
                      Object.entries(product.specs).map(([key, val]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {val}
                        </li>
                      ))}

                    {!product.specs && (
                      <>
                        <li><strong>Ganancia:</strong> 50 dBi</li>
                        <li><strong>Largo cable:</strong> 5 metros</li>
                        <li><strong>Resolución:</strong> 4K / 1080p</li>
                        <li><strong>Conector:</strong> coaxial universal</li>
                        <li><strong>Uso:</strong> interior / exterior</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="accordion-item">
                <button className="accordion-header" onClick={() => setIsShippingExpanded(!isShippingExpanded)} type="button">
                  <span>Envíos y compra protegida</span>
                  <span>{isShippingExpanded ? "−" : "+"}</span>
                </button>

                <div className={`accordion-content ${isShippingExpanded ? "open" : ""}`}>
                  <ul className="pd-ship-list">
                    <li><strong>Envío gratis:</strong> a todo el país.</li>
                    <li><strong>Compra protegida:</strong> tu pago se procesa de forma segura.</li>
                    <li><strong>Soporte:</strong> te ayudamos si necesitás guía para instalar.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <MiniReviewsBar productImg={images?.[0] || FALLBACK_IMG} mc={MC} />

        <div className="pd-bands">
          <Band
            variant="light"
            topFill="transparent"
            bottomFill="var(--pd-blue)"
            noTop
          >
            <div className="pd-sections-new">
              <StoryBlocks mc={MC} />
            </div>
          </Band>

          <Band
            variant="blue"
            topFill="var(--pd-light)"
            bottomFill="var(--pd-light)"
          >
            <div className="pd-sections-new">
              <BoxContents mc={MC} />
              <HowToSteps mc={MC} />
              <AuthorityCard mc={MC} />
            </div>
          </Band>

          <Band
            variant="light"
            topFill="var(--pd-blue)"
            bottomFill="var(--pd-blue)"
          >
            <div className="pd-sections-new">
              
              <ReviewsCarouselPro productImg={images?.[0] || FALLBACK_IMG} mc={MC} />
            </div>
          </Band>

          <Band
            variant="blue"
            topFill="var(--pd-light)"
            bottomFill="var(--pd-light)"
          >
            <div className="pd-sections-new">
              <FaqSectionPro mc={MC} />
              <AboutSection mc={MC} />
            </div>
          </Band>
        </div>
      </div>

      {showToast && (
        <div className="pd-toast-wrapper">
          <div className="pd-toast-content">
            <div className="pd-toast-main">
              <img
                src={images[0] || FALLBACK_IMG}
                alt=""
                className="pd-toast-img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div className="pd-toast-info">
                <span className="pd-toast-status">✓ ¡Agregado!</span>
                <span className="pd-toast-name">{product.name}</span>
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
          <div className="sticky-count">
            <span className="sticky-countLabel">TERMINA EN</span>
            <CountdownTimer storageKey={`pd_countdown_${id}`} minutes={18} />
          </div>
          <div className="sticky-prices">
            <span className="sticky-old">{formatARS(oldTotal)}</span>
            <span className="sticky-now">{formatARS(displayTotal)}</span>
          </div>
        </div>
        <button className="sticky-pro-btn2" onClick={handleBuyNow} type="button">
          LO QUIERO
        </button>
      </div>

      {/* ✅ CSS */}
      <style>{`
      /* ── Upsell sheet: rows (compartidos con UpsellSheet) ── */
      #upsell-section { padding: 0; }
      .ups-head { text-align: center; margin-bottom: 16px; }
      .ups-head-label { display: inline-block; font-size: .68rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; color: #0b5cff; background: rgba(11,92,255,.08); border-radius: 999px; padding: 3px 12px; margin-bottom: 8px; }
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
      .ups-row:hover { border-color: rgba(11,92,255,.30); box-shadow: 0 4px 16px rgba(11,92,255,.08); }
      .ups-row--on {
        border-color: #16a34a !important;
        background: rgba(22,163,74,.04) !important;
        box-shadow: 0 4px 18px rgba(22,163,74,.12) !important;
      }
      .ups-row-img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(2,8,23,.07); flex-shrink: 0; }
      .ups-row-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .ups-row-badge { font-size: .62rem; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: #0b5cff; background: rgba(11,92,255,.09); border-radius: 999px; padding: 2px 8px; align-self: flex-start; }
      .ups-row-name { font-size: .88rem; font-weight: 800; margin: 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ups-row-prices { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
      .ups-row-was { font-size: .76rem; font-weight: 700; color: rgba(11,18,32,.38); text-decoration: line-through; }
      .ups-row-now { font-size: .98rem; font-weight: 900; color: rgba(11,18,32,.90); }
      .ups-row-save { font-size: .72rem; font-weight: 900; color: #16a34a; background: rgba(22,163,74,.10); border-radius: 999px; padding: 1px 7px; }
      .ups-row-btn {
        flex-shrink: 0; width: 36px; height: 36px;
        border-radius: 50%; border: 2px solid rgba(11,18,32,.18);
        background: transparent; color: rgba(11,18,32,.55);
        font-size: 1.2rem; font-weight: 900; line-height: 1;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all .18s;
      }
      .ups-row-btn:hover:not(:disabled) { border-color: #0b5cff; color: #0b5cff; background: rgba(11,92,255,.07); }
      .ups-row-btn--on { border-color: #16a34a !important; background: #16a34a !important; color: #fff !important; font-size: 1rem !important; }
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

      .hero-trustline{
        display:flex;
        justify-content:center;
        align-items:center;
        gap: 10px;
        text-align:center;
        font-size: 12px;
        opacity: .95;
        margin: 6px 0 8px;
      }

      .hero-trustItem b{ font-weight: 900; }
      .hero-trustSep{
        width: 1px;
        height: 32px;
        background: rgba(0,0,0,.10);
        flex-shrink: 0;
      }

      .trust-badge{
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .trust-logo{
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .trust-text{
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .trust-name{
        font-size: .62rem;
        font-weight: 700;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: rgba(11,18,32,.40);
        line-height: 1;
      }

      .trust-score-row{
        display: flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
      }

      .trust-stars{
        color: #F5B301;
        font-size: 9px;
        letter-spacing: 1.5px;
      }

      .trust-score{
        font-size: .95rem;
        font-weight: 900;
        color: rgba(11,18,32,.90);
        letter-spacing: -.01em;
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
        margin: 6px 0 6px;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .hero-bullets-compact li{
        display:grid;
        grid-template-columns: 18px 1fr;
        gap: 10px;
        font-size: 15px;
        line-height: 1.25;
        align-items: start;
      }
      .hero-bullets-compact li::before{
        content: "✓";
        width:18px;
        height:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        border: 1px solid rgba(0,0,0,.22);
        border-radius: 999px;
        font-size: 12px;
        margin-top: 2px;
      }

      .hero-priceRow{
        display:flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        margin: 6px 0 2px;
      }
      .hero-was{
        text-decoration: line-through;
        opacity: .45;
        font-size: 18px;
        font-weight: 900;
      }
      .hero-now{
        font-size: 34px;
        font-weight: 1100;
      }
      .hero-off{
        font-size: 18px;
        font-weight: 1100;
        color: rgba(220,38,38,.95);
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
        background: #dc2626;      /* rojo como captura */
        color: #fff;
        box-shadow: 0 18px 55px rgba(220,38,38,.20);
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
        background: rgba(220,38,38,.08);
        border: 1px solid rgba(220,38,38,.12);
        margin-top: 10px;
        font-weight: 850;
      }
      .hero-dot{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display:inline-block;
        background: #ef4444;
        box-shadow: 0 10px 25px rgba(239,68,68,.25);
      }

      @media (max-width: 520px){
        .hero-title--compact{ font-size: 30px !important; }
        .hero-now{ font-size: 32px; }
      }
      /* ====== FIN CAMBIO CSS HERO COMPACTO ====== */

      /* ===== TITULOS PRO ===== */
      .sec-head{
        text-align: center;
        margin: 26px 0 14px;
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

      /* ===== IMAGEN PRINCIPAL MÁS GRANDE ===== */
      .pd-media { padding: 0 !important; }
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
        display:flex;
        gap: 10px;
        padding: 12px;
        border-top: 1px solid rgba(0,0,0,0.06);
        overflow-x: auto;
        background: #fff;
      }
      .pd-thumb{
        min-width: 72px;
        width: 72px;
        height: 72px;
        border-radius: 14px;
        overflow:hidden;
        border: 2px solid rgba(2,8,23,.10);
        background: #f1f5f9;
        padding: 0;
      }
      .pd-thumb.is-active{
        border-color: rgba(11,92,255,.85);
        box-shadow: 0 0 0 3px rgba(11,92,255,.18);
      }
      .pd-thumb img{ width:100%; height:100%; object-fit: cover; display:block; }

      /* hero */
      .hero-mini-desc{ color: rgba(11,18,32,.72); line-height: 1.7; margin: 10px 0 8px; }
      .inc-inline{ display:flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 6px; }
      .inc-chip{
        display:flex; align-items:center; gap: 8px;
        background: rgba(234,241,255,.78);
        border: 1px solid rgba(11,92,255,.14);
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
        text-transform: uppercase;
        letter-spacing: .05em;
        font-size: 1.25rem;
        font-weight: 1100;
        margin: 0 0 12px;
      }
      @media (min-width: 900px){
        .flow-title{ font-size: 1.45rem; }
      }
      .flow-p{ margin: 0; color: rgba(11,18,32,.72); line-height: 1.7; font-weight: 650; text-align: center; }

      .pd-sections-new{ margin-top: 20px; padding-bottom: 40px; }
      .pd-flow{ display:flex; flex-direction: column; gap: 28px; }
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
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(11,92,255,.10);
        border: 1px solid rgba(11,92,255,.18);
        font-weight: 1100;
        color: rgba(11,18,32,.78);
        margin-bottom: 10px;
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
        background: rgba(11,92,255,.07);
        border: 1px solid rgba(11,92,255,.12);
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
        color: #10b981;
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
        background: linear-gradient(180deg, rgba(234,241,255,.95), rgba(234,241,255,.65));
        border-bottom: 1px solid rgba(2,8,23,.06);
        font-weight: 1100;
      }
      .cmp-row{
        border-bottom: 1px solid rgba(2,8,23,.06);
        transition: background .18s ease, transform .18s ease;
      }
      .cmp-row:hover{ background: rgba(11,92,255,.06); transform: translateY(-1px); }
      .cmp-row:last-child{ border-bottom: none; }
      .cmp-k, .cmp-col{ padding: 14px 12px; color: rgba(11,18,32,.78); font-weight: 900; font-size: .92rem; }
      .cmp-a{ color: rgba(11,92,255,.95); font-weight: 1100; }
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

      /* ===== AUTHORITY CARD ===== */
      .auth2{
        border-radius: 22px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.10);
        box-shadow: 0 22px 70px rgba(10,20,40,.14);
        animation: popIn .35s ease both;
      }

      .auth2-body{
        background: linear-gradient(150deg, #0d0d20 0%, #111128 100%);
        padding: 30px 26px 26px;
        position: relative;
        overflow: hidden;
      }

      .auth2-body::before{
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 85% 15%, rgba(11,92,255,.20) 0%, transparent 65%);
        pointer-events: none;
      }

      .auth2-qq{
        display: block;
        font-size: 4.5rem;
        line-height: .65;
        color: rgba(11,92,255,.55);
        font-family: Georgia, serif;
        margin-bottom: 14px;
        position: relative;
        user-select: none;
      }

      .auth2-quote{
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        color: rgba(255,255,255,.88);
        line-height: 1.75;
        font-style: italic;
        position: relative;
      }

      .auth2-foot{
        background: rgba(255,255,255,.98);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-top: 1px solid rgba(2,8,23,.07);
      }

      .auth2-avatar{
        width: 50px;
        height: 50px;
        border-radius: 999px;
        object-fit: cover;
        border: 2px solid rgba(11,92,255,.18);
        box-shadow: 0 6px 20px rgba(11,92,255,.14);
        flex-shrink: 0;
      }

      .auth2-meta{
        flex: 1;
        min-width: 0;
      }

      .auth2-name{
        font-weight: 900;
        font-size: .95rem;
        color: rgba(11,18,32,.90);
        line-height: 1.2;
      }

      .auth2-role{
        font-size: .78rem;
        font-weight: 600;
        color: rgba(11,18,32,.48);
        margin-top: 2px;
      }

      .auth2-badge{
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: .70rem;
        font-weight: 800;
        letter-spacing: .04em;
        color: #10b981;
        background: rgba(16,185,129,.08);
        border: 1px solid rgba(16,185,129,.22);
        border-radius: 999px;
        padding: 5px 10px;
        flex-shrink: 0;
        white-space: nowrap;
      }

      .auth2-badge-dot{
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #10b981;
        box-shadow: 0 0 8px rgba(16,185,129,.7);
        animation: livePulse 2.2s ease-in-out infinite;
        flex-shrink: 0;
      }

      .auth2-disclaimer{
        background: rgba(248,250,252,.95);
        border-top: 1px solid rgba(2,8,23,.06);
        padding: 11px 20px;
        font-size: .73rem;
        font-weight: 600;
        color: rgba(11,18,32,.38);
        line-height: 1.5;
      }

      /* FAQ */
      .faq-pro{
        display: flex;
        flex-direction: column;
        gap: 0;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(2,8,23,.09);
        box-shadow: 0 22px 60px rgba(10,20,40,.11);
      }

      .faq-pro-item{
        background: #fff;
        border-bottom: 1px solid rgba(2,8,23,.07);
        position: relative;
        overflow: hidden;
        transition: background .2s ease;
      }

      .faq-pro-item:last-child{ border-bottom: none; }

      .faq-pro-item.open{ background: rgba(247,249,255,1); }

      .faq-pro-item.open::before{
        content: "";
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #0b5cff 0%, #10b981 100%);
      }

      .faq-pro-q{
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-weight: 800;
        font-size: .95rem;
        color: rgba(11,18,32,.88);
        text-align: left;
        line-height: 1.4;
      }

      .faq-pro-item.open .faq-pro-q{ color: rgba(11,18,32,1); }

      .faq-pro-ico{
        width: 26px;
        height: 26px;
        border-radius: 999px;
        border: 1.5px solid rgba(11,92,255,.22);
        background: rgba(11,92,255,.06);
        flex-shrink: 0;
        position: relative;
        transition: transform .28s ease, background .2s ease, border-color .2s ease;
      }

      .faq-pro-ico::before{
        content: "";
        position: absolute;
        top: 50%; left: 50%;
        width: 6px; height: 6px;
        border-right: 1.5px solid rgba(11,92,255,.85);
        border-bottom: 1.5px solid rgba(11,92,255,.85);
        transform: translate(-50%, -65%) rotate(45deg);
      }

      .faq-pro-item.open .faq-pro-ico{
        transform: rotate(180deg);
        background: rgba(11,92,255,.12);
        border-color: rgba(11,92,255,.4);
      }

      .faq-pro-a{
        max-height: 0;
        overflow: hidden;
        transition: max-height .32s ease, padding .28s ease;
        padding: 0 20px;
        color: rgba(11,18,32,.65);
        font-weight: 500;
        font-size: .9rem;
        line-height: 1.68;
      }

      .faq-pro-item.open .faq-pro-a{
        max-height: 340px;
        padding: 0 20px 20px 23px;
      }

      .faq-pro-a p{ margin: 0; }

      /* stars */
      .stars-inline{ display:inline-flex; gap: 2px; justify-content: center; }
      .stars-inline .s{ opacity: .25; font-size: 14px; }
      .stars-inline .s.on{ opacity: 1; color: #F5B301; }

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
        background: #ef4444;
        color: #fff;
        display:grid;
        place-items:center;
        font-weight: 1100;
        box-shadow: 0 16px 40px rgba(239,68,68,.35);
      }
      .rv-body{ padding: 16px 16px 18px; display:flex; flex-direction: column; gap: 8px; text-align: center; }
      .rv-title{ font-weight: 1100; text-transform: uppercase; letter-spacing: .05em; color: rgba(11,18,32,.92); }
      .rv-text{ margin: 0; color: rgba(11,18,32,.70); line-height: 1.6; font-weight: 650; }
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
      .rv-dot.on{ background: rgba(11,92,255,.95); transform: scale(1.25); }

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
        background: #10b981;
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
        flex-direction: column;
        gap: 7px;
        background: #fff;
        border-top: 1.5px solid rgba(2,8,23,.08);
        border-radius: 20px 20px 0 0;
        padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
        box-shadow: 0 -6px 36px rgba(10,20,40,.13);
      }
      @media (min-width: 991px){ .sticky-pro{ display:none; } }

      .sticky-pro-left{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .sticky-count{ display:flex; align-items:center; gap: 6px; }
      .sticky-countLabel{
        font-size: .70rem;
        color: rgba(11,18,32,.45);
        font-weight: 900;
        letter-spacing: .07em;
        text-transform: uppercase;
      }
      .cd{ font-variant-numeric: tabular-nums; color: #dc2626; font-weight: 900; font-size: .92rem; }

      .sticky-prices{ display:flex; align-items: baseline; gap: 8px; }
      .sticky-old{ color: rgba(11,18,32,.38); font-weight: 700; text-decoration: line-through; font-size: .85rem; }
      .sticky-now{ font-weight: 900; color: rgba(11,18,32,.92); font-size: 1.18rem; }

      .sticky-pro-btn2{
        width: 100%;
        border: none;
        background: linear-gradient(135deg, #1a6dff 0%, #0b5cff 60%, #0046e0 100%);
        color: #fff;
        font-weight: 900;
        font-size: 1rem;
        border-radius: 14px;
        padding: 12px 18px;
        cursor: pointer;
        box-shadow: 0 8px 28px rgba(11,92,255,.32);
        letter-spacing: .05em;
        text-transform: uppercase;
        transition: transform .12s ease, box-shadow .12s ease;
      }
      .sticky-pro-btn2:active{
        transform: scale(.98);
        box-shadow: 0 4px 14px rgba(11,92,255,.22);
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
        color: rgba(11,92,255,.95);
        text-decoration: underline;
        text-underline-offset: 4px;
        letter-spacing: .2px;
      }

      .pd-howLink:hover{
        opacity: .85;
        transform: translateY(-1px);
        transition: .15s ease;
      }

      /* ===== MINI RESEÑAS ===== */
      .mrb{
        margin-top: 14px;
        background: rgba(2,8,23,.03);
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 16px;
        padding: 12px 12px 10px;
        box-shadow: 0 14px 40px rgba(10,20,40,.08);
      }

      .mrb-viewport{
        overflow: hidden;
        border-radius: 14px;
      }

      .mrb-track{
        display: flex;
        width: 100%;
        transition: transform .28s ease;
        will-change: transform;
      }

      .mrb-slide{
        flex: 0 0 100%;
        width: 100%;
      }

      .mrb-card{
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(2,8,23,.08);
        border-radius: 14px;
        padding: 16px;
      }

      .mrb-header{
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mrb-header-info{
        flex: 1;
        min-width: 0;
      }

      .mrb-avatar{
        width: 46px;
        height: 46px;
        border-radius: 999px;
        object-fit: cover;
        border: 1px solid rgba(2,8,23,.10);
        background: #e2e8f0;
        flex-shrink: 0;
      }

      .mrb-title{
        font-size: .9rem;
        font-weight: 900;
        color: rgba(11,18,32,.88);
        line-height: 1.3;
      }

      .mrb-text{
        font-size: .9rem;
        color: rgba(11,18,32,.72);
        font-weight: 500;
        line-height: 1.5;
      }

      .mrb-name{
        font-size: .82rem;
        font-weight: 900;
        color: rgba(11,18,32,.60);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mrb-stars .stars-inline .s{ font-size: 12px; }
      .mrb-stars{ flex-shrink: 0; }

      .mrb-section-header{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 18px 4px 12px;
      }

      .mrb-section-badge{
        font-size: 16px;
        line-height: 1;
      }

      .mrb-section-title{
        font-size: 1rem;
        font-weight: 900;
        letter-spacing: .2px;
        color: rgba(11,18,32,.88);
      }

      .mrb-nav{
        display: grid;
        grid-template-columns: 34px 1fr 34px;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .mrb-arrow{
        width: 34px;
        height: 28px;
        border-radius: 10px;
        border: 1px solid rgba(2,8,23,.10);
        background: rgba(255,255,255,.92);
        box-shadow: 0 10px 24px rgba(10,20,40,.10);
        cursor: pointer;
        font-size: 18px;
        display: grid;
        place-items: center;
      }

      .mrb-dots{
        display: flex;
        justify-content: center;
        gap: 6px;
      }

      .mrb-dot{
        width: 6px;
        height: 6px;
        border-radius: 999px;
        border: none;
        background: rgba(2,8,23,.22);
        cursor: pointer;
        transition: transform .15s ease, background .15s ease;
      }
      .mrb-dot.on{
        background: rgba(11,92,255,.95);
        transform: scale(1.25);
      }

      /* ===== Delivery Notice ===== */
      .pd-deliveryNotice{
        margin: 14px 0 10px;
        display:flex;
        gap: 12px;
        align-items:center;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(34,197,94,.25);
        background: linear-gradient(180deg, rgba(34,197,94,.10), rgba(34,197,94,.06));
        box-shadow: 0 12px 28px rgba(16,185,129,.10);
      }

      .pd-deliveryIcon{
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display:grid;
        place-items:center;
        background: rgba(34,197,94,.14);
        border: 1px solid rgba(34,197,94,.22);
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
        background: rgba(34,197,94,.14);
        border: 1px solid rgba(34,197,94,.22);
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
        margin: 14px 0 12px;
        padding: 12px 14px;
        border-radius: 18px;
        border: 1px solid rgba(245,158,11,.25);
        background: linear-gradient(180deg, rgba(255,251,235,.95), rgba(255,251,235,.70));
        box-shadow: 0 18px 55px rgba(10,20,40,.10);
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 12px;
      }

      .pd-codLeft{
        display:flex;
        align-items:center;
        gap: 12px;
        min-width: 0;
      }

      .pd-codIcon{
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display:grid;
        place-items:center;
        background: rgba(245,158,11,.16);
        border: 1px solid rgba(245,158,11,.22);
        font-size: 18px;
        flex-shrink: 0;
      }

      .pd-codText{
        display:grid;
        gap: 2px;
        min-width: 0;
      }

      .pd-codTitle{
        font-weight: 1100;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: rgba(11,18,32,.92);
        font-size: .95rem;
        line-height: 1.1;
      }

      .pd-codSub{
        color: rgba(11,18,32,.68);
        font-weight: 850;
        font-size: .9rem;
        line-height: 1.35;
      }

      .pd-codBadge{
        background: rgba(69, 138, 5, 0.95);
        color: #fff;
        font-weight: 1100;
        padding: 8px 10px;
        border-radius: 999px;
        letter-spacing: .04em;
        text-transform: uppercase;
        font-size: .78rem;
        box-shadow: 0 14px 34px rgba(11, 245, 81, 0.28);
        white-space: nowrap;
      }

      @media (max-width: 520px){
        .pd-codBanner{ padding: 12px; }
        .pd-codBadge{ font-size: .72rem; padding: 7px 9px; }
        .pd-codTitle{ font-size: .9rem; }
        .pd-codSub{ font-size: .86rem; }
      }
      `}</style>

      {/* Upsell sheet — aparece antes del checkout cuando hay config de upsell */}
      {showUpsellSheet && MC.upsell && (
        <UpsellSheet
          mc={MC}
          mainProduct={product}
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