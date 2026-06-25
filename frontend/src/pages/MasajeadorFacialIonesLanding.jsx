import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { CheckoutSheet } from './CheckoutSheet';
import { useCart } from '../context/CartContext';
import { track } from '../lib/metaPixel';
import mc from '../landings/masajeador-facial-iones-lambo';

/* ============================================================
   WAVE SEPARATOR
============================================================ */
function WaveSeparator({ from }) {
  const topColor  = from === 'blue' ? '#8B1A4A' : '#FFF5F8';
  const fillColor = from === 'blue' ? '#FFF5F8' : '#8B1A4A';
  return (
    <div className="wave-divider" style={{ '--wave-top-color': topColor }}>
      <svg className="waves-anim" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
        <defs>
          <path id="lam-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax1"><use xlinkHref="#lam-gentle-wave" x="48" y="0" fill={fillColor} /></g>
        <g className="parallax2"><use xlinkHref="#lam-gentle-wave" x="48" y="3" fill={fillColor} /></g>
        <g className="parallax3"><use xlinkHref="#lam-gentle-wave" x="48" y="5" fill={fillColor} /></g>
        <g className="parallax4"><use xlinkHref="#lam-gentle-wave" x="48" y="7" fill={fillColor} /></g>
      </svg>
    </div>
  );
}

