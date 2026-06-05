import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { track } from '../lib/metaPixel';
import { CheckoutSheet } from './CheckoutSheet';
import mc from '../landings/sillon-puff-inflable';

/* ============================================================
   WAVE SEPARATOR
============================================================ */
function WaveSeparator({ from }) {
  const topColor  = from === 'blue' ? '#1B4D3E' : '#ffffff';
  const fillColor = from === 'blue' ? '#ffffff' : '#1B4D3E';
  return (
    <div className="wave-divider" style={{ '--wave-top-color': topColor }}>
      <svg className="waves-anim" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
        <defs>
          <path id="spf-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax1"><use xlinkHref="#spf-gentle-wave" x="48" y="0" fill={fillColor} /></g>
        <g className="parallax2"><use xlinkHref="#spf-gentle-wave" x="48" y="3" fill={fillColor} /></g>
        <g className="parallax3"><use xlinkHref="#spf-gentle-wave" x="48" y="5" fill={fillColor} /></g>
        <g className="parallax4"><use xlinkHref="#spf-gentle-wave" x="48" y="7" fill={fillColor} /></g>
      </svg>
    </div>
  );
}

/* ============================================================
   COUNTDOWN TIMER
============================================================ */
function CountdownTimer({ storageKey = 'spf_countdown', minutes = 18 }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    const target = saved && saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;
    sessionStorage.setItem(storageKey, String(target));
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, minutes]);
  const totalSec = Math.floor(left / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  if (hh > 0) return <span className="spf-cd">{hh}:{mm}:{ss}</span>;
  return <span className="spf-cd">{mm}:{ss}</span>;
}

