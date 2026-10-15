import { useState, useEffect, useMemo } from 'react';
import SafeImg from '../components/SafeImg';
import api from '../services/api';
import { CheckoutSheet } from './CheckoutSheet';
import { useCart } from '../hooks/useCart';
import { trackWithCapi } from '../lib/metaPixel';
import mc from '../landings/masajeador-facial-iones-lambo';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import StatsCircles from "../components/landing/StatsCircles";
import StickyBuyBar from "../components/landing/StickyBuyBar";
import WhatsAppTab from "../components/landing/WhatsAppTab";
import LandingLoader from "../components/landing/LandingLoader";
import { useStickyCta } from "../components/landing/useStickyCta";
import WaveSeparator from "../components/landing/WaveSeparator";
import LandingFaq from "../components/landing/LandingFaq";
import CountdownTimer from "../components/landing/CountdownTimer";
import MiniReviewsBar from "../components/landing/MiniReviewsBar";
import ProofVideoStrip from "../components/landing/ProofVideoStrip";
import BeforeAfterSlider from "../components/landing/BeforeAfterSlider";
import ReviewsWithBars from "../components/landing/ReviewsWithBars";
import GuaranteeNote from "../components/landing/GuaranteeNote";
import TrustPills from "../components/landing/TrustPills";
import StoryFlow from "../components/landing/StoryFlow";
import { CirculacionSection, CuatroSemanasSection, TresPasosSection } from "../components/landing/wine/WineStorySections";

/* Colores de las bandas para los separadores de olas. */
const WAVE = { dark: "#8B1A4A", light: "#FFF5F8" };

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function MasajeadorFacialIonesLanding() {
  const [product,      setProduct]      = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedBundleId, setSelectedBundleId] = useState(mc.bundles[0].id);
  const [showCheckout, setShowCheckout] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/slug/${mc.productSlug}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => { setProductReady(true); });
  }, []);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: mc.checkoutName,
      content_type: 'product',
      currency:     'ARS',
      value:        mc.bundles?.[0]?.price || 0,
    });
  }, []);

  // Barra de compra fija + botón de WhatsApp: se muestran/suben al pasar el CTA.
  const stickyVisible = useStickyCta('.bnd2-cta', productReady);

  const displayBundles = useMemo(() => {
    return mc.bundles.map((b, idx) => {
      const db = product?.bundles?.[idx];
      return { ...b, label: db?.label ?? b.label, price: db?.price ?? b.price, compareAt: db?.compareAt ?? b.compareAt };
    });
  }, [product]);

  // El bundle seleccionado se deriva del id + datos del producto (no se
  // sincroniza con un useEffect): siempre refleja label/precio actualizados.
  const selectedBundle = displayBundles.find(b => b.id === selectedBundleId) ?? displayBundles[0];

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
    setShowCheckout(true);
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  if (!productReady) {
    return <LandingLoader />;
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
                  <SafeImg
                    key={activeImgIdx}
                    priority
                    sizes="(min-width: 960px) 50vw, 100vw"
                    widths={[480, 720, 960, 1280]}
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
                    ? <SafeImg src={img.src} alt="" sizes="90px" widths={[180]} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
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
                    onClick={() => !b.soldOut && setSelectedBundleId(b.id)}
                    role="button"
                    tabIndex={b.soldOut ? -1 : 0}
                    aria-disabled={b.soldOut}
                    onKeyDown={e => e.key === 'Enter' && !b.soldOut && setSelectedBundleId(b.id)}
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
                                <SafeImg src={src || product?.imageUrl || ''} alt="" width={42} height={42} sizes="42px" widths={[84]} />
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
            <CirculacionSection data={mc.circulacion} />
          </div>
          <div className="dtx-container">
            <MiniReviewsBar reviews={mc.miniReviews?.length ? mc.miniReviews : mc.reviews} tone="wine" variant="card" label="Lo que dicen nuestras clientas" />
          </div>
          <div className="dtx-container" style={{ paddingTop: 28 }}>
            <ProofVideoStrip
              videos={mc.proofVideos}
              kicker={mc.proofVideosKicker}
              title={mc.proofVideosTitle}
              subtitle={mc.proofVideosSubtitle}
              tone="wine"
            />
          </div>
          <div className="dtx-container">
            <StoryFlow blocks={mc.storyBlocks} />
            <CuatroSemanasSection data={mc.cuatroSemanas} />
            <TresPasosSection data={mc.tresPasos} onBuy={handleBuy} />
          </div>
        </section>

        <WaveSeparator from="light" {...WAVE} />

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
              placeholderIcons={{ before: "👁️", after: "✨" }}
            />
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
              <GuaranteeNote light />
            </div>
          </div>
        </section>

        <WaveSeparator from="dark" {...WAVE} />

        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py">
            <ReviewsWithBars
              reviews={mc.reviews}
              distribution={mc.ratingDistribution}
              title={mc.reviewsTitle}
              subtitle={mc.reviewsSubtitle}
              score={mc.reviewScore}
              count={mc.reviewCount}
              tone="wine"
              placeholder="💡"
            />
          </div>
        </section>

        <WaveSeparator from="light" {...WAVE} />

        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <StatsCircles mc={mc} tone="wine" />
          </div>
        </section>

        <WaveSeparator from="dark" {...WAVE} />

        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <LandingFaq title={mc.faqTitle} subtitle={mc.faqSubtitle} items={mc.faq} tone="wine" icon="plus" />
          </div>
        </section>

        <WaveSeparator from="light" {...WAVE} />
        <LandingFooter variant="wine" whatsappNumber={mc.whatsapp?.number} />

      </div>

      {/* ── STICKY BAR ── */}
      <StickyBuyBar
        bundle={selectedBundle}
        visible={stickyVisible}
        onBuy={handleBuy}
        disabled={!product}
        buttonText={mc.stickyBtnText}
        showInstallments
        showLabel={false}
      />

      <WhatsAppTab wa={mc.whatsapp} raised={stickyVisible} />

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
        .bnd2-section-title { text-align:center; font-size:.88rem; font-weight:900; color:#8B1A4A; letter-spacing:.04em; margin-bottom:2px; }

        .pd-bands > section:first-child { padding-top:28px; }
        .pd-band--light { background:#FFF5F8; }
        .pd-band--blue  { background:#8B1A4A; }

        .sec-head { text-align:center; margin:0 0 20px; }
        .sec-title { margin:0; font-weight:1100; letter-spacing:.06em; text-transform:uppercase; font-size:1.55rem; color:rgba(11,18,32,.92); }
        @media (min-width:900px) { .sec-title { font-size:1.85rem; } }
        .sec-sub { margin-top:8px; color:rgba(11,18,32,.60); font-weight:850; font-size:.95rem; }

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

        .bnd2-imgs { display:flex; align-items:center; gap:0; margin:8px 0 0 26px; }
        .bnd2-imgs-item { display:flex; align-items:center; gap:4px; }
        .bnd2-imgs-plus { font-size:.68rem; font-weight:900; color:rgba(139,26,74,.50); line-height:1; padding:0 2px; }
        .bnd2-thumb { width:42px; height:42px; border-radius:9px; overflow:hidden; flex-shrink:0; background:#f9f0f4; border:1px solid rgba(139,26,74,.14); }
        .bnd2-thumb img { width:100%; height:100%; object-fit:cover; display:block; }


        .lp-cta-subtext { text-align:center; font-size:12px; color:#6b7280; margin:8px 0 0; line-height:1.5; }
        .lp-cta-subtext.dark-section { color:rgba(255,255,255,.70); }
        .lp-cta-subtext strong { font-weight:700; }




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
