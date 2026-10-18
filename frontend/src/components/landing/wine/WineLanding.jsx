/**
 * Plantilla de landing "wine" (bordó + rosa): cinta superior propia, hero
 * con galería + selector de packs, bandas (historia, videos, antes/después
 * + garantía, reseñas, stats, FAQ), barra de compra fija y checkout en sheet.
 *
 * Masajeador EMS EYES y Masajeador Facial 5 en 1 eran dos páginas de
 * ~600 líneas idénticas salvo textos y unos pocos detalles. Ahora cada una
 * es `<WineLanding config theme />`, mismo método que `ShowcaseLanding`:
 *   - `config` (src/landings/*.js): contenido, precios de referencia y
 *     frases de la cinta (`marquee`).
 *   - `theme`: lo visual que cambia por producto.
 *
 * @param {{
 *   config: object,
 *   theme: {
 *     icon: string,                   // placeholder de hero y miniaturas
 *     fallbackTitle: string,          // alt/título si no llega el producto
 *     initials: [string, string, string], // avatares junto al rating
 *     countdownKey: string,           // clave de localStorage del contador
 *     heroFit?: 'cover' | 'contain',
 *     showProductName?: boolean,      // nombre del producto bajo el titular
 *     waveLight?: string,             // color claro de las olas
 *     circulacionFirst?: boolean,     // "Circulación" antes de las mini reseñas
 *     miniReviews?: { variant?: string, label?: string },
 *     storyImgProps?: object,         // props extra para las fotos de StoryFlow
 *     footer?: 'night' | 'wine',
 *     stickyShowLabel?: boolean,
 *     vars?: Record<string, string>,  // custom properties de WineLanding.css
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
import BundleOptions from '../BundleOptions.jsx';
import StatsCircles from '../StatsCircles';
import StickyBuyBar from '../StickyBuyBar';
import WhatsAppTab from '../WhatsAppTab';
import LandingLoader from '../LandingLoader';
import { useStickyCta } from '../useStickyCta';
import WaveSeparator from '../WaveSeparator';
import LandingFaq from '../LandingFaq';
import CountdownTimer from '../CountdownTimer';
import MiniReviewsBar from '../MiniReviewsBar';
import ProofVideoStrip from '../ProofVideoStrip';
import BeforeAfterSlider from '../BeforeAfterSlider';
import ReviewsWithBars from '../ReviewsWithBars';
import GuaranteeNote from '../GuaranteeNote';
import TrustPills from '../TrustPills';
import StoryFlow from '../StoryFlow';
import { CirculacionSection, CuatroSemanasSection, TresPasosSection } from './WineStorySections';
import './WineLanding.css';

const WINE = '#8B1A4A';
const AVATAR_COLORS = [WINE, '#C2185B', '#A0154E'];
const HERO_FIT = {
  cover: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  contain: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center', display: 'block' },
};
const THUMB_STYLE = { width: '100%', height: '100%', objectFit: 'cover' };
const GUARANTEE_PILLS = ['✅ Sin preguntas', '✅ Sin trámites', '✅ Devolución completa', '🚚 Envío gratis'];

const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

/** "3 cuotas sin interés de $X · Envío gratis · 30 días de garantía". */
function CtaSubtext({ price, dark = false }) {
  return (
    <p className={`lp-cta-subtext${dark ? ' dark-section' : ''}`}>
      💳 3 cuotas sin interés de <strong>${Math.ceil(price / 3).toLocaleString('es-AR')}</strong>
      &nbsp;·&nbsp; 🚚 Envío gratis &nbsp;·&nbsp; 🛡️ 30 días de garantía
    </p>
  );
}