/* ============================================================
   MINI REVIEWS BAR
============================================================ */
function MiniReviewsBar({ reviews = [] }) {
  const [active, setActive] = useState(0);
  const avatarColors = ['#1B4D3E', '#2F855A', '#276749', '#1B4D3E', '#2D6A4F', '#2F855A', '#1B4D3E'];
  useEffect(() => {
    if (!reviews.length) return;
    const t = setInterval(() => setActive(i => (i + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [reviews.length]);
  return (
    <div className="mrb">
      <div className="mrb-label">LO QUE DICEN NUESTROS CLIENTES</div>
      <div className="mrb-viewport">
        <div className="mrb-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {reviews.map((rev, i) => (
            <div className="mrb-slide" key={i}>
              <div className="mrb-card">
                <div className="mrb-card-header">
                  <div className="mrb-card-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                    {(rev.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="mrb-card-meta">
                    <div className="mrb-card-name">{rev.name}</div>
                    <div className="mrb-card-stars">
                      <div className="stars-inline">
                        {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= rev.rating ? ' on' : ''}`}>★</span>)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mrb-card-text">"{rev.text.slice(0, 110)}{rev.text.length > 110 ? '…' : ''}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mrb-dots">
        {reviews.map((_, i) => (
          <button key={i} className={`mrb-dot${i === active ? ' on' : ''}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VIDEO STRIP — idéntico a ProductDetail (lámpara magnética)
============================================================ */
function VideoStripSection({ mc }) {
  const videos = mc.proofVideos;
  if (!videos?.length) return null;
  return (
    <section className="vstrip-section anim-el">
      <div className="vstrip-header">
        <div className="vstrip-kicker">{mc.proofVideosKicker || "✦ CLIENTES SATISFECHOS"}</div>
        {mc.proofVideosTitle && <h2 className="vstrip-title">{mc.proofVideosTitle}</h2>}
        {mc.proofVideosSubtitle && <div className="vstrip-sub">{mc.proofVideosSubtitle}</div>}
      </div>
      <div className="vstrip-row">
        {videos.map((v, i) => (
          <div key={i} className="vstrip-item">
            <div className="vstrip-media">
              {v.videoUrl ? (
                <video autoPlay muted loop playsInline className="vstrip-video" aria-label={v.label}>
                  <source src={v.videoUrl} type="video/mp4" />
                </video>
              ) : v.imgUrl ? (
                <img src={v.imgUrl} alt={v.label} className="vstrip-video" loading="lazy" />
              ) : (
                <div className="vstrip-ph" aria-hidden="true">
                  <span className="vstrip-ph-ico">▶</span>
                </div>
              )}
            </div>
            <div className="vstrip-label">{v.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   BEFORE / AFTER SLIDER
============================================================ */
function BeforeAfterSlider({ imgBefore, imgAfter, beforeLabel = 'Antes', afterLabel = 'Después' }) {
  const containerRef = useRef(null);
  const handleSlider = (e) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--position', `${e.target.value}%`);
    }
  };
  return (
    <div className="ba-wrap">
      <div className="ba-container" ref={containerRef} style={{ '--position': '50%' }}>
        <div className="ba-img-wrap">
          {imgAfter
            ? <img className="ba-img-after" src={imgAfter} alt={afterLabel} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div className="ba-img-after ba-img-ph"><span className="ba-img-ph-icon">🛋️</span><span className="ba-img-ph-text">{afterLabel}</span></div>
          }
          <div className="ba-img-before">
            {imgBefore
              ? <img src={imgBefore} alt={beforeLabel} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'left center', display:'block' }} />
              : <div className="ba-img-ph ba-img-ph--alt"><span className="ba-img-ph-icon">📦</span><span className="ba-img-ph-text">{beforeLabel}</span></div>
            }
          </div>
        </div>
        <span className="ba-badge ba-badge-before">{beforeLabel}</span>
        <span className="ba-badge ba-badge-after">{afterLabel}</span>
        <input type="range" min="0" max="100" defaultValue="50" onInput={handleSlider} className="ba-range" aria-label="Comparar antes y después" />
        <div className="ba-line" />
        <div className="ba-handle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6 9H12M6 9L4 7M6 9L4 11M12 9L14 7M12 9L14 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STATS CIRCLES — idéntico a ProductDetail (lámpara magnética)
============================================================ */
function StatsCircles({ mc }) {
  const items = mc.statsCircles;
  if (!items?.length) return null;

  const circleRefs = useRef([]);
  const animatedRef = useRef(items.map(() => false));
  const [values, setValues] = useState(() => items.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.dataset.idx);
          if (animatedRef.current[idx]) return;
          animatedRef.current[idx] = true;
          const target = items[idx].target;
          let current = 0;
          const step = () => {
            if (current <= target) {
              setValues(prev => {
                const next = [...prev];
                next[idx] = current;
                return next;
              });
              current++;
              requestAnimationFrame(step);
            }
          };
          step();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );
    circleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="sc-section anim-el">
      {mc.statsTitle && (
        <h2 className="sc-title">{mc.statsTitle}</h2>
      )}
      <div className="sc-list">
        {items.map((item, i) => (
          <div
            key={i}
            className="sc-row"
            ref={el => circleRefs.current[i] = el}
            data-idx={i}
          >
            <div className="sc-circle" style={{ "--sc-pct": `${values[i]}%` }}>
              <span className="sc-pct">{values[i]}%</span>
            </div>
            <p
              className="sc-text"
              dangerouslySetInnerHTML={{ __html: item.text }}
            />
          </div>
        ))}
      </div>
      <div className="sc-footer">
        <p className="sc-footer-note">{mc.statsFooterNote || "*Basado en compras verificadas"}</p>
        <div className="sc-footer-stats">
          {mc.soldCount && (
            <div className="sc-stat">
              <span className="sc-stat-val">+{mc.soldCount.toLocaleString("es-AR")}</span>
              <span className="sc-stat-lbl">CLIENTES</span>
            </div>
          )}
          {mc.reviewScore && (
            <div className="sc-stat">
              <span className="sc-stat-val">{mc.reviewScore * 20}%</span>
              <span className="sc-stat-lbl">SATISFACCIÓN</span>
            </div>
          )}
          {mc.reviewCount && (
            <div className="sc-stat">
              <span className="sc-stat-val">+{mc.reviewCount}</span>
              <span className="sc-stat-lbl">RESEÑAS</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   REVIEWS WITH BARS — puntuación + barras + carousel
============================================================ */
function ReviewsWithBars({ reviews = [], distribution = [], title, subtitle, score = 4.8, count = 0 }) {
  const [active, setActive] = useState(0);
  const rowRef = useRef(null);

  const scrollTo = (i) => {
    setActive(i);
    const row = rowRef.current;
    if (!row) return;
    const slide = row.children[i];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className="spf-rwb">
      <div className="sec-head">
        <h2 className="sec-title">{title}</h2>
        {subtitle && <p className="sec-sub">{subtitle}</p>}
      </div>
      <div className="spf-rwb-score-row">
        <div className="spf-rwb-score-big">
          <span className="spf-rwb-score-num">{score}</span>
          <div className="stars-inline spf-rwb-stars">
            {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= Math.round(score) ? ' on' : ''}`}>★</span>)}
          </div>
          <span className="spf-rwb-score-count">+{count} reseñas</span>
        </div>
        <div className="spf-rwb-bars">
          {distribution.map((d, i) => (
            <div key={i} className="spf-rwb-bar-row">
              <span className="spf-rwb-bar-label">{d.stars}★</span>
              <div className="spf-rwb-bar-track">
                <div className="spf-rwb-bar-fill" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="spf-rwb-bar-pct">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rv-wrap" style={{ marginTop: 28 }}>
        <button className="rv-nav rv-prev" onClick={() => scrollTo(Math.max(0, active - 1))} aria-label="Anterior">‹</button>
        <div className="rv-row" ref={rowRef}>
          {reviews.map((r, i) => (
            <div className="rv-slide" key={i}>
              <div className="rv-card">
                <div className="rv-imgBox">
                  {r.img
                    ? <img src={r.img} alt={r.imgAlt || `Reseña de ${r.name}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : <div className="spf-rv-ph" aria-label={r.imgAlt || `Foto de ${r.name}`}>🛋️</div>
                  }
                  <div className="rv-quote">"</div>
                </div>
                <div className="rv-body">
                  <div className="stars-inline">
                    {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= r.rating ? ' on' : ''}`}>★</span>)}
                  </div>
                  <div className="rv-title">{r.title}</div>
                  <p className="rv-text">{r.text}</p>
                  <div className="rv-name">— {r.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="rv-nav rv-next" onClick={() => scrollTo(Math.min(reviews.length - 1, active + 1))} aria-label="Siguiente">›</button>
        <div className="rv-dots">
          {reviews.map((_, i) => (
            <button key={i} className={`rv-dot${i === active ? ' on' : ''}`} onClick={() => scrollTo(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WHATSAPP TAB
============================================================ */
function WaTab({ wa }) {
  if (!wa?.show) return null;
  const href = `https://wa.me/${wa.number}?text=${encodeURIComponent(wa.message)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="wa-tab" aria-label="Consultas por WhatsApp">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    </a>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SillonPuffLanding() {
  const [product,      setProduct]      = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(mc.bundles[0]);
  const [openFaq,      setOpenFaq]      = useState(null);
  const [showSheet,    setShowSheet]    = useState(false);
  const [allowCod,     setAllowCod]     = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/slug/${mc.productSlug}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => { setProductReady(true); });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (d?.country_code === 'AR' && d?.region_code === 'C') setAllowCod(true); })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!productReady) return;
    const heroCTA = document.querySelector('.bnd2-cta');
    const stickyBar = document.querySelector('.pd-sticky-bar');
    if (!heroCTA || !stickyBar) return;
    let ctaSeen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) ctaSeen = true;
        stickyBar.classList.toggle('sticky--visible', ctaSeen && !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(heroCTA);
    return () => observer.disconnect();
  }, [productReady]);

  const displayBundles = useMemo(() => {
    return mc.bundles.map((b, idx) => {
      const db = product?.bundles?.[idx];
      return { ...b, label: db?.label ?? b.label, price: db?.price ?? b.price, compareAt: db?.compareAt ?? b.compareAt };
    });
  }, [product]);

  useEffect(() => {
    const idx = mc.bundles.findIndex(b => b.id === selectedBundle.id);
    const next = displayBundles[idx >= 0 ? idx : 0] ?? displayBundles[0];
    if (next) setSelectedBundle(next);
  }, [displayBundles]); // eslint-disable-line react-hooks/exhaustive-deps

  const heroImgs = useMemo(() => {
    const arr = [];
    if (product?.imageUrl) arr.push({ src: product.imageUrl, alt: 'Sillón Puff Inflable Sunfield' });
    if (Array.isArray(product?.images)) {
      product.images.forEach(x => {
        const url = typeof x === 'string' ? x : x?.url;
        if (url && !arr.find(a => a.src === url)) arr.push({ src: url, alt: 'Sillón Puff Inflable Sunfield' });
      });
    }
    return arr.length ? arr : mc.heroImages;
  }, [product]);

  // FIX: story images from config only — never pulled from product.images API array
  const storyImgs = mc.storyBlocks.map(b => b.img || '');

  const handleBuy = () => {
    if (!product || selectedBundle.soldOut) return;
    addItem(
      { ...product, name: `${mc.checkoutName} — ${selectedBundle.label}` },
      1,
      { bundleTotal: selectedBundle.price, compareAtPrice: selectedBundle.compareAt, gifts: selectedBundle.gifts || [] },
    );
    track('InitiateCheckout', {
      value: selectedBundle.price / 100,
      currency: 'ARS',
      content_name: mc.checkoutName,
    });
    setShowSheet(true);
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  if (!productReady) {
    return (
      <>
        <style>{`@keyframes _spfBar{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ minHeight:'100vh', background:'#fff' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#1B4D3E,#4ade80,#1B4D3E)', backgroundSize:'200% 100%', animation:'_spfBar 1.1s linear infinite' }} />
        </div>
      </>
    );
  }

  const activeImg = heroImgs[activeImgIdx] || heroImgs[0] || { src: '', alt: 'Sillón Puff Inflable Sunfield' };

  return (
    <div className="spf-wrap">

      {/* ============================================================
          HERO — imagen izquierda / info+bundles derecha
      ============================================================ */}
      <div className="pd-hero-row">

        <section className="pd-media-fullwidth">
          <section className="pd-media">
            <div className="pd-mediaMain pd-mediaMain--bigger">
              {activeImg.src
                ? (
                  <img
                    key={activeImgIdx}
                    className="pd-mainImg pd-mainImg--anim"
                    src={activeImg.src}
                    alt={activeImg.alt}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  />
                ) : (
                  <div className="spf-hero-ph" aria-label={activeImg.alt}>
                    <span className="spf-hero-ph-icon">🛋️</span>
                    <span className="spf-hero-ph-text">{activeImg.alt}</span>
                  </div>
                )
              }
            </div>
            <div className="pd-thumbs-row">
              {heroImgs.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb${idx === activeImgIdx ? ' is-active' : ''}`}
                  onClick={() => setActiveImgIdx(idx)}
                  aria-label={img.alt}
                >
                  {img.src
                    ? <img src={img.src} alt={img.alt} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div className="spf-thumb-ph">🛋️</div>
                  }
                </button>
              ))}
            </div>
          </section>
        </section>

        <div className="container pd-container">
          <aside className="pd-info">
            <div className="hero-top hero-top--compact">

              <div className="reviews-container">
                <div className="avatars">
                  {['V','L','S'].map((letter, i) => (
                    <div key={i} className="avatar spf-avatar-init" style={{ background: ['#1B4D3E','#2F855A','#276749'][i] }}>
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="text-grey">
                  Calificado <strong>{mc.reviewScore}/5</strong> basado en <strong>+{mc.reviewCount} reseñas</strong>
                </span>
              </div>

              <h1 className="hero-title hero-title--compact">
                {product?.name ? product.name : <>El sillón que querías<br />sin arrastrar nada</>}
              </h1>

              <div className="hero-subtitle">{mc.heroSubtitle}</div>

              <div className="emoji-bullets">
                {mc.trustBullets.map((b, i) => <div key={i} className="emoji-bullet">{b}</div>)}
              </div>

              <div className="spf-countdown">
                <span>⏱</span>
                <span className="spf-countdown-label">Oferta termina en</span>
                <CountdownTimer storageKey="spf_cd_v2" minutes={335} />
              </div>

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

              <div className="bnd2-wrap">
                <div className="bnd2-section-title">✨ Elegí Tu Kit ✨</div>

                {displayBundles.map((b) => (
                  <div
                    key={b.id}
                    className={`bnd2-card${!b.soldOut && selectedBundle.id === b.id ? ' bnd2-card--on' : ''}${b.popular ? ' bnd2-card--pop' : ''}${b.soldOut ? ' spf-card--sold' : ''}`}
                    onClick={() => !b.soldOut && setSelectedBundle(b)}
                    role="button"
                    tabIndex={b.soldOut ? -1 : 0}
                    aria-disabled={b.soldOut}
                    onKeyDown={e => e.key === 'Enter' && !b.soldOut && setSelectedBundle(b)}
                  >
                    {b.popular && !b.soldOut && <div className="bnd2-float-badge">⭐ MÁS POPULAR</div>}
                    {b.soldOut && <div className="bnd2-float-badge spf-sold-badge">AGOTADO</div>}
                    <div className="bnd2-row">
                      <input
                        type="radio"
                        className="bnd2-radio"
                        readOnly
                        checked={!b.soldOut && selectedBundle.id === b.id}
                        disabled={b.soldOut}
                        aria-label={b.label}
                      />
                      <div className="bnd2-center">
                        <span className="bnd2-name">{b.label}</span>
                        {!b.soldOut && b.badge && (
                          <span className={`bnd2-badge${b.popular ? ' bnd2-badge--pop' : ''}`}>{b.badge}</span>
                        )}
                      </div>
                      <div className="bnd2-prices">
                        {b.soldOut
                          ? <span className="spf-soldout-label">Sin stock</span>
                          : (
                            <>
                              <span className="bnd2-was">{fmt(b.compareAt)}</span>
                              <span className="bnd2-now">{fmt(b.price)}</span>
                            </>
                          )
                        }
                      </div>
                    </div>
                    {!b.soldOut && b.benefit && <div className="bnd2-benefit">{b.benefit}</div>}
                  </div>
                ))}

                <button
                  className="bnd2-cta spf-cta"
                  type="button"
                  onClick={handleBuy}
                  disabled={!product || selectedBundle.soldOut}
                >
                  {!product ? 'Cargando…' : `${mc.ctaLine1} →`}
                </button>
                <p className="pd-cta-guarantee">🛡️ Garantía 30 días — Si no te convence, te devolvemos el dinero entero</p>
                <div className="bnd2-urgency">
                  <span className="bnd2-urgency-dot" />
                  {mc.stockAlertText}
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================
          BANDAS DE CONTENIDO
      ============================================================ */}
      <div className="pd-bands">

        {/* ── 1. BLANCO — Mini reviews + Video strip + Story blocks ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container">
            <MiniReviewsBar reviews={mc.reviews} />
          </div>
          <div className="dtx-container" style={{ paddingTop: 28 }}>
            <VideoStripSection mc={mc} />
          </div>
          <div className="dtx-container">
            <section className="pd-flow">
              {mc.storyBlocks.map((b, i) => (
                <div key={i} className="flow-row">
                  <div className={`flow-text${b.textHtml ? ' flow-text--rich' : ''}`}>
                    {b.badge && <div className="flow-badge">{b.badge}</div>}
                    <h3 className="flow-title">{b.title}</h3>
                    {b.textHtml
                      ? <p className="flow-p flow-p--rich" dangerouslySetInnerHTML={{ __html: b.textHtml }} />
                      : <p className="flow-p">{b.text}</p>
                    }
                  </div>
                  <div className="flow-media">
                    <div className="flow-imgBox hover-float">
                      {storyImgs[i]
                        ? <img src={storyImgs[i]} alt={b.imgAlt} loading="lazy" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        : <div className="spf-flow-ph"><span className="spf-flow-ph-icon">🛋️</span><span className="spf-flow-ph-text">{b.imgAlt}</span></div>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── 2. VERDE — Antes/Después + Garantía ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <div className="sec-head">
              <h2 className="sec-title" style={{ color:'rgba(255,255,255,.92)' }}>{mc.beforeAfter.title}</h2>
              <p className="sec-sub" style={{ color:'rgba(255,255,255,.55)' }}>{mc.beforeAfter.subtitle}</p>
            </div>
            <BeforeAfterSlider
              imgBefore={mc.beforeAfter.beforeImg}
              imgAfter={mc.beforeAfter.afterImg}
              beforeLabel={mc.beforeAfter.beforeLabel}
              afterLabel={mc.beforeAfter.afterLabel}
            />
            <p className="spf-ba-hint">← Arrastrá para comparar →</p>
          </div>
          <div className="dtx-container">
            <div className="grt-section">
              <div className="grt-medal">
                <div className="grt-medal-face">
                  <span className="grt-medal-sup">GARANTÍA</span>
                  <span className="grt-medal-num">30</span>
                  <span className="grt-medal-bot">DÍAS</span>
                </div>
              </div>
              <h2 className="grt-title">{mc.guarantee.title}</h2>
              <p className="grt-sub">{mc.guarantee.sub}</p>
              <div className="grt-pills">
                <span className="grt-pill">✅ Sin preguntas</span>
                <span className="grt-pill">✅ Sin trámites</span>
                <span className="grt-pill">✅ Devolución completa</span>
                <span className="grt-pill">🚚 Envío gratis</span>
              </div>
              <button className="grt-cta spf-grt-cta" onClick={handleBuy}>{mc.guarantee.cta}</button>
              <p className="pd-cta-guarantee pd-cta-guarantee--light">🛡️ Garantía 30 días — Si no te convence, te devolvemos el dinero entero</p>
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── 3. BLANCO — Reseñas con barras ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py">
            <ReviewsWithBars
              reviews={mc.reviews}
              distribution={mc.ratingDistribution}
              title={mc.reviewsTitle}
              subtitle={mc.reviewsSubtitle}
              score={mc.reviewScore}
              count={mc.reviewCount}
            />
          </div>
        </section>

        <WaveSeparator from="light" />

        {/* ── 4. VERDE — Estadísticas ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <StatsCircles mc={mc} />
          </div>
        </section>

        <WaveSeparator from="blue" />

        {/* ── 5. BLANCO — FAQ ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <div className="faq-acc-wrap">
              <h2 className="faq-acc-title">{mc.faqTitle}</h2>
              <div className="faq-acc">
                {mc.faq.map((item, i) => (
                  <div key={i} className={`faq-acc-item${openFaq === i ? ' active' : ''}`}>
                    <div className="faq-acc-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {item.q}
                      <span className="faq-acc-indicator">▾</span>
                    </div>
                    <div className="faq-acc-content">
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>{/* /pd-bands */}

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-wave" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 52" preserveAspectRatio="none" style={{width:'100%',height:'54px',display:'block'}}>
            <rect width="150" height="52" fill="#fff"/>
            <path d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v52h-352z" fill="#111827"/>
          </svg>
        </div>
        <div className="lp-footer-body">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">Amelor</div>
            <p className="lp-footer-tagline">Tecnología que mejora tu vida diaria</p>
          </div>
          <div className="lp-footer-trust">
            <div className="lp-footer-ti"><span>🔒</span>Pago seguro</div>
            <div className="lp-footer-ti"><span>🚚</span>Envío gratis</div>
            <div className="lp-footer-ti"><span>🛡️</span>Garantía total</div>
            <div className="lp-footer-ti"><span>💳</span>3 cuotas sin interés</div>
          </div>
          <div className="lp-footer-pay">
            <span className="lp-footer-pay-label">Medios de pago aceptados</span>
            <div className="lp-footer-pay-row">
              <span className="lp-pay-chip">MercadoPago</span>
              <span className="lp-pay-chip">Visa</span>
              <span className="lp-pay-chip">Mastercard</span>
              <span className="lp-pay-chip">Amex</span>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Amelor · Todos los derechos reservados</span>
            {mc.whatsapp?.number && (
              <a href={`https://wa.me/${mc.whatsapp.number}`} className="lp-footer-wa" target="_blank" rel="noopener noreferrer">
                💬 Consultas por WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* ============================================================
          STICKY BAR
      ============================================================ */}
      <div className="pd-sticky-bar">
        <div className="pd-sticky-inner">
          <div className="pd-sticky-info">
            <div className="pd-sticky-prices">
              {!selectedBundle.soldOut && (
                <span className="pd-sticky-old">{fmt(selectedBundle.compareAt)}</span>
              )}
              <span className="pd-sticky-now">
                {selectedBundle.soldOut ? 'Agotado' : fmt(selectedBundle.price)}
              </span>
            </div>
            <span className="pd-sticky-qty">
              {selectedBundle.soldOut ? 'Elegí otro kit arriba' : selectedBundle.label.split('—')[0].trim()}
            </span>
          </div>
          <button
            className="pd-sticky-btn spf-sticky-btn"
            onClick={handleBuy}
            disabled={selectedBundle.soldOut || !product}
          >
            {mc.stickyBtnText}
          </button>
        </div>
        <p className="pd-cta-guarantee pd-sticky-grt--full">🛡️ Garantía 30 días — Si no te convence, te devolvemos el dinero entero</p>
        <p className="pd-cta-guarantee pd-sticky-grt--short">🛡️ Garantía 30 días</p>
      </div>

      <WaTab wa={mc.whatsapp} />

      {showSheet && <CheckoutSheet onClose={() => setShowSheet(false)} allowCod={allowCod} />}

      {/* ============================================================
          ESTILOS
      ============================================================ */}
      <style>{`

        /* ── Root ── */
        .spf-wrap { font-family: inherit; }

        /* ── Layout helpers ── */
        .dtx-container { width:100%; max-width:1180px; margin:0 auto; padding:0 16px; }
        .dtx-py { padding-top:44px; padding-bottom:44px; }
        .pd-info { display:flex; flex-direction:column; padding:20px 0; min-width:0; width:100%; max-width:100%; }
        @media (min-width:980px) { .pd-info { padding:28px 0; } }
        @media (max-width:980px) { .pd-info { padding:0 4px; box-sizing:border-box; } }
        .hero-top--compact { padding:6px 2px 0 !important; }

        /* ── Hero row ── */
        .pd-hero-row { display:block; }
        @media (min-width:980px) {
          .pd-hero-row { display:flex; align-items:flex-start; max-width:1180px; margin:0 auto; }
          .pd-hero-row .pd-media-fullwidth { flex:0 0 50%; max-width:50%; position:sticky; top:70px; align-self:flex-start; }
          .pd-hero-row .pd-container { flex:1; min-width:0; margin:0 !important; padding:0 28px 0 24px; max-width:50%; }
        }

        /* ── Product media ── */
        .pd-media-fullwidth { width:100%; }
        .pd-media { padding:0 !important; overflow:hidden; border-radius:0 !important; box-shadow:none !important; }
        .pd-mediaMain--bigger { position:relative; width:100%; background:#f8fafc; overflow:hidden; border-radius:0; height:520px; }
        @media (min-width:980px) { .pd-mediaMain--bigger { height:560px; border-radius:16px; } }
        @media (max-width:980px) { .pd-mediaMain--bigger { height:420px; } }
        @media (max-width:520px)  { .pd-mediaMain--bigger { height:360px; } }
        .pd-mainImg--anim { animation:spfFadeIn 150ms ease forwards; }
        @keyframes spfFadeIn { from{opacity:0;} to{opacity:1;} }

        /* ── Hero image placeholders ── */
        .spf-hero-ph { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:#f0f4f8; }
        .spf-hero-ph-icon { font-size:3.5rem; }
        .spf-hero-ph-text { font-size:.75rem; font-weight:600; color:rgba(11,18,32,.40); text-align:center; max-width:80%; line-height:1.4; }
        .spf-thumb-ph { width:100%; height:100%; background:#f0f4f8; display:grid; place-items:center; font-size:1.1rem; }

        /* ── Thumbs ── */
        .pd-thumbs-row { display:flex; gap:6px; padding:6px 8px; overflow-x:auto; scrollbar-width:none; justify-content:center; }
        .pd-thumbs-row::-webkit-scrollbar { display:none; }
        .pd-thumb { flex:1; min-width:0; max-width:90px; aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:2px solid rgba(0,0,0,.08); background:#f1f3f5; padding:0; cursor:pointer; transition:border-color .15s ease,opacity .15s ease; opacity:.65; }
        .pd-thumb.is-active { border-color:rgba(27,77,62,.7); opacity:1; }
        .pd-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        /* ── Hero info ── */
        .reviews-container { display:flex; align-items:center; justify-content:center; margin:5px 0; }
        .avatars { display:flex; margin-right:5px; margin-left:7px; }
        .avatar { width:28px; height:28px; border-radius:50%; border:2px solid #fff; margin-left:-7px; object-fit:cover; }
        .spf-avatar-init { display:grid; place-items:center; color:#fff; font-size:.68rem; font-weight:900; flex-shrink:0; }
        .text-grey { font-weight:normal; font-size:12px; color:#868686; line-height:0; }
        .text-grey strong { font-weight:800; color:#2e2f3c; }
        .hero-title--compact { margin:0 !important; text-align:center !important; font-size:32px !important; line-height:1.05 !important; font-weight:1100 !important; }
        @media (max-width:520px) { .hero-title--compact { font-size:26px !important; } }
        .hero-subtitle { text-align:center; font-weight:900; font-size:16px; margin-top:8px; }

        /* ── Countdown ── */
        .spf-countdown { display:flex; align-items:center; justify-content:center; gap:6px; margin:10px 0 4px; padding:8px 14px; border-radius:999px; background:rgba(229,62,62,.08); border:1px solid rgba(229,62,62,.15); font-size:.82rem; font-weight:800; color:rgba(180,30,30,.85); }
        .spf-countdown-label { color:rgba(11,18,32,.60); font-weight:700; }
        .spf-cd { font-variant-numeric:tabular-nums; letter-spacing:.04em; font-weight:900; color:rgba(180,30,30,.90); }

        /* ── Emoji bullets ── */
        .emoji-bullets { display:flex; flex-direction:column; gap:8px; margin:10px 0 4px; width:100%; }
        .emoji-bullet { font-size:.90rem; font-weight:700; color:rgba(11,18,32,.82); line-height:1.35; }
        @media (max-width:520px) { .emoji-bullet { font-size:.86rem; } }

        /* ── Trust tablets ── */
        .bnd2-tablets { display:flex; gap:8px; margin:12px 0 0; width:100%; }
        .bnd2-tablet { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 6px; border-radius:12px; border:1px solid rgba(11,18,32,.11); background:#fff; text-align:center; }
        .bnd2-tablet-ico   { font-size:1.25rem; line-height:1; }
        .bnd2-tablet-line1 { font-size:.72rem; font-weight:800; color:rgba(11,18,32,.80); line-height:1.2; }
        .bnd2-tablet-line2 { font-size:.65rem; font-weight:600; color:rgba(11,18,32,.48); line-height:1.2; }

        /* ── Bundle picker ── */
        .bnd2-wrap { display:flex; flex-direction:column; gap:10px; margin:14px 0 4px; }
        .bnd2-card { position:relative; border-radius:14px; border:1.5px solid rgba(11,18,32,.13); border-left:4px solid rgba(11,18,32,.10); background:#fff; cursor:pointer; transition:border-color .14s,background .14s,box-shadow .14s,border-left-color .14s; user-select:none; overflow:visible; padding:13px 14px 13px 12px; }
        .bnd2-card:hover:not(.spf-card--sold) { border-color:rgba(27,77,62,.30); border-left-color:rgba(27,77,62,.40); background:rgba(27,77,62,.02); }
        .bnd2-card--on { border-color:#1B4D3E !important; border-left:4px solid #1B4D3E !important; background:rgba(27,77,62,.04) !important; box-shadow:0 4px 18px rgba(27,77,62,.10); }
        .bnd2-card--pop { border-color:rgba(27,77,62,.25); border-left-color:rgba(27,77,62,.30); background:rgba(27,77,62,.02); margin-top:6px; }
        .bnd2-card--pop.bnd2-card--on { box-shadow:0 6px 22px rgba(27,77,62,.15); }
        .spf-card--sold { opacity:.50; cursor:not-allowed; border-left-color:rgba(11,18,32,.10) !important; }
        .bnd2-float-badge { position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#1B4D3E,#2F855A); color:#fff; font-size:.68rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; padding:3px 14px; border-radius:999px; white-space:nowrap; box-shadow:0 3px 10px rgba(27,77,62,.30); }
        .spf-sold-badge { background:rgba(11,18,32,.45); box-shadow:none; }
        .bnd2-row { display:flex; align-items:center; gap:10px; }
        .bnd2-radio { width:18px; height:18px; flex-shrink:0; accent-color:#1B4D3E; cursor:pointer; }
        .bnd2-center { flex:1; min-width:0; display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
        .bnd2-name { font-size:.91rem; font-weight:800; color:rgba(11,18,32,.88); line-height:1.2; }
        .bnd2-badge { font-size:.62rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:rgba(27,77,62,.10); color:#1B4D3E; border:1px solid rgba(27,77,62,.20); white-space:nowrap; }
        .bnd2-badge--pop { background:linear-gradient(135deg,#1B4D3E,#2F855A); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(27,77,62,.25); }
        .bnd2-prices { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
        .bnd2-was { font-size:.72rem; color:rgba(11,18,32,.35); text-decoration:line-through; font-weight:600; line-height:1.1; }
        .bnd2-now { font-size:1.10rem; font-weight:900; color:rgba(11,18,32,.90); line-height:1.1; }
        .spf-soldout-label { font-size:.78rem; font-weight:700; color:rgba(11,18,32,.38); }
        .bnd2-benefit { margin-top:8px; padding:8px 10px; border-radius:8px; background:rgba(27,77,62,.07); font-size:.80rem; font-weight:700; color:#1B4D3E; letter-spacing:.01em; line-height:1.35; }

        /* ── CTA rojo ── */
        .bnd2-cta.spf-cta { width:100%; padding:16px 20px; border-radius:14px; border:none; background:linear-gradient(135deg,#C53030 0%,#E53E3E 100%); color:#fff; font-size:1.05rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; cursor:pointer; box-shadow:0 6px 22px rgba(197,48,48,.30); transition:transform .12s,box-shadow .12s,background .14s; margin-top:4px; }
        .bnd2-cta.spf-cta:hover { background:linear-gradient(135deg,#9B2C2C 0%,#C53030 100%); box-shadow:0 8px 28px rgba(197,48,48,.38); transform:translateY(-1px); }
        .bnd2-cta.spf-cta:active { transform:translateY(0) scale(.98); }
        .bnd2-cta.spf-cta:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .pd-cta-guarantee { margin:6px 0 0; padding:0; text-align:center; font-size:12px; font-weight:600; color:rgba(11,18,32,.42); line-height:1.4; background:none; border:none; }
        .pd-cta-guarantee--light { color:rgba(255,255,255,.55); }
        .bnd2-urgency { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:999px; background:rgba(229,62,62,.08); border:1px solid rgba(229,62,62,.15); font-size:.80rem; font-weight:800; color:rgba(180,30,30,.85); letter-spacing:.02em; }
        .bnd2-urgency-dot { width:8px; height:8px; border-radius:50%; background:#e53e3e; flex-shrink:0; animation:spfPulse 1.4s ease-in-out infinite; }
        @keyframes spfPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,.55);} 50%{box-shadow:0 0 0 5px rgba(229,62,62,0);} }
        .bnd2-section-title { text-align:center; font-size:.88rem; font-weight:900; color:#1B4D3E; letter-spacing:.04em; margin-bottom:2px; }

        /* ── Bands ── */
        .pd-bands > section:first-child { padding-top:28px; }
        .pd-band--light { background:#ffffff; }
        .pd-band--blue  { background:#1B4D3E; }

        /* ── Sec head ── */
        .sec-head { text-align:center; margin:0 0 20px; }
        .sec-title { margin:0; font-weight:1100; letter-spacing:.06em; text-transform:uppercase; font-size:1.55rem; color:rgba(11,18,32,.92); }
        @media (min-width:900px) { .sec-title { font-size:1.85rem; } }
        .sec-sub { margin-top:8px; color:rgba(11,18,32,.60); font-weight:850; font-size:.95rem; }

        /* ── Wave divider ── */
        .wave-divider { position:relative; width:100%; overflow:hidden; background:var(--wave-top-color); line-height:0; pointer-events:none; margin-top:-1px; margin-bottom:-1px; }
        .waves-anim { display:block; width:100%; height:auto; max-height:3rem; margin:0; }
        @media (min-width:1000px) { .waves-anim { max-height:6rem; } }
        .parallax1>use { animation:wMove1 10s linear infinite; animation-delay:-2s; }
        .parallax2>use { animation:wMove2  8s linear infinite; opacity:.4; animation-delay:-2s; }
        .parallax3>use { animation:wMove3  6s linear infinite; opacity:.3; animation-delay:-2s; }
        .parallax4>use { animation:wMove4  4s linear infinite; opacity:.2; animation-delay:-2s; }
        @keyframes wMove1 { 0%{transform:translate(85px,0)}  100%{transform:translate(-90px,0)} }
        @keyframes wMove2 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)}  }
        @keyframes wMove3 { 0%{transform:translate(85px,0)}  100%{transform:translate(-90px,0)} }
        @keyframes wMove4 { 0%{transform:translate(-90px,0)} 100%{transform:translate(85px,0)}  }
        @media (prefers-reduced-motion:reduce) { .parallax1>use,.parallax2>use,.parallax3>use,.parallax4>use { animation:none !important; } }

        /* ── Mini reviews bar ── */
        .mrb { margin-top:14px; background:transparent; padding-bottom:28px; }
        .mrb-label { font-size:.70rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:rgba(11,18,32,.38); margin-bottom:8px; }
        .mrb-viewport { overflow:hidden; }
        .mrb-track { display:flex; width:100%; transition:transform .35s cubic-bezier(.4,0,.2,1); will-change:transform; }
        .mrb-slide { flex:0 0 100%; width:100%; }
        .mrb-card { background:#fff; border:1px solid rgba(2,8,23,.09); border-radius:14px; padding:12px 14px; box-shadow:0 2px 12px rgba(10,20,40,.07); display:flex; flex-direction:column; gap:8px; }
        .mrb-card-header { display:flex; align-items:center; gap:10px; }
        .mrb-card-avatar { width:34px; height:34px; border-radius:50%; color:#fff; font-weight:900; font-size:.95rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mrb-card-meta { display:flex; flex-direction:column; gap:2px; min-width:0; }
        .mrb-card-name { font-size:.80rem; font-weight:800; color:rgba(11,18,32,.82); line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mrb-card-stars .stars-inline .s { font-size:11px; }
        .mrb-card-text { margin:0; font-size:.84rem; font-style:italic; color:rgba(11,18,32,.65); font-weight:500; line-height:1.5; }
        .mrb-dots { display:flex; justify-content:center; gap:5px; margin-top:10px; }
        .mrb-dot { width:5px; height:5px; border-radius:999px; border:none; background:rgba(2,8,23,.18); cursor:pointer; padding:0; transition:width .22s ease,background .18s ease; }
        .mrb-dot.on { background:rgba(27,77,62,.80); width:16px; }

        /* ── Stars ── */
        .stars-inline { display:inline-flex; gap:2px; justify-content:center; }
        .stars-inline .s { opacity:.25; font-size:14px; }
        .stars-inline .s.on { opacity:1; color:#D69E2E; }

        /* ── Story blocks — pd-flow (idéntico a lámpara magnética) ── */
        .pd-flow { display:flex; flex-direction:column; gap:14px; }
        .flow-row { display:grid; grid-template-columns:1.1fr .9fr; gap:28px; align-items:center; }
        @media (max-width:900px) { .flow-row { grid-template-columns:1fr; } }
        .flow-text { display:flex; flex-direction:column; align-items:center; }
        .flow-badge { display:inline-flex; padding:4px 11px; border-radius:999px; background:rgba(27,77,62,.10); border:1px solid rgba(27,77,62,.18); font-weight:1100; color:rgba(11,18,32,.78); margin-bottom:6px; }
        .flow-media { width:100%; }
        .flow-imgBox { width:100%; max-width:520px; aspect-ratio:1/1; border-radius:18px; overflow:hidden; border:1px solid rgba(2,8,23,.08); background:#fff; margin-left:auto; box-shadow:0 8px 32px rgba(10,20,40,.10); transition:transform .28s ease,box-shadow .28s ease; }
        @media (max-width:900px) { .flow-imgBox { margin:0 auto; max-width:520px; } }
        .flow-imgBox img { width:100%; height:100%; object-fit:cover; display:block; }
        .flow-imgBox:hover { transform:translateY(-5px) scale(1.01); box-shadow:0 20px 56px rgba(10,20,40,.16); }
        .flow-title { text-align:center; text-transform:none; letter-spacing:-.02em; font-size:1.85rem; font-weight:900; color:rgba(11,18,32,.93); line-height:1.18; margin:0 0 12px; }
        @media (min-width:900px) { .flow-title { font-size:2.1rem; } }
        @media (max-width:520px) { .flow-title { font-size:1.55rem; } }
        .flow-p { margin:0; color:rgba(11,18,32,.62); line-height:1.68; font-weight:400; font-size:1.02rem; text-align:center; }
        .flow-p--rich { line-height:1.68; font-size:1.02rem; color:rgba(11,18,32,.62); font-weight:400; letter-spacing:.002em; }
        .flow-p--rich strong { color:rgba(11,18,32,.90); font-weight:700; }
        @media (min-width:900px) { .flow-p--rich { font-size:1.05rem; } }
        @media (max-width:520px) { .flow-p--rich { font-size:.97rem; line-height:1.62; } }
        .flow-text--rich .flow-title { margin-bottom:8px; }
        .flow-text--rich .flow-badge { margin-bottom:6px; }
        .spf-flow-ph { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:24px; box-sizing:border-box; }
        .spf-flow-ph-icon { font-size:3.5rem; }
        .spf-flow-ph-text { font-size:.78rem; font-weight:600; color:rgba(11,18,32,.38); text-align:center; line-height:1.45; }

        /* ── Video strip ── */
        .vstrip-section { margin-bottom:28px; }
        .vstrip-header { text-align:center; margin-bottom:16px; }
        .vstrip-kicker { display:inline-block; font-size:.68rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:#1B4D3E; background:rgba(27,77,62,.08); border:1px solid rgba(27,77,62,.15); padding:4px 12px; border-radius:999px; margin-bottom:10px; }
        .vstrip-title { font-size:1.18rem; font-weight:1000; letter-spacing:-.01em; color:rgba(11,18,32,.88); margin:0 0 5px; line-height:1.25; }
        @media (min-width:900px) { .vstrip-title { font-size:1.38rem; } }
        .vstrip-sub { font-size:.88rem; font-weight:600; color:rgba(11,18,32,.50); margin:0; }
        .vstrip-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .vstrip-item { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .vstrip-media { aspect-ratio:9/16; border-radius:20px; overflow:hidden; background:rgba(11,18,32,.05); position:relative; }
        .vstrip-video { width:100%; height:100%; object-fit:cover; display:block; }
        .vstrip-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(145deg,rgba(27,77,62,.08),rgba(27,77,62,.04)); border:1.5px dashed rgba(27,77,62,.20); }
        .vstrip-ph-ico { font-size:2rem; opacity:.35; color:#1B4D3E; }
        .vstrip-label { text-align:center; font-size:.75rem; font-weight:800; color:rgba(11,18,32,.55); letter-spacing:.04em; text-transform:uppercase; }

        /* ── Before/After slider ── */
        .ba-wrap { display:flex; justify-content:center; padding:4px 0 8px; }
        .ba-container { position:relative; overflow:hidden; border-radius:16px; --position:50%; width:100%; max-width:680px; box-shadow:0 16px 48px rgba(0,0,0,.28); cursor:col-resize; }
        .ba-img-wrap { display:grid; position:relative; user-select:none; min-height:280px; }
        .ba-img-after { display:block; width:100%; max-height:460px; min-height:280px; grid-area:1/1; object-fit:cover; object-position:center; }
        .ba-img-before { position:absolute; inset:0; width:var(--position); height:100%; overflow:hidden; }
        .ba-img-ph { background:rgba(255,255,255,.07); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; }
        .ba-img-ph--alt { background:rgba(0,0,0,.10); }
        .ba-img-ph-icon { font-size:3rem; }
        .ba-img-ph-text { font-size:.75rem; font-weight:700; color:rgba(255,255,255,.50); }
        .ba-badge { position:absolute; bottom:14px; background:rgba(255,255,255,.92); backdrop-filter:blur(6px); color:#0f172a; font-size:.78rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; padding:4px 10px; border-radius:999px; pointer-events:none; z-index:4; box-shadow:0 2px 8px rgba(0,0,0,.18); }
        .ba-badge-before { left:14px; }
        .ba-badge-after  { right:14px; }
        .ba-range { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index:10; margin:0; padding:0; -webkit-appearance:none; }
        .ba-line { position:absolute; inset:0; left:var(--position); transform:translateX(-50%); width:2px; height:100%; background:rgba(255,255,255,.9); pointer-events:none; z-index:5; }
        .ba-handle { position:absolute; top:50%; left:var(--position); transform:translate(-50%,-50%); width:40px; height:40px; background:rgba(255,255,255,.92); backdrop-filter:blur(4px); border-radius:999px; display:grid; place-items:center; pointer-events:none; z-index:6; box-shadow:0 2px 12px rgba(0,0,0,.30); color:#1e293b; }
        .spf-ba-hint { text-align:center; margin-top:14px; font-size:.85rem; color:rgba(255,255,255,.45); font-weight:600; }
        @media (max-width:520px) { .ba-container{border-radius:12px;} .ba-img-after{max-height:280px;} }

        /* ── Stats circles — sc-section (idéntico a lámpara magnética) ── */
        .sc-section { display:flex; flex-direction:column; gap:0; padding:28px 0 16px; width:100%; max-width:500px; margin:0 auto; }
        .sc-title { font-size:1.45rem; font-weight:1000; color:rgba(11,18,32,.90); text-align:center; margin:0 0 22px; line-height:1.2; letter-spacing:-.01em; }
        @media (max-width:520px) { .sc-title { font-size:1.18rem; } }
        .sc-list { display:flex; flex-direction:column; gap:0; }
        .sc-row { display:flex; align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid rgba(11,18,32,.06); }
        .sc-row:last-child { border-bottom:none; }
        .sc-circle { position:relative; width:58px; height:58px; border-radius:50%; flex-shrink:0; background:conic-gradient(from 0deg,#2F855A 0%,#1B4D3E var(--sc-pct,0%),rgba(11,18,32,.10) 0%); }
        .sc-circle::after { content:""; position:absolute; top:12%; left:12%; width:76%; height:76%; background:#fff; border-radius:50%; }
        .sc-pct { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:10px; font-weight:900; color:#1B4D3E; z-index:1; letter-spacing:-.02em; }
        .sc-text { font-size:.88rem; font-weight:500; color:rgba(11,18,32,.70); line-height:1.5; margin:0; }
        .sc-text strong { color:rgba(11,18,32,.88); font-weight:800; }
        .sc-footer { margin-top:22px; padding-top:18px; border-top:1px solid rgba(11,18,32,.08); text-align:center; }
        .sc-footer-note { font-size:.72rem; color:rgba(11,18,32,.40); margin:0 0 14px; font-style:italic; }
        .sc-footer-stats { display:flex; justify-content:center; gap:0; }
        .sc-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 8px; border-right:1px solid rgba(11,18,32,.08); }
        .sc-stat:last-child { border-right:none; }
        .sc-stat-val { font-size:1.10rem; font-weight:1000; color:#1B4D3E; letter-spacing:-.01em; }
        .sc-stat-lbl { font-size:.62rem; font-weight:800; color:rgba(11,18,32,.45); letter-spacing:.08em; text-transform:uppercase; }
        .pd-band--blue .sc-title { color:rgba(255,255,255,.92); }
        .pd-band--blue .sc-row { border-bottom-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-circle { background:conic-gradient(from 0deg,#2F855A 0%,#4ade80 var(--sc-pct,0%),rgba(255,255,255,.10) 0%); }
        .pd-band--blue .sc-circle::after { background:#1B4D3E; }
        .pd-band--blue .sc-pct { color:#4ade80; }
        .pd-band--blue .sc-text { color:rgba(226,232,240,.70); }
        .pd-band--blue .sc-text strong { color:rgba(255,255,255,.90); }
        .pd-band--blue .sc-footer { border-top-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-footer-note { color:rgba(226,232,240,.40); }
        .pd-band--blue .sc-stat { border-right-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-stat-val { color:#4ade80; }
        .pd-band--blue .sc-stat-lbl { color:rgba(226,232,240,.45); }

        /* ── Cómo se usa ── */
        .pd-howto-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-top:24px; }
        @media (min-width:900px) { .pd-howto-grid { grid-template-columns:repeat(4,1fr); gap:24px; } }
        .pd-howto-card { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
        .pd-howto-img-wrap { width:100%; aspect-ratio:1/1; border-radius:16px; overflow:hidden; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.10); }
        .pd-howto-img { width:100%; height:100%; object-fit:cover; display:block; }
        .pd-howto-num { width:40px; height:40px; border-radius:50%; border:2px solid rgba(255,255,255,.35); background:rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:900; color:rgba(255,255,255,.90); flex-shrink:0; }
        .pd-howto-text { margin:0; font-size:.84rem; font-weight:700; color:rgba(255,255,255,.75); line-height:1.45; }
        .spf-howto-ph { width:100%; height:100%; background:rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; }
        .spf-howto-ph-num { font-size:2rem; font-weight:1100; color:rgba(255,255,255,.20); }

        /* ── Reviews with bars ── */
        .spf-rwb { width:100%; }
        .spf-rwb-score-row { display:flex; flex-direction:column; align-items:center; gap:20px; margin:0 0 8px; }
        @media (min-width:640px) { .spf-rwb-score-row { flex-direction:row; align-items:flex-start; justify-content:center; gap:40px; } }
        .spf-rwb-score-big { display:flex; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; }
        .spf-rwb-score-num { font-size:3.5rem; font-weight:1100; color:rgba(11,18,32,.92); line-height:1; letter-spacing:-.04em; }
        .spf-rwb-stars { gap:4px !important; }
        .spf-rwb-stars .s { font-size:20px !important; }
        .spf-rwb-score-count { font-size:.80rem; font-weight:700; color:rgba(11,18,32,.45); }
        .spf-rwb-bars { display:flex; flex-direction:column; gap:8px; width:100%; max-width:320px; }
        .spf-rwb-bar-row { display:flex; align-items:center; gap:8px; }
        .spf-rwb-bar-label { font-size:.78rem; font-weight:700; color:rgba(11,18,32,.65); white-space:nowrap; min-width:18px; text-align:right; }
        .spf-rwb-bar-track { flex:1; height:8px; border-radius:999px; background:rgba(11,18,32,.10); overflow:hidden; }
        .spf-rwb-bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#1B4D3E,#2F855A); transition:width .6s cubic-bezier(.4,0,.2,1); }
        .spf-rwb-bar-pct { font-size:.72rem; font-weight:700; color:rgba(11,18,32,.45); white-space:nowrap; min-width:30px; }

        /* ── Reviews carousel ── */
        .spf-rv-ph { width:100%; height:100%; background:#f0f4f8; display:grid; place-items:center; font-size:3rem; }
        .rv-wrap { position:relative; margin-top:14px; }
        .rv-row { display:flex; gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; padding:10px 6px 16px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .rv-row::-webkit-scrollbar { display:none; }
        .rv-slide { scroll-snap-align:center; flex:0 0 auto; width:min(520px,88vw); }
        .rv-card { background:#fff; border:1px solid rgba(2,8,23,.10); border-radius:22px; box-shadow:0 22px 70px rgba(10,20,40,.16); overflow:hidden; }
        .rv-imgBox { position:relative; width:100%; aspect-ratio:4/3; background:#f1f5f9; }
        .rv-quote { position:absolute; right:14px; bottom:14px; width:46px; height:46px; border-radius:999px; background:#C53030; color:#fff; display:grid; place-items:center; font-weight:1100; box-shadow:0 16px 40px rgba(197,48,48,.35); font-size:1.5rem; }
        .rv-body { padding:16px 16px 18px; display:flex; flex-direction:column; gap:8px; text-align:center; min-height:160px; }
        .rv-title { font-weight:1100; text-transform:uppercase; letter-spacing:.05em; color:rgba(11,18,32,.92); font-size:.88rem; }
        .rv-text { margin:0; color:rgba(11,18,32,.70); line-height:1.6; font-weight:650; font-size:.88rem; overflow:hidden; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; }
        .rv-name { margin-top:4px; font-weight:900; color:rgba(11,18,32,.62); font-size:.85rem; }
        .rv-nav { position:absolute; top:45%; transform:translateY(-50%); width:44px; height:44px; border-radius:999px; border:1px solid rgba(2,8,23,.10); background:rgba(255,255,255,.95); box-shadow:0 18px 55px rgba(10,20,40,.18); cursor:pointer; display:grid; place-items:center; font-size:24px; z-index:10; }
        .rv-prev { left:-8px; } .rv-next { right:-8px; }
        @media (max-width:560px) { .rv-nav { display:none; } }
        .rv-dots { display:flex; justify-content:center; gap:8px; margin-top:10px; }
        .rv-dot { width:8px; height:8px; border-radius:999px; border:none; background:rgba(2,8,23,.18); cursor:pointer; transition:transform .18s ease,background .18s ease; padding:0; }
        .rv-dot.on { background:rgba(27,77,62,.95); transform:scale(1.25); }

        /* ── Guarantee medal ── */
        .grt-section { text-align:center; padding:56px 20px 52px; display:flex; flex-direction:column; align-items:center; }
        .grt-medal {
          width:180px; height:180px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:28px; flex-shrink:0;
          filter:drop-shadow(0 12px 32px rgba(218,165,32,.60)); animation:grtShine 3.5s ease-in-out infinite;
          background:
            radial-gradient(circle at 38% 32%,rgba(255,245,120,.55) 0%,transparent 38%),
            conic-gradient(#9A6B00 0deg,#FFD700 8deg,#DAA520 16deg,#FFD700 24deg,#9A6B00 32deg,#FFD700 40deg,#DAA520 48deg,#FFD700 56deg,#9A6B00 64deg,#FFD700 72deg,#DAA520 80deg,#FFD700 88deg,#9A6B00 96deg,#FFD700 104deg,#DAA520 112deg,#FFD700 120deg,#9A6B00 128deg,#FFD700 136deg,#DAA520 144deg,#FFD700 152deg,#9A6B00 160deg,#FFD700 168deg,#DAA520 176deg,#FFD700 184deg,#9A6B00 192deg,#FFD700 200deg,#DAA520 208deg,#FFD700 216deg,#9A6B00 224deg,#FFD700 232deg,#DAA520 240deg,#FFD700 248deg,#9A6B00 256deg,#FFD700 264deg,#DAA520 272deg,#FFD700 280deg,#9A6B00 288deg,#FFD700 296deg,#DAA520 304deg,#FFD700 312deg,#9A6B00 320deg,#FFD700 328deg,#DAA520 336deg,#FFD700 344deg,#9A6B00 352deg,#FFD700 360deg);
          clip-path:polygon(50% 0%,55% 4%,62% 2%,65% 7%,72% 6%,74% 12%,81% 12%,82% 18%,89% 20%,88% 27%,95% 30%,92% 37%,99% 41%,95% 48%,100% 53%,95% 59%,99% 65%,93% 70%,96% 77%,89% 80%,90% 87%,83% 89%,82% 96%,74% 96%,71% 100%,64% 97%,59% 100%,53% 97%,47% 100%,41% 97%,36% 100%,29% 97%,26% 96%,18% 96%,17% 89%,10% 87%,11% 80%,4% 77%,7% 70%,1% 65%,5% 59%,0% 53%,5% 48%,1% 41%,8% 37%,5% 30%,12% 27%,11% 20%,18% 18%,19% 12%,26% 12%,28% 6%,35% 7%,38% 2%,45% 4%);
        }
        @keyframes grtShine { 0%,100%{filter:drop-shadow(0 10px 28px rgba(218,165,32,.55));} 50%{filter:drop-shadow(0 14px 44px rgba(255,215,0,.85));} }
        @media (prefers-reduced-motion:reduce) { .grt-medal{animation:none;} }
        .grt-medal-face { width:136px; height:136px; border-radius:50%; background:linear-gradient(160deg,#1c1a0e 0%,#0b172a 55%,#060d1a 100%); border:2px solid rgba(255,215,0,.22); box-shadow:inset 0 3px 10px rgba(0,0,0,.50),inset 0 -1px 4px rgba(255,215,0,.10); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; }
        .grt-medal-sup { font-size:.50rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; color:#FFD700; line-height:1.2; }
        .grt-medal-num { font-size:3.6rem; font-weight:1100; line-height:.95; color:#FFD700; letter-spacing:-.06em; text-shadow:0 2px 14px rgba(255,215,0,.50); }
        .grt-medal-bot { font-size:.65rem; font-weight:900; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,215,0,.75); line-height:1.2; }
        .grt-title { margin:0 0 14px; font-weight:1100; letter-spacing:.03em; text-transform:uppercase; font-size:2.1rem; line-height:1.05; color:#fff; }
        @media (max-width:520px) { .grt-title{font-size:1.6rem;} .grt-medal{width:148px;height:148px;} .grt-medal-face{width:112px;height:112px;} .grt-medal-num{font-size:2.9rem;} }
        .grt-sub { margin:0 auto 28px; max-width:420px; font-weight:700; font-size:1rem; color:rgba(255,255,255,.65); line-height:1.70; white-space:pre-line; }
        .grt-pills { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:32px; }
        .grt-pill { padding:9px 16px; border-radius:999px; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05); font-weight:800; font-size:.83rem; color:rgba(255,255,255,.78); white-space:nowrap; }
        .grt-cta.spf-grt-cta { display:inline-block; padding:16px 42px; border:none; border-radius:14px; background:linear-gradient(135deg,#C53030 0%,#E53E3E 100%); color:#fff; font-weight:1100; font-size:1rem; letter-spacing:.04em; cursor:pointer; font-family:inherit; box-shadow:0 14px 42px rgba(197,48,48,.35); transition:transform .15s ease,box-shadow .15s ease; }
        .grt-cta.spf-grt-cta:hover { transform:translateY(-2px); box-shadow:0 20px 52px rgba(197,48,48,.50); }
        .grt-cta.spf-grt-cta:active { transform:scale(.98); }
        @media (max-width:520px) { .grt-section{padding:44px 16px 40px;} .grt-pill{font-size:.79rem;padding:8px 12px;} .grt-cta.spf-grt-cta{width:100%;padding:16px;} }

        /* ── FAQ ── */
        .faq-acc-wrap { width:100%; max-width:760px; margin:0 auto; padding:24px 0 8px; }
        .faq-acc-title { font-size:1.55rem; font-weight:900; color:rgba(11,18,32,.90); text-align:center; margin:0 0 24px; letter-spacing:-.02em; line-height:1.2; }
        @media (max-width:520px) { .faq-acc-title{font-size:1.25rem;} }
        .faq-acc { width:100%; border-radius:5px; }
        .faq-acc-item { border-bottom:1px solid #ccc; margin-bottom:3px; }
        .faq-acc-item:last-child { border-bottom:none; }
        .faq-acc-header { padding:14px 8px; cursor:pointer; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; color:rgba(11,18,32,.88); user-select:none; line-height:1.4; transition:color .2s ease; }
        .faq-acc-header:hover { color:#1B4D3E; }
        .faq-acc-item.active .faq-acc-header { color:#1B4D3E; }
        .faq-acc-indicator { font-size:1.4em; margin-left:12px; flex-shrink:0; color:#1B4D3E; font-weight:400; line-height:1; transition:transform .3s ease; display:inline-block; }
        .faq-acc-item.active .faq-acc-indicator { transform:rotate(180deg); }
        .faq-acc-content { max-height:0; overflow:hidden; padding:0 10px; transition:max-height .35s ease,padding .3s ease; }
        .faq-acc-content p { margin:6px 0 14px; font-size:13.5px; color:rgba(11,18,32,.62); line-height:1.6; }
        .faq-acc-item.active .faq-acc-content { max-height:300px; padding:4px 10px 4px; }

        /* ── Sticky bar ── */
        .pd-sticky-bar { position:fixed; left:50%; bottom:18px; width:min(calc(100% - 24px),560px); transform:translateX(-50%) translateY(100%); opacity:0; pointer-events:none; transition:opacity .3s ease, transform .3s ease; z-index:9999; display:flex; flex-direction:column; align-items:center; gap:3px; background:rgba(255,255,255,.97); backdrop-filter:blur(14px); border:1px solid rgba(11,18,32,.10); border-radius:20px; padding:9px 10px 7px 20px; box-shadow:0 22px 54px rgba(2,8,23,.22); overflow:hidden; }
        .pd-sticky-bar.sticky--visible { opacity:1; transform:translateX(-50%) translateY(0); pointer-events:auto; }
        .pd-sticky-inner { display:flex; align-items:center; gap:12px; width:100%; }
        .pd-sticky-bar .pd-cta-guarantee { font-size:11px; margin:0; color:rgba(11,18,32,.38); }
        .pd-sticky-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:0; }
        .pd-sticky-prices { display:flex; flex-direction:column; gap:0; }
        .pd-sticky-old { color:rgba(11,18,32,.38); font-weight:700; text-decoration:line-through; font-size:.65rem; white-space:nowrap; line-height:1.3; }
        .pd-sticky-now { font-weight:900; color:rgba(11,18,32,.92); font-size:.92rem; white-space:nowrap; line-height:1.25; }
        .pd-sticky-qty { font-size:.58rem; font-weight:600; color:#1B4D3E; white-space:nowrap; line-height:1.3; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
        .pd-sticky-btn.spf-sticky-btn { flex-shrink:0; border:none; background:linear-gradient(135deg,#C53030 0%,#E53E3E 100%); color:#fff; font-weight:900; font-size:.80rem; border-radius:999px; padding:11px 18px; cursor:pointer; box-shadow:0 6px 20px rgba(197,48,48,.28); letter-spacing:.04em; text-transform:uppercase; transition:transform .12s ease,box-shadow .12s ease; white-space:nowrap; }
        .pd-sticky-btn.spf-sticky-btn:active { transform:scale(.98); box-shadow:0 4px 14px rgba(197,48,48,.22); }
        .pd-sticky-btn.spf-sticky-btn:disabled { opacity:.50; cursor:not-allowed; }
        .pd-sticky-grt--short { display:none; }
        @media (max-width:540px) {
          .pd-sticky-bar { padding:8px 8px 7px 14px; }
          .pd-sticky-inner { gap:8px; }
          .pd-sticky-btn.spf-sticky-btn { font-size:.72rem; padding:10px 12px; }
          .pd-sticky-grt--full { display:none; }
          .pd-sticky-grt--short { display:block; }
        }
        @media (max-width:389px) {
          .pd-sticky-bar { padding:6px 6px 5px 10px; width:min(calc(100% - 16px),560px); }
          .pd-sticky-inner { gap:4px; }
          .pd-sticky-now { font-size:.78rem; }
          .pd-sticky-qty { display:none; }
          .pd-sticky-btn.spf-sticky-btn { font-size:.66rem; padding:9px 10px; }
        }

        /* ── WhatsApp tab ── */
        .wa-tab { position:fixed; right:16px; bottom:104px; z-index:9998; display:grid; place-items:center; background:#25D366; border-radius:999px; width:36px; height:36px; text-decoration:none; box-shadow:0 4px 14px rgba(37,211,102,.40); }

        /* ── Landing Footer ── */
        .lp-footer { font-family:inherit; }
        .lp-footer-wave { line-height:0; display:block; }
        .lp-footer-body { background:#111827; padding:32px 20px; padding-bottom:max(90px, calc(env(safe-area-inset-bottom) + 90px)); }
        .lp-footer-brand { text-align:center; margin-bottom:24px; }
        .lp-footer-logo { font-size:1.5rem; font-weight:900; color:#fff; letter-spacing:-.02em; line-height:1; }
        .lp-footer-tagline { font-size:.78rem; color:rgba(255,255,255,.38); margin:5px 0 0; }
        .lp-footer-trust { display:flex; flex-wrap:wrap; justify-content:center; gap:6px 18px; margin-bottom:24px; }
        .lp-footer-ti { display:flex; align-items:center; gap:5px; font-size:.80rem; font-weight:700; color:rgba(255,255,255,.65); }
        .lp-footer-ti > span { font-size:.95rem; line-height:1; }
        .lp-footer-pay { text-align:center; margin-bottom:22px; }
        .lp-footer-pay-label { font-size:.62rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:rgba(255,255,255,.28); display:block; margin-bottom:8px; }
        .lp-footer-pay-row { display:flex; justify-content:center; gap:6px; flex-wrap:wrap; }
        .lp-pay-chip { font-size:.68rem; font-weight:700; color:rgba(255,255,255,.50); background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.11); padding:4px 10px; border-radius:6px; }
        .lp-footer-bottom { border-top:1px solid rgba(255,255,255,.08); padding-top:16px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
        .lp-footer-bottom > span { font-size:.68rem; color:rgba(255,255,255,.28); }
        .lp-footer-wa { font-size:.76rem; font-weight:700; color:rgba(255,255,255,.50); text-decoration:none; }
        .lp-footer-wa:hover { color:#fff; }

      `}</style>
    </div>
  );
}
