/**
 * Plantilla de landing "showcase": hero con galería + selector de packs,
 * bandas (videos, historia, antes/después + garantía, reseñas, stats, FAQ),
 * barra de compra fija y checkout en sheet.
 *
 * Sillón Puff y Kit de Belleza eran dos páginas de ~620 líneas idénticas
 * salvo textos y colores. Ahora cada una es `<ShowcaseLanding config theme />`:
 *   - `config` (src/landings/*.js): contenido y precios de referencia.
 *   - `theme`: lo visual que cambia por producto: colores del CTA, ícono
 *     de placeholders, loader, título de respaldo y clave del contador.
 *
 * @param {{
 *   config: object,
 *   theme: {
 *     cta: { from: string, to: string, deep: string, rgb: string },
 *     icon: string,
 *     loaderColors: [string, string],
 *     fallbackTitle: import('react').ReactNode,
 *     countdownKey: string,
 *     quoteColor?: string,
 *   }
 * }} props
 */
import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { useCart } from '../../../hooks/useCart';
import { trackWithCapi } from '../../../lib/metaPixel';
import { CheckoutSheet } from '../../../pages/CheckoutSheet';
import SafeImg from '../../SafeImg.jsx';
import LandingFooter from '../LandingFooter.jsx';
import StatsCircles from "../StatsCircles";
import StickyBuyBar from "../StickyBuyBar";
import WhatsAppTab from "../WhatsAppTab";
import LandingLoader from "../LandingLoader";
import { useStickyCta } from "../useStickyCta";
import WaveSeparator from "../WaveSeparator";
import LandingFaq from "../LandingFaq";
import CountdownTimer from "../CountdownTimer";
import MiniReviewsBar from "../MiniReviewsBar";
import ProofVideoStrip from "../ProofVideoStrip";
import BeforeAfterSlider from "../BeforeAfterSlider";
import ReviewsWithBars from "../ReviewsWithBars";
import GuaranteeNote from "../GuaranteeNote";

import './ShowcaseLanding.css';

/* Colores de las bandas para los separadores de olas. */
const WAVE = { dark: "#1B4D3E", light: "#ffffff" };