export default function WineLanding({ config: mc, theme }) {
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
  }, [mc.productSlug]);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: mc.checkoutName,
      content_type: 'product',
      currency:     'ARS',
      value:        mc.bundles?.[0]?.price || 0,
    });
  }, [mc.checkoutName, mc.bundles]);

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

  // Miniaturas "producto + regalo" debajo de cada pack (decorativas: el
  // nombre del pack ya dice qué incluye).
  const renderBundleThumbs = (b) => {
    const fallback = product?.imageUrl || '';
    const imgs = b.imgs?.length > 0 ? b.imgs : (b.img || fallback) ? [b.img || fallback] : [];
    if (imgs.length === 0) return null;
    return (
      <span className="bnd2-imgs" aria-hidden="true">
        {imgs.map((src, idx) => (
          <span key={idx} className="bnd2-imgs-item">
            {idx > 0 && <span className="bnd2-imgs-plus">+</span>}
            <span className="bnd2-thumb">
              <SafeImg src={src || fallback} alt="" width={42} height={42} sizes="42px" widths={[84]} />
            </span>
          </span>
        ))}
      </span>
    );
  };

  const { fallbackTitle } = theme;
  const heroImgs = useMemo(() => {
    const arr = [];
    if (product?.imageUrl) arr.push({ src: product.imageUrl, alt: fallbackTitle });
    if (Array.isArray(product?.images)) {
      product.images.forEach(x => {
        const url = typeof x === 'string' ? x : x?.url;
        if (url && !arr.find(a => a.src === url)) arr.push({ src: url, alt: fallbackTitle });
      });
    }
    return arr.length ? arr : mc.heroImages;
  }, [product, mc.heroImages, fallbackTitle]);

  const handleBuy = () => {
    if (!product || selectedBundle.soldOut) return;
    addItem(
      { ...product, name: `${mc.checkoutName} — ${selectedBundle.label}` },
      1,
      { bundleTotal: selectedBundle.price, compareAtPrice: selectedBundle.compareAt, gifts: selectedBundle.gifts || [], bundleImgs: selectedBundle.imgs || [] },
    );
    setShowCheckout(true);
  };

  if (!productReady) {
    return <LandingLoader />;
  }

  const activeImg = heroImgs[activeImgIdx] || heroImgs[0] || { src: '', alt: fallbackTitle };
  const wave = { dark: WINE, light: theme.waveLight ?? '#ffffff' };
  const marquee = mc.marquee ?? [];
  const miniReviews = mc.miniReviews?.length ? mc.miniReviews : mc.reviews;
  const circulacion = <CirculacionSection data={mc.circulacion} />;
  const wineFooter = theme.footer === 'wine';

  return (
    <>
    <main className="wine-wrap" style={theme.vars}>
      <title>{mc.pageTitle}</title>

      {/* ── CINTA ── (reemplaza al marquee global, oculto en App para estas rutas) */}
      <div className="ems-mq" aria-hidden="true">
        <div className="ems-mq__track">
          {[...marquee, ...marquee].map((t, i) => (
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
                    style={HERO_FIT[theme.heroFit ?? 'cover']}
                  />
                ) : (
                  <div className="spf-hero-ph" aria-label={activeImg.alt}>
                    <span className="spf-hero-ph-icon">{theme.icon}</span>
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
                    ? <SafeImg src={img.src} alt="" sizes="90px" widths={[180]} style={THUMB_STYLE} />
                    : <div className="spf-thumb-ph">{theme.icon}</div>
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
                  {theme.initials.map((letter, i) => (
                    <div key={i} className="avatar spf-avatar-init" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
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
              {theme.showProductName && (
                <div className="ems-product-name">
                  {product?.name || fallbackTitle}
                </div>
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
                <CountdownTimer storageKey={theme.countdownKey} minutes={335} />
              </div>

              {mc.urgencyBanner && (
                <div className="ems-urgency-banner">
                  <span className="ems-urgency-dot" />{mc.urgencyBanner}
                </div>
              )}

              <div className="bnd2-wrap">
                <BundleOptions
                  bundles={displayBundles}
                  selectedId={selectedBundle.id}
                  onSelect={setSelectedBundleId}
                  formatPrice={fmt}
                  renderMedia={renderBundleThumbs}
                />

                <button
                  className="bnd2-cta spf-cta"
                  type="button"
                  onClick={handleBuy}
                  disabled={!product || selectedBundle.soldOut}
                >
                  {!product ? 'Cargando…' : `${mc.ctaLine1} →`}
                </button>
                {!selectedBundle.soldOut && product && <CtaSubtext price={selectedBundle.price} />}
                <TrustPills />
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ── BANDAS ── */}
      <div className="pd-bands">

        <section className="pd-band pd-band--light">
          {theme.circulacionFirst && <div className="dtx-container">{circulacion}</div>}
          <div className="dtx-container">
            <MiniReviewsBar reviews={miniReviews} tone="wine" {...theme.miniReviews} />
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
            {!theme.circulacionFirst && circulacion}
            <StoryFlow blocks={mc.storyBlocks} imgProps={theme.storyImgProps} />
            <CuatroSemanasSection data={mc.cuatroSemanas} />
            <TresPasosSection data={mc.tresPasos} onBuy={handleBuy} />
          </div>
        </section>

        <WaveSeparator from="light" {...wave} />

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
                {GUARANTEE_PILLS.map(p => <span key={p} className="grt-pill">{p}</span>)}
              </div>
              <button className="grt-cta spf-grt-cta" onClick={handleBuy}>{mc.guarantee.cta}</button>
              <CtaSubtext price={selectedBundle.price} dark />
              <GuaranteeNote light />
            </div>
          </div>
        </section>

        <WaveSeparator from="dark" {...wave} />

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

        <WaveSeparator from="light" {...wave} />

        <section className="pd-band pd-band--blue">
          <div className="dtx-container dtx-py">
            <StatsCircles mc={mc} tone="wine" />
          </div>
        </section>

        <WaveSeparator from="dark" {...wave} />

        <section className="pd-band pd-band--light">
          <div className="dtx-container dtx-py" style={{ paddingBottom: '100px' }}>
            <LandingFaq title={mc.faqTitle} subtitle={mc.faqSubtitle} items={mc.faq} tone="wine" icon="plus" />
          </div>
        </section>

        {wineFooter && (
          <>
            <WaveSeparator from="light" {...wave} />
            <LandingFooter variant="wine" whatsappNumber={mc.whatsapp?.number} />
          </>
        )}

      </div>

      {!wineFooter && <LandingFooter waveFrom="#FFF5F8" whatsappNumber={mc.whatsapp?.number} />}

      {/* ── STICKY BAR ── */}
      <StickyBuyBar
        bundle={selectedBundle}
        visible={stickyVisible}
        onBuy={handleBuy}
        disabled={!product}
        buttonText={mc.stickyBtnText}
        showInstallments
        showLabel={theme.stickyShowLabel ?? true}
      />

      <WhatsAppTab wa={mc.whatsapp} raised={stickyVisible} />
    </main>

    {showCheckout && (
      <CheckoutSheet
        onClose={() => setShowCheckout(false)}
        primaryColor={WINE}
        primaryHover="#C2185B"
        allowCod={false}
      />
    )}
    </>
  );
}