/* ============================================================
   COUNTDOWN TIMER
============================================================ */
function CountdownTimer({ storageKey = 'lam_countdown', minutes = 18 }) {
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
  const avatarColors = ['#8B1A4A', '#C2185B', '#A0154E', '#8B1A4A', '#9C1B55'];
  useEffect(() => {
    if (!reviews.length) return;
    const t = setInterval(() => setActive(i => (i + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [reviews.length]);
  if (!reviews.length) return null;
  const rev = reviews[active];
  const prev = () => setActive(i => (i - 1 + reviews.length) % reviews.length);
  const next = () => setActive(i => (i + 1) % reviews.length);
  const avatarSrc = rev.mrbImg || rev.img;
  return (
    <div className="mrb">
      <div className="mrb-label">LO QUE DICEN NUESTRAS CLIENTAS</div>
      <div className="mrb-card">
        <div className="mrb-avatar-wrap">
          {avatarSrc
            ? <img className="mrb-avatar-img" src={avatarSrc} alt={rev.name} />
            : <div className="mrb-avatar-fallback" style={{ background: avatarColors[active % avatarColors.length] }}>
                {(rev.name || '?').charAt(0).toUpperCase()}
              </div>
          }
        </div>
        <div className="mrb-content">
          <p className="mrb-text">{rev.text.slice(0, 120)}{rev.text.length > 120 ? '…' : ''}</p>
          <div className="mrb-meta">
            <span className="mrb-name">{rev.name}</span>
            <span className="mrb-stars">{'★'.repeat(rev.rating)}</span>
          </div>
        </div>
      </div>
      <div className="mrb-nav">
        <button className="mrb-arrow" onClick={prev} aria-label="Anterior">‹</button>
        <div className="mrb-dots">
          {reviews.map((_, i) => (
            <button key={i} className={`mrb-dot${i === active ? ' on' : ''}`} onClick={() => setActive(i)} aria-label={`Reseña ${i + 1}`} />
          ))}
        </div>
        <button className="mrb-arrow" onClick={next} aria-label="Siguiente">›</button>
      </div>
    </div>
  );
}

/* ============================================================
   VIDEO STRIP — resolución automática de URL
============================================================ */
function resolveMedia(url) {
  if (!url) return null;
  const shorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shorts) return { type: 'iframe', src: `https://www.youtube.com/embed/${shorts[1]}?autoplay=1&mute=1&loop=1&playlist=${shorts[1]}&controls=0&playsinline=1&rel=0&modestbranding=1` };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}&controls=0&playsinline=1&rel=0&modestbranding=1` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&loop=1&background=1&byline=0&title=0` };
  if (/\.(mp4|mov|webm|ogg)(\?|$)/i.test(url)) return { type: 'video', src: url };
  if (/\.gif(\?|$)/i.test(url)) return { type: 'gif', src: url };
  return { type: 'image', src: url };
}

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
        {videos.map((v, i) => {
          const resolved = resolveMedia(v.videoUrl || v.imgUrl);
          return (
            <div key={i} className="vstrip-item">
              <div className="vstrip-media">
                {resolved?.type === 'iframe' ? (
                  <iframe
                    className="vstrip-video"
                    src={resolved.src}
                    title={v.label}
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                  />
                ) : resolved?.type === 'video' ? (
                  <video autoPlay muted loop playsInline className="vstrip-video" aria-label={v.label}>
                    <source src={resolved.src} type="video/mp4" />
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
              {v.benefit && <div className="vstrip-benefit">{v.benefit}</div>}
            </div>
          );
        })}
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
            : <div className="ba-img-after ba-img-ph"><span className="ba-img-ph-icon">✨</span><span className="ba-img-ph-text">{afterLabel}</span></div>
          }
          <div className="ba-img-before">
            {imgBefore
              ? <img src={imgBefore} alt={beforeLabel} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'left center', display:'block' }} />
              : <div className="ba-img-ph ba-img-ph--alt"><span className="ba-img-ph-icon">👁️</span><span className="ba-img-ph-text">{beforeLabel}</span></div>
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
   STATS CIRCLES
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
      {mc.statsTitle && <h2 className="sc-title">{mc.statsTitle}</h2>}
      <div className="sc-list">
        {items.map((item, i) => (
          <div key={i} className="sc-row" ref={el => circleRefs.current[i] = el} data-idx={i}>
            <div className="sc-circle" style={{ "--sc-pct": `${values[i]}%` }}>
              <span className="sc-pct">{values[i]}%</span>
            </div>
            <p className="sc-text" dangerouslySetInnerHTML={{ __html: item.text }} />
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
   REVIEWS WITH BARS
============================================================ */
function ReviewsWithBars({ reviews = [], distribution = [], title, subtitle, score = 4.9, count = 0 }) {
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
                    : <div className="spf-rv-ph" aria-label={r.imgAlt || `Foto de ${r.name}`}>💡</div>
                  }
                  <div className="rv-quote">"</div>
                </div>
                <div className="rv-body">
                  <div className="stars-inline">
                    {[1,2,3,4,5].map(s => <span key={s} className={`s${s <= r.rating ? ' on' : ''}`}>★</span>)}
                  </div>
                  <div className="rv-title">{r.title}</div>
                  <p className="rv-text">{r.text}</p>
                  <div className="rv-name">— {r.name}{r.age ? `, ${r.age} años` : ''}</div>
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
   TRUST PILLS (3 desplegables debajo del CTA)
============================================================ */
function TrustPills() {
  const [open, setOpen] = useState(null);
  const pills = [
    {
      icon: '🛡️',
      title: 'Probala 30 días sin riesgo',
      body: 'Tenemos una política de prueba de 30 días. Si no ves ninguna diferencia en tu piel, podés devolverla y te reembolsamos el dinero entero. Sin formularios, sin preguntas — solo mandás un WhatsApp y listo.',
    },
    {
      icon: '💳',
      title: '3 cuotas sin interés',
      body: 'Pagá en 3 cuotas iguales con todas las tarjetas de crédito. Sin recargo, sin costo adicional. El precio que ves es el precio final.\n\nProcesamos todos los pagos a través de MercadoPago.',
    },
    {
      icon: '🚚',
      title: 'Envío gratis a todo el país',
      body: 'Realizamos envíos rápidos a todo el país a través de Correo Argentino & Andreani. Todos los pedidos se despachan en menos de 24hs hábiles y se envía el código de seguimiento por WhatsApp.\n\nBuenos Aires y alrededores: 1 a 3 días hábiles.\nResto del país: 2 a 6 días hábiles.',
    },
  ];
  return (
    <div className="tpills">
      {pills.map((p, i) => (
        <div key={i} className={`tpill${open === i ? ' tpill--open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
          <div className="tpill-hd">
            <span className="tpill-ico">{p.icon}</span>
            <span className="tpill-title">{p.title}</span>
            <span className="tpill-chevron">{open === i ? '−' : '+'}</span>
          </div>
          {open === i && <div className="tpill-body">{p.body}</div>}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   CIRCULACIÓN FACIAL
============================================================ */
function CirculacionSection({ mc }) {
  const d = mc.circulacion;
  if (!d) return null;
  return (
    <div className="circ-section">
      {/* 1. Título principal */}
      <h2 className="circ-title">{d.title}</h2>
      {/* 2. Primera imagen */}
      {d.img && <img className="circ-img" src={d.img} alt={d.imgAlt || ''} loading="lazy" />}
      {/* 3. Quote + párrafo */}
      {d.quote && <p className="circ-quote">{d.quote}</p>}
      {d.textHtml && <p className="circ-text" dangerouslySetInnerHTML={{ __html: d.textHtml }} />}
      {/* 4. Título "La buena noticia" */}
      {d.buenaNoticia && <h2 className="circ-title-buena">{d.buenaNoticia}</h2>}
      {/* 5. Segunda imagen */}
      {d.img2 && <img className="circ-img" src={d.img2} alt={d.img2Alt || ''} loading="lazy" />}
      {/* 6. "Recupera tu Rostro" + badge + bullets + footnote */}
      {d.title2 && <h2 className="circ-title2">{d.title2}</h2>}
      {d.ctaBadge && <div className="circ-badge-pill"><span className="circ-badge-dot" />{d.ctaBadge}</div>}
      {d.bullets?.length > 0 && (
        <ul className="circ-bullets">
          {d.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {d.footnote && <p className="circ-footnote">{d.footnote}</p>}
    </div>
  );
}

/* ============================================================
   4 SEMANAS TIMELINE
============================================================ */
function CuatroSemanasSection({ mc }) {
  const d = mc.cuatroSemanas;
  if (!d) return null;
  return (
    <div className="semanas-section">
      <h2 className="semanas-title">
        {d.title}<br /><span className="semanas-accent">{d.titleAccent}</span>
      </h2>
      {d.subtitle && <p className="semanas-sub">{d.subtitle}</p>}
      <div className="semanas-list">
        {d.weeks.map((w, i) => (
          <div key={i} className="semana-row">
            <div className="semana-left">
              <span className="semana-badge">{w.label}</span>
              {i < d.weeks.length - 1 && <div className="semana-line" />}
            </div>
            <div className="semana-content">
              <h3 className="semana-content-title">{w.title}</h3>
              <p className="semana-content-desc">{w.desc}</p>
            </div>
          </div>
        ))}
      </div>
      {d.img && <img className="semanas-img" src={d.img} alt={d.imgAlt || ''} loading="lazy" />}
    </div>
  );
}

/* ============================================================
   3 PASOS
============================================================ */
function TresPasosSection({ mc, onBuy }) {
  const d = mc.tresPasos;
  if (!d) return null;
  return (
    <div className="pasos-section">
      {d.kicker && <div className="pasos-kicker">{d.kicker}</div>}
      <h2 className="pasos-title">{d.title}</h2>
      {d.subtitle && <p className="pasos-sub">{d.subtitle}</p>}
      <div className="pasos-list">
        {d.steps.map((s, i) => (
          <div key={i} className="paso-item">
            <div className="paso-circle-wrap">
              {s.img
                ? <img className="paso-circle-img" src={s.img} alt={s.imgAlt || s.title} loading="lazy" />
                : <div className="paso-circle-ph" />
              }
              <span className="paso-num-badge">{s.num}</span>
            </div>
            <h3 className="paso-title">{s.title}</h3>
            <p className="paso-desc">{s.desc}</p>
          </div>
        ))}
      </div>
      {d.ctaText && (
        <button className="pasos-cta" onClick={onBuy}>{d.ctaText}</button>
      )}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function MasajeadorFacialIonesLanding() {
  const [product,      setProduct]      = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(mc.bundles[0]);
  const [openFaq,      setOpenFaq]      = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/slug/${mc.productSlug}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => { setProductReady(true); });
  }, []);

  useEffect(() => {
    track('ViewContent', { content_name: mc.checkoutName, content_type: 'product', currency: 'ARS', value: mc.bundles?.[0]?.price || 0 });
  }, []);

  useEffect(() => {
    if (!productReady) return;
    const heroCTA = document.querySelector('.bnd2-cta');
    const stickyBar = document.querySelector('.pd-sticky-bar');
    if (!heroCTA || !stickyBar) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastCta = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        stickyBar.classList.toggle('sticky--visible', pastCta);
        const waTab = document.querySelector('.wa-tab');
        if (waTab) waTab.classList.toggle('wa-tab--raised', pastCta);
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
    if (product?.imageUrl) arr.push({ src: product.imageUrl, alt: 'Masajeador Facial 5 en 1 Lambo Lady LT-25M33' });
    if (Array.isArray(product?.images)) {
      product.images.forEach(x => {
        const url = typeof x === 'string' ? x : x?.url;
        if (url && !arr.find(a => a.src === url)) arr.push({ src: url, alt: 'Masajeador Facial 5 en 1 Lambo Lady LT-25M33' });
      });
    }
    return arr.length ? arr : mc.heroImages;
  }, [product]);

  const handleBuy = () => {
    if (!product || selectedBundle.soldOut) return;
    addItem(
      { ...product, name: `${mc.checkoutName} — ${selectedBundle.label}` },
      1,
      { bundleTotal: selectedBundle.price, compareAtPrice: selectedBundle.compareAt, gifts: selectedBundle.gifts || [], bundleImgs: selectedBundle.imgs || [] },
    );
    track('InitiateCheckout', {
      value: Number(selectedBundle.price) || 0,
      currency: 'ARS',
      content_name: mc.checkoutName,
    });
    setShowCheckout(true);
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  if (!productReady) {
    return (
      <>
        <style>{`@keyframes _lamBar{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ minHeight:'100vh', background:'#fff' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#AD1457,#C2185B,#AD1457)', backgroundSize:'200% 100%', animation:'_lamBar 1.1s linear infinite' }} />
        </div>
      </>
    );
  }

  const activeImg = heroImgs[activeImgIdx] || heroImgs[0] || { src: '', alt: 'Masajeador Facial 5 en 1 Lambo Lady LT-25M33' };

  return (
    <>
    <div className="spf-wrap">

      {/* ── MARQUEE ── */}
      <div className="ems-mq" aria-hidden="true">
        <div className="ems-mq__track">
          {['💕 +280 compradoras felices', '✨ 5 tecnologías profesionales en un solo dispositivo', '🛡️ 30 días de garantía total', '🚚 Envío gratis a todo el país', '💕 +280 compradoras felices', '✨ 5 tecnologías profesionales en un solo dispositivo', '🛡️ 30 días de garantía total', '🚚 Envío gratis a todo el país'].map((t, i) => (
            <span key={i} className="ems-mq__item">{t}</span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
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
                    style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center center', display:'block' }}
                  />
                ) : (
                  <div className="spf-hero-ph" aria-label={activeImg.alt}>
                    <span className="spf-hero-ph-icon">✨</span>
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
                    : <div className="spf-thumb-ph">✨</div>
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
                  {['M','R','Y'].map((letter, i) => (
                    <div key={i} className="avatar spf-avatar-init" style={{ background: ['#8B1A4A','#C2185B','#A0154E'][i] }}>
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="text-grey">
                  Calificado <strong>{mc.reviewScore}/5</strong> basado en <strong>+{mc.reviewCount} reseñas</strong>
                </span>
              </div>

              {mc.heroHeadline && (
                <h1 className="ems-pain-hl">{mc.heroHeadline}</h1>
              )}
              <div className="hero-subtitle">{mc.heroSubtitle}</div>

              {mc.trustBullets?.length > 0 && (
                <div className="ems-benefits">
                  {mc.trustBullets.map((b, i) => (
                    <div key={i} className="ems-benefit-item">
                      <span className="ems-benefit-check">✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="spf-countdown">
                <span>⏱</span>
                <span className="spf-countdown-label">Oferta termina en</span>
                <CountdownTimer storageKey="lam_cd_v2" minutes={335} />
              </div>

              {mc.urgencyBanner && (
                <div className="ems-urgency-banner">
                  <span className="ems-urgency-dot" />{mc.urgencyBanner}
                </div>
              )}

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
                    {(() => {
                      const imgs = b.imgs?.length > 0 ? b.imgs : (b.img || product?.imageUrl) ? [b.img || product?.imageUrl] : [];
                      if (!imgs.length) return null;
                      return (
                        <div className="bnd2-imgs">
                          {imgs.map((src, idx) => (
                            <div key={idx} className="bnd2-imgs-item">
                              {idx > 0 && <span className="bnd2-imgs-plus">+</span>}
                              <div className="bnd2-thumb">
                                <img src={src || product?.imageUrl || ''} alt="" loading="lazy" />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
                {!selectedBundle.soldOut && product && (
                  <p className="lp-cta-subtext">
                    💳 3 cuotas sin interés de <strong>${Math.ceil(selectedBundle.price / 3).toLocaleString('es-AR')}</strong>
                    &nbsp;·&nbsp; 🚚 Envío gratis &nbsp;·&nbsp; 🛡️ 30 días de garantía
                  </p>
                )}
                <TrustPills />
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ── BANDAS ── */}
      <div className="pd-bands">

        <section className="pd-band pd-band--light">
          <div className="dtx-container">
            <CirculacionSection mc={mc} />
          </div>
          <div className="dtx-container">
            <MiniReviewsBar reviews={mc.miniReviews?.length ? mc.miniReviews : mc.reviews} />
          </div>
          <div className="dtx-container" style={{ paddingTop: 28 }}>
            <VideoStripSection mc={mc} />
          </div>
          <div className="dtx-container">
            <CuatroSemanasSection mc={mc} />
            <TresPasosSection mc={mc} onBuy={handleBuy} />
          </div>
        </section>

        <WaveSeparator from="light" />

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
              <p className="lp-cta-subtext dark-section">
                💳 3 cuotas sin interés de <strong>${Math.ceil(selectedBundle.price / 3).toLocaleString('es-AR')}</strong>
                &nbsp;·&nbsp; 🚚 Envío gratis &nbsp;·&nbsp; 🛡️ 30 días de garantía
              </p>
              <p className="pd-cta-guarantee pd-cta-guarantee--light">🛡️ Garantía 30 días — Si no te convence, te devolvemos el dinero entero</p>
            </div>
          </div>
        </section>

        <WaveSeparator from="blue" />

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

        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <StatsCircles mc={mc} />
          </div>
        </section>

        <WaveSeparator from="blue" />

        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <div className="faq-acc-wrap">
              <h2 className="faq-acc-title">{mc.faqTitle}</h2>
              {mc.faqSubtitle && <p className="faq-acc-subtitle">{mc.faqSubtitle}</p>}
              <div className="faq-acc">
                {mc.faq.map((item, i) => (
                  <div key={i} className={`faq-acc-item${openFaq === i ? ' active' : ''}`}>
                    <div className="faq-acc-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {item.q}
                      <span className="faq-acc-indicator">{openFaq === i ? '−' : '+'}</span>
                    </div>
                    <div className="faq-acc-content">
                      {Array.isArray(item.a)
                        ? item.a.map((para, pi) => <p key={pi}>{para}</p>)
                        : <p>{item.a}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <WaveSeparator from="light" />
        <footer className="lp-footer">
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

      </div>

      {/* ── STICKY BAR ── */}
      <div className="pd-sticky-bar">
        <div className="pd-sticky-inner">
          <div className="pd-sticky-info">
            <div className="pd-sticky-prices lp-sticky-price-block">
              {!selectedBundle.soldOut && (
                <span className="pd-sticky-old">{fmt(selectedBundle.compareAt)}</span>
              )}
              <span className="pd-sticky-now">
                {selectedBundle.soldOut ? 'Agotado' : fmt(selectedBundle.price)}
              </span>
              {!selectedBundle.soldOut && (
                <span className="lp-sticky-cuotas">
                  3 cuotas de ${Math.ceil(selectedBundle.price / 3).toLocaleString('es-AR')}
                </span>
              )}
            </div>
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

      <style>{`

        .spf-wrap { font-family: inherit; background:#FFF5F8; }
        .dtx-container { width:100%; max-width:1180px; margin:0 auto; padding:0 16px; }
        .dtx-py { padding-top:44px; padding-bottom:44px; }
        .pd-info { display:flex; flex-direction:column; padding:20px 0; min-width:0; width:100%; max-width:100%; }
        @media (min-width:980px) { .pd-info { padding:28px 0; } }
        @media (max-width:980px) { .pd-info { padding:0 4px; box-sizing:border-box; } }
        .hero-top--compact { padding:6px 2px 0 !important; }

        .pd-hero-row { display:block; }
        @media (min-width:980px) {
          .pd-hero-row { display:flex; align-items:flex-start; max-width:1180px; margin:0 auto; }
          .pd-hero-row .pd-media-fullwidth { flex:0 0 50%; max-width:50%; position:sticky; top:70px; align-self:flex-start; }
          .pd-hero-row .pd-container { flex:1; min-width:0; margin:0 !important; padding:0 28px 0 24px; max-width:50%; }
        }

        .pd-media-fullwidth { width:100%; }
        .pd-media { padding:0 !important; overflow:hidden; border-radius:0 !important; box-shadow:none !important; }
        .pd-mediaMain--bigger { position:relative; width:100%; background:#FFF5F8; overflow:hidden; border-radius:0; height:520px; }
        @media (min-width:980px) { .pd-mediaMain--bigger { height:560px; border-radius:16px; } }
        @media (max-width:980px) { .pd-mediaMain--bigger { height:460px; } }
        @media (max-width:520px)  { .pd-mediaMain--bigger { height:420px; } }
        .pd-mainImg--anim { animation:spfFadeIn 150ms ease forwards; }
        @keyframes spfFadeIn { from{opacity:0;} to{opacity:1;} }

        .spf-hero-ph { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:#f0f4f8; }
        .spf-hero-ph-icon { font-size:3.5rem; }
        .spf-hero-ph-text { font-size:.75rem; font-weight:600; color:rgba(11,18,32,.40); text-align:center; max-width:80%; line-height:1.4; }
        .spf-thumb-ph { width:100%; height:100%; background:#f0f4f8; display:grid; place-items:center; font-size:1.1rem; }

        .pd-thumbs-row { display:flex; gap:6px; padding:6px 8px; overflow-x:auto; scrollbar-width:none; justify-content:center; }
        .pd-thumbs-row::-webkit-scrollbar { display:none; }
        .pd-thumb { flex:1; min-width:0; max-width:90px; aspect-ratio:4/3; border-radius:8px; overflow:hidden; border:2px solid rgba(0,0,0,.08); background:#f1f3f5; padding:0; cursor:pointer; transition:border-color .15s ease,opacity .15s ease; opacity:.65; }
        .pd-thumb.is-active { border-color:rgba(139,26,74,.7); opacity:1; }
        .pd-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

        .reviews-container { display:flex; align-items:center; justify-content:center; margin:5px 0; }
        .avatars { display:flex; margin-right:5px; margin-left:7px; }
        .avatar { width:28px; height:28px; border-radius:50%; border:2px solid #fff; margin-left:-7px; object-fit:cover; }
        .spf-avatar-init { display:grid; place-items:center; color:#fff; font-size:.68rem; font-weight:900; flex-shrink:0; }
        .text-grey { font-weight:normal; font-size:12px; color:#868686; line-height:0; }
        .text-grey strong { font-weight:800; color:#2e2f3c; }
        .hero-subtitle { text-align:center; font-weight:900; font-size:16px; margin-top:8px; }

        .spf-countdown { display:flex; align-items:center; justify-content:center; gap:6px; margin:10px 0 4px; padding:8px 14px; border-radius:999px; background:rgba(229,62,62,.08); border:1px solid rgba(229,62,62,.15); font-size:.82rem; font-weight:800; color:rgba(180,30,30,.85); }
        .spf-countdown-label { color:rgba(11,18,32,.60); font-weight:700; }
        .spf-cd { font-variant-numeric:tabular-nums; letter-spacing:.04em; font-weight:900; color:rgba(180,30,30,.90); }

        .bnd2-wrap { display:flex; flex-direction:column; gap:10px; margin:14px 0 4px; }
        .bnd2-card { position:relative; border-radius:14px; border:1.5px solid rgba(11,18,32,.13); border-left:4px solid rgba(11,18,32,.10); background:#fff; cursor:pointer; transition:border-color .14s,background .14s,box-shadow .14s,border-left-color .14s; user-select:none; overflow:visible; padding:13px 14px 13px 12px; }
        .bnd2-card:hover:not(.spf-card--sold) { border-color:rgba(139,26,74,.30); border-left-color:rgba(139,26,74,.40); background:rgba(139,26,74,.02); }
        .bnd2-card--on { border-color:#8B1A4A !important; border-left:4px solid #8B1A4A !important; background:rgba(139,26,74,.04) !important; box-shadow:0 4px 18px rgba(139,26,74,.10); }
        .bnd2-card--pop { border-color:rgba(139,26,74,.25); border-left-color:rgba(139,26,74,.30); background:rgba(139,26,74,.02); margin-top:6px; }
        .bnd2-card--pop.bnd2-card--on { box-shadow:0 6px 22px rgba(139,26,74,.15); }
        .spf-card--sold { opacity:.50; cursor:not-allowed; border-left-color:rgba(11,18,32,.10) !important; }
        .bnd2-float-badge { position:absolute; top:-11px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#8B1A4A,#C2185B); color:#fff; font-size:.68rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; padding:3px 14px; border-radius:999px; white-space:nowrap; box-shadow:0 3px 10px rgba(139,26,74,.30); }
        .spf-sold-badge { background:rgba(11,18,32,.45); box-shadow:none; }
        .bnd2-row { display:flex; align-items:center; gap:10px; }
        .bnd2-radio { width:18px; height:18px; flex-shrink:0; accent-color:#8B1A4A; cursor:pointer; }
        .bnd2-center { flex:1; min-width:0; display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
        .bnd2-name { font-size:.91rem; font-weight:800; color:rgba(11,18,32,.88); line-height:1.2; }
        .bnd2-badge { font-size:.62rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:rgba(139,26,74,.10); color:#8B1A4A; border:1px solid rgba(139,26,74,.20); white-space:nowrap; }
        .bnd2-badge--pop { background:linear-gradient(135deg,#8B1A4A,#C2185B); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(139,26,74,.25); }
        .bnd2-prices { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
        .bnd2-was { font-size:.72rem; color:rgba(11,18,32,.35); text-decoration:line-through; font-weight:600; line-height:1.1; }
        .bnd2-now { font-size:1.10rem; font-weight:900; color:rgba(11,18,32,.90); line-height:1.1; }
        .spf-soldout-label { font-size:.78rem; font-weight:700; color:rgba(11,18,32,.38); }
        .bnd2-benefit { margin-top:8px; padding:8px 10px; border-radius:8px; background:rgba(139,26,74,.07); font-size:.80rem; font-weight:700; color:#8B1A4A; letter-spacing:.01em; line-height:1.35; }

        .bnd2-cta.spf-cta { width:100%; padding:16px 20px; border-radius:14px; border:none; background:linear-gradient(135deg,#AD1457 0%,#C2185B 100%); color:#fff; font-size:1.05rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; cursor:pointer; box-shadow:0 6px 22px rgba(173,20,87,.30); transition:transform .12s,box-shadow .12s,background .14s; margin-top:4px; }
        .bnd2-cta.spf-cta:hover { background:linear-gradient(135deg,#880E4F 0%,#AD1457 100%); box-shadow:0 8px 28px rgba(173,20,87,.38); transform:translateY(-1px); }
        .bnd2-cta.spf-cta:active { transform:translateY(0) scale(.98); }
        .bnd2-cta.spf-cta:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .pd-cta-guarantee { margin:6px 0 0; padding:0; text-align:center; font-size:12px; font-weight:600; color:rgba(11,18,32,.42); line-height:1.4; background:none; border:none; }
        .pd-cta-guarantee--light { color:rgba(255,255,255,.55); }
        .bnd2-section-title { text-align:center; font-size:.88rem; font-weight:900; color:#8B1A4A; letter-spacing:.04em; margin-bottom:2px; }

        .pd-bands > section:first-child { padding-top:28px; }
        .pd-band--light { background:#FFF5F8; }
        .pd-band--blue  { background:#8B1A4A; }

        .sec-head { text-align:center; margin:0 0 20px; }
        .sec-title { margin:0; font-weight:1100; letter-spacing:.06em; text-transform:uppercase; font-size:1.55rem; color:rgba(11,18,32,.92); }
        @media (min-width:900px) { .sec-title { font-size:1.85rem; } }
        .sec-sub { margin-top:8px; color:rgba(11,18,32,.60); font-weight:850; font-size:.95rem; }

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

        .mrb { background:#fff; border:1px solid rgba(2,8,23,.08); border-radius:16px; padding:14px 20px 14px; box-shadow:0 2px 16px rgba(0,0,0,.07); max-width:640px; margin:14px auto 0; }
        .mrb-label { font-size:.68rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:rgba(11,18,32,.38); margin-bottom:12px; }
        .mrb-card { display:flex; gap:16px; align-items:flex-start; }
        .mrb-avatar-wrap { flex-shrink:0; }
        .mrb-avatar-img { width:58px; height:58px; border-radius:50%; object-fit:cover; display:block; }
        .mrb-avatar-fallback { width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.4rem; font-weight:700; flex-shrink:0; }
        .mrb-content { flex:1; min-width:0; }
        .mrb-text { margin:0 0 8px; font-size:.93rem; color:#111827; line-height:1.5; }
        .mrb-meta { display:flex; align-items:center; gap:8px; }
        .mrb-name { font-size:.80rem; color:#9ca3af; }
        .mrb-stars { color:#F6A701; font-size:.9rem; letter-spacing:1px; line-height:1; }
        .mrb-nav { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:12px; }
        .mrb-arrow { background:none; border:1px solid #e5e7eb; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.2rem; color:#6b7280; transition:background .15s; line-height:1; padding:0; }
        .mrb-arrow:hover { background:#f9fafb; }
        .mrb-dots { display:flex; gap:6px; align-items:center; }
        .mrb-dot { width:8px; height:8px; border-radius:50%; border:1.5px solid #d1d5db; background:transparent; cursor:pointer; padding:0; transition:all .2s; }
        .mrb-dot.on { background:#8B1A4A; border-color:#8B1A4A; }

        .stars-inline { display:inline-flex; gap:2px; justify-content:center; }
        .stars-inline .s { opacity:.25; font-size:14px; }
        .stars-inline .s.on { opacity:1; color:#D69E2E; }

        .pd-flow { display:flex; flex-direction:column; gap:4px; }
        .flow-row { display:grid; grid-template-columns:1.1fr .9fr; gap:28px; align-items:center; }
        @media (max-width:900px) { .flow-row { grid-template-columns:1fr; } }
        .flow-text { display:flex; flex-direction:column; align-items:center; }
        .flow-badge { display:inline-flex; padding:4px 11px; border-radius:999px; background:rgba(139,26,74,.10); border:1px solid rgba(139,26,74,.18); font-weight:1100; color:rgba(11,18,32,.78); margin-bottom:6px; }
        .flow-media { width:100%; }
        .flow-imgBox { width:100%; max-width:520px; aspect-ratio:1/1; border-radius:18px; overflow:hidden; border:1px solid rgba(2,8,23,.08); background:#fff; margin-left:auto; box-shadow:0 8px 32px rgba(10,20,40,.10); transition:transform .28s ease,box-shadow .28s ease; }
        .flow-imgBox--video { position:relative; aspect-ratio:16/9; }
        @media (max-width:900px) { .flow-imgBox { margin:0 auto; max-width:520px; } }
        .flow-imgBox img { width:100%; height:100%; object-fit:cover; display:block; }
        .flow-imgBox:hover { transform:translateY(-5px) scale(1.01); box-shadow:0 20px 56px rgba(10,20,40,.16); }
        .flow-title { text-align:center; text-transform:none; letter-spacing:-.02em; font-size:1.85rem; font-weight:900; color:rgba(11,18,32,.93); line-height:1.18; margin:0 0 6px; }
        @media (min-width:900px) { .flow-title { font-size:2.1rem; } }
        @media (max-width:520px) { .flow-title { font-size:1.55rem; } }
        .flow-p { margin:0; color:rgba(11,18,32,.62); line-height:1.68; font-weight:400; font-size:1.02rem; text-align:center; }
        .flow-p--rich { line-height:1.5; font-size:1.02rem; color:rgba(11,18,32,.62); font-weight:400; letter-spacing:.002em; }
        .flow-p--rich strong { color:rgba(11,18,32,.90); font-weight:700; }
        @media (min-width:900px) { .flow-p--rich { font-size:1.05rem; } }
        @media (max-width:520px) { .flow-p--rich { font-size:.97rem; line-height:1.62; } }
        .flow-text--rich .flow-title { margin-bottom:8px; }
        .spf-flow-ph { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:24px; box-sizing:border-box; }
        .spf-flow-ph-icon { font-size:3.5rem; }
        .spf-flow-ph-text { font-size:.78rem; font-weight:600; color:rgba(11,18,32,.38); text-align:center; line-height:1.45; }

        .vstrip-section { margin-bottom:28px; }
        .vstrip-header { text-align:center; margin-bottom:16px; }
        .vstrip-kicker { display:inline-block; font-size:.68rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:#8B1A4A; background:rgba(139,26,74,.08); border:1px solid rgba(139,26,74,.15); padding:4px 12px; border-radius:999px; margin-bottom:10px; }
        .vstrip-title { font-size:1.18rem; font-weight:1000; letter-spacing:-.01em; color:rgba(11,18,32,.88); margin:0 0 5px; line-height:1.25; }
        @media (min-width:900px) { .vstrip-title { font-size:1.38rem; } }
        .vstrip-sub { font-size:.88rem; font-weight:600; color:rgba(11,18,32,.50); margin:0; }
        .vstrip-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
        .vstrip-item { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .vstrip-media { aspect-ratio:9/16; border-radius:20px; overflow:hidden; background:rgba(11,18,32,.05); position:relative; }
        .vstrip-video { width:100%; height:100%; object-fit:cover; display:block; border:none; }
        .vstrip-media iframe.vstrip-video { position:absolute; top:50%; left:50%; width:calc(100% + 2px); height:calc(100% + 2px); transform:translate(-50%,-50%) scale(1.05); pointer-events:none; }
        .vstrip-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(145deg,rgba(139,26,74,.08),rgba(139,26,74,.04)); border:1.5px dashed rgba(139,26,74,.20); }
        .vstrip-ph-ico { font-size:2rem; opacity:.35; color:#8B1A4A; }
        .vstrip-label { text-align:center; font-size:.75rem; font-weight:800; color:rgba(11,18,32,.55); letter-spacing:.04em; text-transform:uppercase; }
        .vstrip-benefit { text-align:center; font-size:.68rem; font-weight:700; color:rgba(139,26,74,.80); letter-spacing:.01em; line-height:1.35; padding:0 4px; }

        .ba-wrap { display:flex; justify-content:center; padding:4px 0 8px; }
        .ba-container { position:relative; overflow:hidden; border-radius:16px; --position:50%; width:100%; max-width:680px; box-shadow:0 16px 48px rgba(0,0,0,.28); }
        .ba-img-wrap { display:grid; position:relative; user-select:none; min-height:280px; }
        .ba-img-after { display:block; width:100%; max-height:460px; min-height:280px; grid-area:1/1; object-fit:cover; object-position:center; }
        .ba-img-before { position:absolute; inset:0; width:100%; height:100%; overflow:hidden; clip-path:inset(0 calc(100% - var(--position)) 0 0); }
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

        .sc-section { display:flex; flex-direction:column; gap:0; padding:28px 0 16px; width:100%; max-width:500px; margin:0 auto; }
        .sc-title { font-size:1.45rem; font-weight:1000; color:rgba(11,18,32,.90); text-align:center; margin:0 0 22px; line-height:1.2; letter-spacing:-.01em; }
        @media (max-width:520px) { .sc-title { font-size:1.18rem; } }
        .sc-list { display:flex; flex-direction:column; gap:0; }
        .sc-row { display:flex; align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid rgba(11,18,32,.06); }
        .sc-row:last-child { border-bottom:none; }
        .sc-circle { position:relative; width:58px; height:58px; border-radius:50%; flex-shrink:0; background:conic-gradient(from 0deg,#C2185B 0%,#8B1A4A var(--sc-pct,0%),rgba(11,18,32,.10) 0%); }
        .sc-circle::after { content:""; position:absolute; top:12%; left:12%; width:76%; height:76%; background:#fff; border-radius:50%; }
        .sc-pct { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:10px; font-weight:900; color:#8B1A4A; z-index:1; letter-spacing:-.02em; }
        .sc-text { font-size:.88rem; font-weight:500; color:rgba(11,18,32,.70); line-height:1.5; margin:0; }
        .sc-text strong { color:rgba(11,18,32,.88); font-weight:800; }
        .sc-footer { margin-top:22px; padding-top:18px; border-top:1px solid rgba(11,18,32,.08); text-align:center; }
        .sc-footer-note { font-size:.72rem; color:rgba(11,18,32,.40); margin:0 0 14px; font-style:italic; }
        .sc-footer-stats { display:flex; justify-content:center; gap:0; }
        .sc-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 8px; border-right:1px solid rgba(11,18,32,.08); }
        .sc-stat:last-child { border-right:none; }
        .sc-stat-val { font-size:1.10rem; font-weight:1000; color:#8B1A4A; letter-spacing:-.01em; }
        .sc-stat-lbl { font-size:.62rem; font-weight:800; color:rgba(11,18,32,.45); letter-spacing:.08em; text-transform:uppercase; }
        .pd-band--blue .sc-title { color:rgba(255,255,255,.92); }
        .pd-band--blue .sc-row { border-bottom-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-circle { background:conic-gradient(from 0deg,#C2185B 0%,#F8BBD9 var(--sc-pct,0%),rgba(255,255,255,.10) 0%); }
        .pd-band--blue .sc-circle::after { background:#8B1A4A; }
        .pd-band--blue .sc-pct { color:#F8BBD9; }
        .pd-band--blue .sc-text { color:rgba(226,232,240,.70); }
        .pd-band--blue .sc-text strong { color:rgba(255,255,255,.90); }
        .pd-band--blue .sc-footer { border-top-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-footer-note { color:rgba(226,232,240,.40); }
        .pd-band--blue .sc-stat { border-right-color:rgba(255,255,255,.08); }
        .pd-band--blue .sc-stat-val { color:#F8BBD9; }
        .pd-band--blue .sc-stat-lbl { color:rgba(226,232,240,.45); }

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
        .spf-rwb-bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#8B1A4A,#C2185B); transition:width .6s cubic-bezier(.4,0,.2,1); }
        .spf-rwb-bar-pct { font-size:.72rem; font-weight:700; color:rgba(11,18,32,.45); white-space:nowrap; min-width:30px; }

        .spf-rv-ph { width:100%; height:100%; background:#f0f4f8; display:grid; place-items:center; font-size:3rem; }
        .rv-wrap { position:relative; margin-top:14px; }
        .rv-row { display:flex; gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; padding:10px 6px 16px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .rv-row::-webkit-scrollbar { display:none; }
        .rv-slide { scroll-snap-align:center; flex:0 0 auto; width:min(520px,88vw); }
        .rv-card { background:#fff; border:1px solid rgba(2,8,23,.10); border-radius:22px; box-shadow:0 22px 70px rgba(10,20,40,.16); overflow:hidden; }
        .rv-imgBox { position:relative; width:100%; aspect-ratio:4/3; background:#f1f5f9; }
        .rv-quote { position:absolute; right:14px; bottom:14px; width:46px; height:46px; border-radius:999px; background:#AD1457; color:#fff; display:grid; place-items:center; font-weight:1100; box-shadow:0 16px 40px rgba(173,20,87,.35); font-size:1.5rem; }
        .rv-body { padding:16px 16px 18px; display:flex; flex-direction:column; gap:8px; text-align:center; min-height:160px; }
        .rv-title { font-weight:1100; text-transform:uppercase; letter-spacing:.05em; color:rgba(11,18,32,.92); font-size:.88rem; }
        .rv-text { margin:0; color:rgba(11,18,32,.70); line-height:1.6; font-weight:650; font-size:.88rem; overflow:hidden; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; }
        .rv-name { margin-top:4px; font-weight:900; color:rgba(11,18,32,.62); font-size:.85rem; }
        .rv-nav { position:absolute; top:45%; transform:translateY(-50%); width:44px; height:44px; border-radius:999px; border:1px solid rgba(2,8,23,.10); background:rgba(255,255,255,.95); box-shadow:0 18px 55px rgba(10,20,40,.18); cursor:pointer; display:grid; place-items:center; font-size:24px; z-index:10; }
        .rv-prev { left:-8px; } .rv-next { right:-8px; }
        @media (max-width:560px) { .rv-nav { display:none; } }
        .rv-dots { display:flex; justify-content:center; gap:8px; margin-top:10px; }
        .rv-dot { width:8px; height:8px; border-radius:999px; border:none; background:rgba(2,8,23,.18); cursor:pointer; transition:transform .18s ease,background .18s ease; padding:0; }
        .rv-dot.on { background:rgba(139,26,74,.95); transform:scale(1.25); }

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
        .grt-cta.spf-grt-cta { display:inline-block; padding:16px 42px; border:none; border-radius:14px; background:linear-gradient(135deg,#AD1457 0%,#C2185B 100%); color:#fff; font-weight:1100; font-size:1rem; letter-spacing:.04em; cursor:pointer; font-family:inherit; box-shadow:0 14px 42px rgba(173,20,87,.35); transition:transform .15s ease,box-shadow .15s ease; }
        .grt-cta.spf-grt-cta:hover { transform:translateY(-2px); box-shadow:0 20px 52px rgba(173,20,87,.50); }
        .grt-cta.spf-grt-cta:active { transform:scale(.98); }
        @media (max-width:520px) { .grt-section{padding:44px 16px 40px;} .grt-pill{font-size:.79rem;padding:8px 12px;} .grt-cta.spf-grt-cta{width:100%;padding:16px;} }

        .faq-acc-wrap { width:100%; max-width:780px; margin:0 auto; padding:24px 0 8px; }
        .faq-acc-title { font-size:1.55rem; font-weight:900; color:rgba(11,18,32,.90); text-align:center; margin:0 0 6px; letter-spacing:-.02em; line-height:1.2; }
        .faq-acc-subtitle { text-align:center; font-size:.92rem; color:rgba(11,18,32,.50); font-weight:600; margin:0 0 28px; }
        @media (max-width:520px) { .faq-acc-title{font-size:1.25rem;} .faq-acc-subtitle{font-size:.86rem;} }
        .faq-acc { width:100%; border-top:1px solid rgba(11,18,32,.10); }
        .faq-acc-item { border-bottom:1px solid rgba(11,18,32,.10); }
        .faq-acc-header { padding:16px 4px; cursor:pointer; font-weight:700; font-size:15px; display:flex; justify-content:space-between; align-items:center; color:rgba(11,18,32,.88); user-select:none; line-height:1.4; transition:color .15s; gap:14px; }
        .faq-acc-header:hover { color:#8B1A4A; }
        .faq-acc-item.active .faq-acc-header { color:rgba(11,18,32,.90); }
        .faq-acc-indicator { font-size:1.15rem; font-weight:400; color:rgba(11,18,32,.55); flex-shrink:0; width:22px; text-align:center; line-height:1; transition:color .15s; }
        .faq-acc-item.active .faq-acc-indicator { color:#8B1A4A; }
        .faq-acc-content { max-height:0; overflow:hidden; transition:max-height .35s ease,padding .25s ease; padding:0 4px; }
        .faq-acc-content p { margin:0 0 16px; font-size:14px; color:rgba(11,18,32,.62); line-height:1.65; }
        .faq-acc-item.active .faq-acc-content { max-height:1400px; padding:0 4px 16px; }

        .pd-sticky-bar { position:fixed; left:50%; bottom:18px; width:min(calc(100% - 24px),560px); transform:translateX(-50%) translateY(100%); opacity:0; pointer-events:none; transition:opacity .3s ease, transform .3s ease; z-index:9999; display:flex; flex-direction:column; align-items:center; gap:3px; background:rgba(255,255,255,.97); backdrop-filter:blur(14px); border:1px solid rgba(11,18,32,.10); border-radius:20px; padding:9px 10px 7px 20px; box-shadow:0 22px 54px rgba(2,8,23,.22); overflow:hidden; }
        .pd-sticky-bar.sticky--visible { opacity:1; transform:translateX(-50%) translateY(0); pointer-events:auto; }
        .pd-sticky-inner { display:flex; align-items:center; gap:12px; width:100%; }
        .pd-sticky-bar .pd-cta-guarantee { font-size:11px; margin:0; color:rgba(11,18,32,.38); }
        .pd-sticky-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:0; }
        .pd-sticky-prices { display:flex; flex-direction:column; gap:0; }
        .pd-sticky-old { color:rgba(11,18,32,.38); font-weight:700; text-decoration:line-through; font-size:.65rem; white-space:nowrap; line-height:1.3; }
        .pd-sticky-now { font-weight:900; color:rgba(11,18,32,.92); font-size:.92rem; white-space:nowrap; line-height:1.25; }
        .pd-sticky-qty { font-size:.58rem; font-weight:600; color:#8B1A4A; white-space:nowrap; line-height:1.3; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
        .pd-sticky-btn.spf-sticky-btn { flex-shrink:0; border:none; background:linear-gradient(135deg,#AD1457 0%,#C2185B 100%); color:#fff; font-weight:900; font-size:.80rem; border-radius:999px; padding:11px 18px; cursor:pointer; box-shadow:0 6px 20px rgba(173,20,87,.28); letter-spacing:.04em; text-transform:uppercase; transition:transform .12s ease,box-shadow .12s ease; white-space:nowrap; }
        .pd-sticky-btn.spf-sticky-btn:active { transform:scale(.98); box-shadow:0 4px 14px rgba(173,20,87,.22); }
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

        .wa-tab { position:fixed; right:16px; bottom:24px; z-index:9998; display:grid; place-items:center; background:#25D366; border-radius:999px; width:36px; height:36px; text-decoration:none; box-shadow:0 4px 14px rgba(37,211,102,.40); transform:translateY(0); transition:transform .3s cubic-bezier(.22,1,.36,1); }
        .wa-tab.wa-tab--raised { transform:translateY(-82px); }

        .ems-pain-hl { margin:8px 0 4px; text-align:center; font-size:1.55rem; font-weight:1000; line-height:1.15; color:rgba(11,18,32,.93); letter-spacing:-.02em; }
        @media (max-width:520px) { .ems-pain-hl { font-size:1.25rem; } }
        @media (min-width:980px) { .ems-pain-hl { font-size:1.75rem; } }
        .ems-product-name { text-align:center; font-size:.80rem; font-weight:700; color:rgba(11,18,32,.40); letter-spacing:.06em; text-transform:uppercase; margin-bottom:2px; }

        .ems-urgency-banner { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; margin:0 0 4px; border-radius:12px; background:rgba(229,62,62,.07); border:1px solid rgba(229,62,62,.18); font-size:.82rem; font-weight:800; color:rgba(180,30,30,.88); letter-spacing:.01em; }
        .ems-urgency-dot { width:7px; height:7px; border-radius:50%; background:#e53e3e; flex-shrink:0; animation:spfPulse 1.4s ease-in-out infinite; }
        @keyframes spfPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,62,62,.55);} 50%{box-shadow:0 0 0 5px rgba(229,62,62,0);} }

        .marquee { display:none !important; }
        .ems-mq { overflow:hidden; background:#8B1A4A; padding:8px 0; }
        .ems-mq__track { display:flex; gap:0; width:max-content; animation:emsMqScroll 28s linear infinite; }
        .ems-mq__item { white-space:nowrap; font-size:.76rem; font-weight:700; color:rgba(255,255,255,.90); letter-spacing:.03em; padding:0 28px; }
        .ems-mq__item::after { content:"·"; margin-left:28px; opacity:.45; }
        @keyframes emsMqScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @media (prefers-reduced-motion:reduce) { .ems-mq__track{animation:none;} }

        .ems-benefits { display:flex; flex-direction:column; gap:6px; margin:10px 0 4px; padding:0 2px; }
        .ems-benefit-item { display:flex; align-items:flex-start; gap:7px; font-size:.88rem; font-weight:700; color:rgba(11,18,32,.80); line-height:1.35; }
        .ems-benefit-check { color:#8B1A4A; font-weight:900; flex-shrink:0; font-size:.95rem; line-height:1.3; }
        @media (max-width:520px) { .ems-benefit-item { font-size:.84rem; } }

        .tpills { display:flex; flex-direction:column; gap:0; margin:12px 0 0; border:1px solid rgba(11,18,32,.10); border-radius:14px; overflow:hidden; background:#fff; }
        .tpill { border-bottom:1px solid rgba(11,18,32,.08); cursor:pointer; transition:background .12s; }
        .tpill:last-child { border-bottom:none; }
        .tpill--open { background:#FFF5F8; }
        .tpill:hover { background:#FFF5F8; }
        .tpill-hd { display:flex; align-items:center; gap:10px; padding:12px 14px; user-select:none; }
        .tpill-ico { font-size:1rem; flex-shrink:0; }
        .tpill-title { flex:1; font-size:.84rem; font-weight:800; color:rgba(11,18,32,.85); }
        .tpill-chevron { font-size:1.1rem; font-weight:700; color:#8B1A4A; flex-shrink:0; width:20px; text-align:center; line-height:1; }
        .tpill-body { padding:0 14px 12px 38px; font-size:.80rem; font-weight:500; color:#8B1A4A; line-height:1.6; white-space:pre-line; }

        .bnd2-imgs { display:flex; align-items:center; gap:0; margin:8px 0 0 26px; }
        .bnd2-imgs-item { display:flex; align-items:center; gap:4px; }
        .bnd2-imgs-plus { font-size:.68rem; font-weight:900; color:rgba(139,26,74,.50); line-height:1; padding:0 2px; }
        .bnd2-thumb { width:42px; height:42px; border-radius:9px; overflow:hidden; flex-shrink:0; background:#f9f0f4; border:1px solid rgba(139,26,74,.14); }
        .bnd2-thumb img { width:100%; height:100%; object-fit:cover; display:block; }


        .lp-cta-subtext { text-align:center; font-size:12px; color:#6b7280; margin:8px 0 0; line-height:1.5; }
        .lp-cta-subtext.dark-section { color:rgba(255,255,255,.70); }
        .lp-cta-subtext strong { font-weight:700; }

        .lp-sticky-price-block { display:flex; flex-direction:column; align-items:flex-start; }
        .lp-sticky-cuotas { font-size:10px; color:rgba(11,18,32,.45); font-weight:500; line-height:1; margin-top:1px; }

        /* ── Circulación Facial ─────────────────────────── */
        .circ-section { padding:32px 0 24px; display:flex; flex-direction:column; gap:20px; }
        .circ-title { font-size:1.75rem; font-weight:800; color:rgba(11,18,32,.92); line-height:1.2; margin:0; text-align:center; }
        .circ-title-buena { font-size:2.2rem; font-weight:900; color:#8B1A4A; line-height:1.15; margin:12px 0 0; text-align:center; }
        .circ-title2 { font-size:1.55rem; font-weight:800; color:rgba(11,18,32,.92); line-height:1.2; margin:0; text-align:center; }
        @media (max-width:520px) { .circ-title { font-size:1.5rem; } .circ-title-buena { font-size:1.75rem; } .circ-title2 { font-size:1.3rem; } }
        .circ-img { width:100%; border-radius:14px; display:block; object-fit:cover; max-height:360px; }
        .circ-quote { font-style:italic; font-size:1.0rem; font-weight:600; color:rgba(11,18,32,.75); line-height:1.55; margin:0; }
        .circ-text { font-size:1.0rem; color:rgba(11,18,32,.82); line-height:1.7; margin:0; }
        .circ-text strong { color:#8B1A4A; font-weight:800; }
        .circ-badge-pill { display:inline-flex; align-items:center; gap:7px; background:#8B1A4A; color:#fff; font-size:.70rem; font-weight:800; letter-spacing:.05em; padding:6px 14px; border-radius:999px; margin:0; }
        .circ-badge-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,.70); flex-shrink:0; }
        .circ-bullets { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:9px; }
        .circ-bullets li { display:flex; align-items:flex-start; gap:9px; font-size:1.0rem; color:rgba(11,18,32,.88); font-weight:600; line-height:1.45; }
        .circ-bullets li::before { content:"✓"; color:#8B1A4A; font-weight:900; flex-shrink:0; line-height:1.3; }
        .circ-footnote { font-size:.82rem; color:rgba(11,18,32,.42); font-style:italic; margin:0; }

        /* ── 4 Semanas Timeline ─────────────────────────── */
        .semanas-section { padding:40px 0 32px; }
        .semanas-title { font-size:2.2rem; font-weight:900; color:rgba(11,18,32,.92); line-height:1.15; margin:0 0 10px; text-align:center; }
        .semanas-accent { color:#8B1A4A; }
        @media (max-width:520px) { .semanas-title { font-size:1.75rem; } }
        .semanas-sub { font-size:.90rem; color:rgba(11,18,32,.52); line-height:1.55; margin:0 0 20px; text-align:center; }
        .semanas-img { width:100%; border-radius:14px; display:block; object-fit:cover; max-height:320px; margin:0 0 32px; }
        .semanas-list { display:flex; flex-direction:column; }
        .semana-row { display:grid; grid-template-columns:84px 1fr; gap:16px; align-items:flex-start; }
        .semana-left { display:flex; flex-direction:column; align-items:center; }
        .semana-badge { background:#8B1A4A; color:#fff; border-radius:999px; padding:6px 0; font-size:.68rem; font-weight:800; text-align:center; width:100%; box-sizing:border-box; white-space:nowrap; }
        .semana-line { width:2px; border-left:2px dashed rgba(139,26,74,.30); min-height:44px; margin-top:5px; flex:1; }
        .semana-content { padding:0 0 28px; }
        .semana-content-title { font-weight:900; font-size:1.05rem; color:rgba(11,18,32,.92); margin:2px 0 6px; line-height:1.25; }
        .semana-content-desc { font-size:.95rem; color:rgba(11,18,32,.78); line-height:1.6; margin:0; }

        /* ── 3 Pasos ────────────────────────────────────── */
        .pasos-section { padding:40px 0 32px; text-align:center; }
        .pasos-kicker { font-size:.68rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#8B1A4A; margin-bottom:10px; }
        .pasos-title { font-size:2.2rem; font-weight:900; color:rgba(11,18,32,.92); line-height:1.15; margin:0 0 12px; }
        @media (max-width:520px) { .pasos-title { font-size:1.75rem; } }
        .pasos-sub { font-size:.90rem; color:rgba(11,18,32,.52); line-height:1.55; margin:0 0 32px; }
        .pasos-list { display:flex; flex-direction:column; gap:36px; }
        .paso-item { display:flex; flex-direction:column; align-items:center; gap:10px; }
        .paso-circle-wrap { position:relative; display:inline-block; }
        .paso-circle-img { width:120px; height:120px; border-radius:50%; object-fit:cover; display:block; }
        .paso-circle-ph { width:120px; height:120px; border-radius:50%; background:rgba(139,26,74,.10); }
        .paso-num-badge { position:absolute; bottom:-4px; left:50%; transform:translateX(-50%); background:#8B1A4A; color:#fff; font-size:.72rem; font-weight:900; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #FFF5F8; }
        .paso-title { font-size:1.05rem; font-weight:900; color:rgba(11,18,32,.90); margin:4px 0 0; line-height:1.2; }
        .paso-desc { font-size:.97rem; color:rgba(11,18,32,.78); line-height:1.6; margin:0; max-width:300px; }
        .pasos-cta { margin-top:36px; background:#111827; color:#fff; border:none; border-radius:10px; padding:16px 32px; font-size:.95rem; font-weight:900; cursor:pointer; width:100%; letter-spacing:.04em; transition:background .15s; }
        .pasos-cta:hover { background:#374151; }

        .lp-footer { font-family:inherit; background:#8B1A4A; }
        .lp-footer-body { padding:28px 20px; padding-bottom:max(100px, calc(env(safe-area-inset-bottom) + 100px)); }
        .lp-footer-brand { text-align:center; margin-bottom:20px; }
        .lp-footer-logo { font-size:1.4rem; font-weight:900; color:#fff; letter-spacing:-.02em; line-height:1; }
        .lp-footer-tagline { font-size:.75rem; color:rgba(255,255,255,.45); margin:5px 0 0; }
        .lp-footer-trust { display:flex; flex-wrap:wrap; justify-content:center; gap:6px 18px; margin-bottom:20px; }
        .lp-footer-ti { display:flex; align-items:center; gap:5px; font-size:.78rem; font-weight:700; color:rgba(255,255,255,.70); }
        .lp-footer-ti > span { font-size:.90rem; line-height:1; }
        .lp-footer-pay { text-align:center; margin-bottom:18px; }
        .lp-footer-pay-label { font-size:.60rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:rgba(255,255,255,.30); display:block; margin-bottom:8px; }
        .lp-footer-pay-row { display:flex; justify-content:center; gap:6px; flex-wrap:wrap; }
        .lp-pay-chip { font-size:.66rem; font-weight:700; color:rgba(255,255,255,.55); background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.15); padding:4px 10px; border-radius:6px; }
        .lp-footer-bottom { border-top:1px solid rgba(255,255,255,.12); padding-top:14px; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
        .lp-footer-bottom > span { font-size:.66rem; color:rgba(255,255,255,.32); }
        .lp-footer-wa { font-size:.74rem; font-weight:700; color:rgba(255,255,255,.55); text-decoration:none; }
        .lp-footer-wa:hover { color:#fff; }

      `}</style>
    </div>

    {showCheckout && (
      <CheckoutSheet
        onClose={() => setShowCheckout(false)}
        primaryColor="#8B1A4A"
        primaryHover="#C2185B"
        allowCod={false}
      />
    )}
    </>
  );
}