export default function ShowcaseLanding({ config: mc, theme }) {
  const [product,      setProduct]      = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedBundleId, setSelectedBundleId] = useState(mc.bundles[0].id);
  const [showSheet,    setShowSheet]    = useState(false);
  const [allowCod,     setAllowCod]     = useState(false);
  const { addItem } = useCart();

  const productName = mc.checkoutName;
  const { cta } = theme;
  const ctaVars = {
    '--spf-cta-from': cta.from,
    '--spf-cta-to': cta.to,
    '--spf-cta-deep': cta.deep,
    '--spf-cta-rgb': cta.rgb,
  };

  useEffect(() => {
    api.get(`/products/slug/${mc.productSlug}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => { setProductReady(true); });
  }, [mc.productSlug]);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: mc.checkoutName,
      content_type: 'product',
      currency:     'ARS',
      value:        mc.bundles?.[0]?.price || 0,
    });
  }, [mc]);

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

  // Barra de compra fija + botón de WhatsApp: se muestran/suben al pasar el CTA.
  const stickyVisible = useStickyCta('.bnd2-cta', productReady);

  const displayBundles = useMemo(() => {
    return mc.bundles.map((b, idx) => {
      const db = product?.bundles?.[idx];
      return { ...b, label: db?.label ?? b.label, price: db?.price ?? b.price, compareAt: db?.compareAt ?? b.compareAt };
    });
  }, [product, mc.bundles]);

  // El bundle seleccionado se deriva del id + datos del producto (no se
  // sincroniza con un useEffect): siempre refleja label/precio actualizados.
  const selectedBundle = displayBundles.find(b => b.id === selectedBundleId) ?? displayBundles[0];

  const heroImgs = useMemo(() => {
    const arr = [];
    if (product?.imageUrl) arr.push({ src: product.imageUrl, alt: productName });
    if (Array.isArray(product?.images)) {
      product.images.forEach(x => {
        const url = typeof x === 'string' ? x : x?.url;
        if (url && !arr.find(a => a.src === url)) arr.push({ src: url, alt: productName });
      });
    }
    if (arr.length) return arr;
    // Fallback del config: sin los slots vacíos (src: "") que deja la
    // plantilla para completar desde el admin; si no queda ninguna, SafeImg
    // muestra el monograma con el nombre.
    return (mc.heroImages || []).filter(h => h?.src && String(h.src).trim());
  }, [product, mc, productName]);

  // FIX: story images from config only — never pulled from product.images API array
  const storyImgs = mc.storyBlocks.map(b => b.img || '');

  const handleBuy = () => {
    if (!product || selectedBundle.soldOut) return;
    addItem(
      { ...product, name: `${mc.checkoutName} — ${selectedBundle.label}` },
      1,
      { bundleTotal: selectedBundle.price, compareAtPrice: selectedBundle.compareAt, gifts: selectedBundle.gifts || [] },
    );
    setShowSheet(true);
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

  if (!productReady) {
    return <LandingLoader colors={theme.loaderColors} />;
  }

  const activeImg = heroImgs[activeImgIdx] || heroImgs[0] || { src: '', alt: productName };

  return (
    <div className="spf-wrap" style={ctaVars}>

      {/* ============================================================
          HERO — imagen izquierda / info+bundles derecha
      ============================================================ */}
      <div className="pd-hero-row">

        <section className="pd-media-fullwidth">
          <section className="pd-media">
            <div className="pd-mediaMain pd-mediaMain--bigger">
              <SafeImg
                key={activeImgIdx}
                className="pd-mainImg pd-mainImg--anim"
                src={activeImg.src}
                alt={activeImg.alt}
                name={productName}
                priority
                sizes="(min-width: 960px) 50vw, 100vw"
                widths={[480, 720, 960, 1280]}
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              />
            </div>
            <div className="pd-thumbs-row">
              {heroImgs.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb${idx === activeImgIdx ? ' is-active' : ''}`}
                  onClick={() => setActiveImgIdx(idx)}
                  aria-label={img.alt}
                >
                  <SafeImg
                    src={img.src}
                    alt=""
                    name={productName}
                    sizes="90px"
                    widths={[180]}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
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
                {product?.name || theme.fallbackTitle}
              </h1>

              <div className="hero-subtitle">{mc.heroSubtitle}</div>

              <div className="emoji-bullets">
                {mc.trustBullets.map((b, i) => <div key={i} className="emoji-bullet">{b}</div>)}
              </div>

              <div className="spf-countdown">
                <span>⏱</span>
                <span className="spf-countdown-label">Oferta termina en</span>
                <CountdownTimer storageKey={theme.countdownKey} minutes={335} />
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
                <GuaranteeNote />
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
            <MiniReviewsBar reviews={mc.reviews} tone="green" />
          </div>
          <div className="dtx-container" style={{ paddingTop: 28 }}>
            <ProofVideoStrip
              videos={mc.proofVideos}
              kicker={mc.proofVideosKicker}
              title={mc.proofVideosTitle}
              subtitle={mc.proofVideosSubtitle}
              tone="green"
            />
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
                        ? <SafeImg src={storyImgs[i]} alt={b.imgAlt} sizes="(min-width: 960px) 520px, 100vw" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        : <div className="spf-flow-ph"><span className="spf-flow-ph-icon" aria-hidden="true">{theme.icon}</span><span className="spf-flow-ph-text">{b.imgAlt}</span></div>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </section>

        <WaveSeparator from="light" {...WAVE} />

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
              placeholderIcons={{ before: "📦", after: theme.icon }}
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
              <GuaranteeNote light />
            </div>
          </div>
        </section>

        <WaveSeparator from="dark" {...WAVE} />

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
              tone="green"
              placeholder={theme.icon}
              quoteColor={theme.quoteColor}
            />
          </div>
        </section>

        <WaveSeparator from="light" {...WAVE} />

        {/* ── 4. VERDE — Estadísticas ── */}
        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <StatsCircles mc={mc} />
          </div>
        </section>

        <WaveSeparator from="dark" {...WAVE} />

        {/* ── 5. BLANCO — FAQ ── */}
        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <LandingFaq title={mc.faqTitle} items={mc.faq} tone="green" icon="chevron" />
          </div>
        </section>

      </div>{/* /pd-bands */}

      {/* ── FOOTER ── */}
      <LandingFooter waveFrom="#fff" whatsappNumber={mc.whatsapp?.number} />

      {/* ============================================================
          STICKY BAR
      ============================================================ */}
      <StickyBuyBar
        bundle={selectedBundle}
        visible={stickyVisible}
        onBuy={handleBuy}
        disabled={!product}
        buttonText={mc.stickyBtnText}
        theme={{ from: cta.from, to: cta.to, shadow: cta.rgb.split(' ').join(', '), label: '#1B4D3E' }}
      />

      <WhatsAppTab wa={mc.whatsapp} raised={stickyVisible} />

      {showSheet && <CheckoutSheet onClose={() => setShowSheet(false)} allowCod={allowCod} />}
    </div>
  );
}
