import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckoutSheet } from '../../pages/CheckoutSheet';
import { useCart } from '../../hooks/useCart';
import { trackWithCapi } from '../../lib/metaPixel';
import api from '../../services/api';
import './DepiladoraIPL.css';
import SafeImg from '../../components/SafeImg';
import { moneyARS } from '../../utils/pricing.js';
import { HERO_SIZES, THUMB_WIDTHS, ICON_WIDTHS } from '../../components/landing/imageSizes';
import {
  PRODUCT_SLUG, CHECKOUT_NAME, DEFAULT_PRICE, DEFAULT_COMPARE,
  BUNDLE_PRODUCT_IMG, BUNDLE_RAZOR_IMG, BUNDLE_EBOOK_IMG,
  BUNDLE_PRODUCT_NAME, BUNDLE_RAZOR_NAME, BUNDLE_EBOOK_NAME,
  BENEFITS, PRODUCT_TABS, heroReviews, FALLBACK_IMAGES,
} from './data';
import AnnouncementBar from './sections/AnnouncementBar';
import ZoneProgress from './sections/ZoneProgress';
import ResultsStats from './sections/ResultsStats';
import VideoStrip from './sections/VideoStrip';
import FeatureBlocks from './sections/FeatureBlocks';
import Comparison from './sections/Comparison';
import Reviews from './sections/Reviews';
import HowToUse from './sections/HowToUse';
import Guarantee from './sections/Guarantee';
import Faq from './sections/Faq';
import Footer from './sections/Footer';

/* Landing de la Depiladora IPL. Este archivo tiene el estado de compra
   (producto, pack, checkout, barra fija) y compone el hero; cada bloque
   visual vive en sections/ y los textos/URLs en data.js. */

const accordionIcons = [
  <svg key="clip" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 012 0v1h2V2a1 1 0 012 0v1" /><line x1="7" y1="8" x2="13" y2="8" /><line x1="7" y1="11" x2="13" y2="11" /><line x1="7" y1="14" x2="10" y2="14" /></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7" /><polyline points="10,6 10,10 13,12" /></svg>,
  <svg key="heart" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" /></svg>,
  <svg key="shield" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" /><polyline points="7,10 9,12 13,8" /></svg>,
];

/* ── Componente principal ─────────────────────────────────── */
export default function DepiladoraIPL() {
  const [product, setProduct]           = useState(null);
  const [productReady, setProductReady] = useState(false);
  const [activeImg, setActiveImg]       = useState(0);
  const [openTab, setOpenTab]           = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [hrIdx, setHrIdx]               = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(0);

  const ctaRef   = useRef(null);
  const { addItem } = useCart();

  /* API fetch */
  useEffect(() => {
    api.get(`/products/slug/${PRODUCT_SLUG}`)
      .then(r => { setProduct(r.data?.data || r.data); setProductReady(true); })
      .catch(() => setProductReady(true));
  }, []);

  useEffect(() => {
    trackWithCapi('ViewContent', {
      content_name: CHECKOUT_NAME,
      content_type: 'product',
      currency:     'ARS',
      value:        DEFAULT_PRICE,
    });
  }, []);



  /* Hero review rotation */
  useEffect(() => {
    const t = setInterval(() => setHrIdx(i => (i + 1) % heroReviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* Sticky bar */
  useEffect(() => {
    if (!productReady || !ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [productReady]);

  useEffect(() => {
    document.body.classList.toggle('pdx-sticky-active', stickyVisible);
    return () => document.body.classList.remove('pdx-sticky-active');
  }, [stickyVisible]);

  const price      = product?.price ?? DEFAULT_PRICE;
  const compareAt  = product?.compareAtPrice ?? DEFAULT_COMPARE;
  const discountPct = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 55;
  const soldOut    = product?.stock === 0;


  const BUNDLES = useMemo(() => [
    {
      id: 0,
      label: 'Pack Completo',
      badge: 'MÁS POPULAR',
      perks: 'Envío gratis · 3 cuotas sin interés',
      bundlePrice: price,
      comparePrice: compareAt,
      productThumbName: BUNDLE_PRODUCT_NAME,
      extras: [
        { id: 'razor', label: BUNDLE_RAZOR_NAME, img: BUNDLE_RAZOR_IMG },
        { id: 'ebook', label: BUNDLE_EBOOK_NAME,  img: BUNDLE_EBOOK_IMG },
      ],
    },
  ], [price, compareAt]);

  const handleBuy = () => {
    if (soldOut) return;
    const bundle = BUNDLES[selectedBundle];
    const productData = product || { _id: PRODUCT_SLUG, name: CHECKOUT_NAME, slug: PRODUCT_SLUG };
    addItem(
      { ...productData, name: CHECKOUT_NAME, imageUrl: productImages[0]?.src },
      1,
      {
        bundleTotal:    bundle.bundlePrice,
        compareAtPrice: bundle.comparePrice,
        gifts:          bundle.extras.map(e => e.label),
        bundleImgs:     bundle.extras.map(e => e.img).filter(Boolean),
      },
    );
    setShowCheckout(true);
  };



  const productImages = product?.images?.length
    ? product.images.map((src, i) => ({ src, alt: `Depiladora IPL — imagen ${i + 1}` }))
    : FALLBACK_IMAGES;

  if (!productReady) {
    return (
      <div className="ipl-loading-wrap">
        <div className="ipl-loading-bar" />
      </div>
    );
  }

  return (
    <>
      <main className="ipl-wrap">
        <title>Depiladora IPL Profesional | Luz pulsada en casa | Amelor</title>

        {/* ══ S1 — ANNOUNCEMENT BAR ══ */}
        <AnnouncementBar />

        {/* ══ S2 — HERO ══ */}
        <div className="ipl-hero">
          <div className="ipl-hero-inner">

            {/* Galería */}
            <div className="ipl-gallery">
              <div className="ipl-gallery-main">
                <SafeImg
                  src={productImages[activeImg].src}
                  alt={productImages[activeImg].alt}
                  width={800}
                  height={800}
                  sizes={HERO_SIZES}
                  priority
                />
              </div>
              <div className="ipl-thumbs">
                {productImages.map((img, i) => (
                  <div
                    key={i}
                    className={`ipl-thumb${i === activeImg ? ' ipl-thumb-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Imagen ${i + 1}`}
                  >
                    <SafeImg src={img.src} alt="" width={60} height={60} sizes="60px" widths={THUMB_WIDTHS} />
                  </div>
                ))}
              </div>
            </div>

            {/* Info de compra */}
            <div className="ipl-info">
              <div className="ipl-stars">
                <span style={{ color: '#F472B6' }}>★★★★★</span>
                <span className="ipl-stars-count">4.9 / 5</span>
                <span className="ipl-reviews-count">| Más de 10.000 clientas satisfechas</span>
              </div>

              <h1 className="ipl-product-title">Depiladora IPL Profesional de Amelor</h1>

              <div className="ipl-pricing">
                <span className="ipl-price-original">{moneyARS(compareAt)}</span>
                <span className="ipl-price-sale">{moneyARS(price)}</span>
                <span className="ipl-badge-discount">{discountPct}% OFF</span>
                <span className="ipl-cuotas">3 cuotas sin interés de <strong>{moneyARS(Math.ceil(price / 3))}</strong></span>
              </div>

              <ul className="ipl-benefits">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="ipl-benefit-item">
                    <span className="ipl-benefit-check">✅</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Bundle selector */}
              <div className="ipl-bundles" role="radiogroup" aria-label="Elegí tu pack">
                {BUNDLES.map((b, i) => (
                  <label
                    key={b.id}
                    className={`ipl-bundle-opt${selectedBundle === i ? ' selected' : ''}`}
                  >
                    <input type="radio" name="ipl-bundle" checked={selectedBundle === i} onChange={() => setSelectedBundle(i)} />
                    <div className="ipl-bundle-body">
                      <div className="ipl-bundle-top">
                        <div className="ipl-bundle-left">
                          <div className="ipl-bundle-label-row">
                            <span className="ipl-bundle-label">{b.label}</span>
                            {b.badge && <span className="ipl-bundle-badge">{b.badge}</span>}
                          </div>
                          <span className="ipl-bundle-perks">{b.perks}</span>
                        </div>
                        <div className="ipl-bundle-price-col">
                          <span className="ipl-bundle-price">{moneyARS(b.bundlePrice)}</span>
                          <span className="ipl-bundle-compare">{moneyARS(b.comparePrice)}</span>
                        </div>
                      </div>

                      {b.extras.length > 0 && (
                        <div className="ipl-bundle-extras-wrap">
                          <div className="ipl-bundle-thumbs">
                            {/* Producto principal */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb">
                                <SafeImg src={BUNDLE_PRODUCT_IMG} alt={b.productThumbName} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
                              </div>
                              <span className="ipl-bundle-item-name">{b.productThumbName}</span>
                            </div>
                            <span className="ipl-bundle-plus">+</span>
                            {/* Extra 1 */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb">
                                <SafeImg src={b.extras[0].img} alt={b.extras[0].label} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
                                <span className="ipl-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="ipl-bundle-item-name">{b.extras[0].label}</span>
                            </div>
                            <span className="ipl-bundle-plus">+</span>
                            {/* Extra 2 */}
                            <div className="ipl-bundle-item">
                              <div className="ipl-bundle-thumb ipl-bundle-thumb--ebook">
                                <SafeImg src={b.extras[1].img} alt={b.extras[1].label} width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
                                <span className="ipl-bundle-sticker">GRATIS</span>
                              </div>
                              <span className="ipl-bundle-item-name">{b.extras[1].label}</span>
                            </div>
                          </div>
                          <div className="ipl-bundle-shipping">🚚 Envío gratis a todo el país</div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="ipl-urgency">
                <span>🔴</span>
                <span>Casi agotado | Solo quedan 7 unidades</span>
              </div>

              <button ref={ctaRef} className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
                {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
              </button>

              {/* Trust badges */}
              <div className="ipl-trust-badges">
                <div className="ipl-trust-item">
                  <SafeImg src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131118.961.png?v=1719749489" alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Garantía devolución<br />90 días</span>
                </div>
                <div className="ipl-trust-item">
                  <SafeImg src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-06-30T131541.485.png?v=1719749753" alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <span>Envío gratis<br />en todos los pedidos</span>
                </div>
                <div className="ipl-trust-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 50 50" fill="currentColor" style={{ flexShrink: 0 }}><path d="M 21.4375 1.0058594 C 20.081703 1.0463506 18.771739 1.7524791 18.025391 2.9863281 L 17.761719 3.4238281 C 17.385173 4.0455037 16.721685 4.4283987 15.996094 4.4433594 L 15.994141 4.4433594 L 15.482422 4.4550781 C 13.286577 4.5008101 11.497809 6.2882845 11.453125 8.484375 L 11.441406 8.9960938 C 11.426446 9.7216978 11.042385 10.386559 10.421875 10.761719 L 9.984375 11.027344 C 8.1054479 12.164721 7.4493952 14.60833 8.5078125 16.533203 L 8.5097656 16.533203 L 8.7558594 16.982422 C 9.1060077 17.618128 9.1060077 18.385778 8.7558594 19.021484 L 8.5097656 19.46875 C 7.4515168 21.393317 8.1061771 23.837315 9.9863281 24.974609 L 10.423828 25.238281 C 11.045504 25.614827 11.428399 26.278315 11.443359 27.003906 L 11.443359 27.005859 L 11.455078 27.517578 C 11.49207 29.293819 12.67637 30.78643 14.287109 31.322266 L 9.0917969 42.580078 A 1.0001 1.0001 0 0 0 10 44 L 16.519531 44 L 20.21875 48.625 A 1.0001 1.0001 0 0 0 21.916016 48.400391 L 25.03125 41.28125 L 28.146484 48.400391 A 1.0001 1.0001 0 0 0 29.84375 48.625 L 33.542969 44 L 40.0625 44 A 1.0001 1.0001 0 0 0 40.970703 42.580078 L 35.767578 31.304688 C 37.351214 30.753718 38.510287 29.274384 38.546875 27.517578 L 38.546875 27.515625 L 38.558594 27.005859 L 38.558594 27.003906 C 38.573554 26.278302 38.957615 25.613441 39.578125 25.238281 L 40.017578 24.972656 C 41.896553 23.835278 42.550604 21.393623 41.492188 19.46875 L 41.490234 19.466797 L 41.240234 19.015625 C 40.892213 18.380675 40.892703 17.614886 41.242188 16.980469 L 41.490234 16.533203 C 42.548024 14.607519 41.893895 12.165278 40.015625 11.027344 L 39.576172 10.761719 C 38.954541 10.385361 38.571601 9.7216849 38.556641 8.9960938 L 38.544922 8.484375 C 38.499191 6.2865703 36.711715 4.4978091 34.515625 4.453125 L 34.003906 4.4414062 C 33.278302 4.4264453 32.613441 4.0423845 32.238281 3.421875 L 31.972656 2.984375 C 30.835362 1.104224 28.391364 0.44956368 26.466797 1.5078125 L 26.017578 1.7558594 C 25.381872 2.1060077 24.614222 2.1060077 23.978516 1.7558594 L 23.53125 1.5097656 C 23.050108 1.2452034 22.537032 1.0874427 22.019531 1.0292969 C 21.825469 1.0074922 21.631185 1.0000749 21.4375 1.0058594 z M 21.386719 3 C 21.782233 2.9711393 22.192072 3.0548121 22.568359 3.2617188 L 23.013672 3.5078125 C 24.247966 4.1876642 25.750081 4.1876642 26.984375 3.5078125 L 27.431641 3.2597656 L 27.431641 3.2617188 C 28.435074 2.7099676 29.669013 3.0396824 30.261719 4.0195312 L 30.527344 4.4570312 C 31.255989 5.6612476 32.553769 6.411729 33.960938 6.4414062 L 34.474609 6.453125 C 35.619859 6.476427 36.523573 7.3781883 36.546875 8.5234375 L 36.546875 8.5253906 L 36.556641 9.0371094 C 36.585681 10.445518 37.336691 11.743202 38.541016 12.472656 L 38.978516 12.738281 C 39.957765 13.330624 40.288615 14.563305 39.738281 15.566406 L 39.490234 16.015625 C 38.810383 17.249919 38.810383 18.750081 39.490234 19.984375 L 39.492188 19.986328 L 39.492188 19.988281 L 39.740234 20.431641 C 40.291817 21.434767 39.959494 22.669097 38.980469 23.261719 L 38.542969 23.527344 C 37.337478 24.256184 36.587633 25.554495 36.558594 26.962891 L 36.548828 27.474609 L 36.548828 27.476562 C 36.525528 28.621813 35.621812 29.523573 34.476562 29.546875 L 33.962891 29.558594 C 32.55523 29.588284 31.258416 30.337244 30.529297 31.541016 L 30.529297 31.542969 L 30.263672 31.980469 C 29.670966 32.960318 28.437027 33.290032 27.433594 32.738281 L 27.433594 32.740234 L 26.986328 32.492188 C 25.752034 31.812335 24.249919 31.812335 23.015625 32.492188 L 22.568359 32.740234 L 22.568359 32.738281 C 21.565233 33.289864 20.330903 32.959494 19.738281 31.980469 L 19.472656 31.542969 C 18.744011 30.338752 17.446232 29.588271 16.039062 29.558594 L 16.037109 29.558594 L 15.525391 29.546875 C 14.380141 29.523575 13.476427 28.621813 13.453125 27.476562 L 13.453125 27.474609 L 13.443359 26.962891 C 13.414319 25.554482 12.663309 24.256798 11.458984 23.527344 L 11.021484 23.261719 C 10.04167 22.668878 9.7099674 21.435074 10.261719 20.431641 L 10.507812 19.986328 L 10.507812 19.984375 C 11.186723 18.750406 11.187351 17.249349 10.507812 16.015625 L 10.259766 15.568359 L 10.261719 15.568359 C 9.7101357 14.565233 10.040506 13.330903 11.019531 12.738281 L 11.457031 12.472656 C 12.661248 11.744011 13.411729 10.446231 13.441406 9.0390625 L 13.441406 9.0371094 L 13.453125 8.5253906 C 13.476425 7.3801414 14.378187 6.4764275 15.523438 6.453125 L 15.525391 6.453125 L 16.037109 6.4433594 C 17.445518 6.4143204 18.743202 5.6633088 19.472656 4.4589844 L 19.738281 4.0214844 C 20.034634 3.5315599 20.489931 3.2024706 20.998047 3.0664062 C 21.125076 3.0323902 21.254881 3.0096202 21.386719 3 z M 32.283203 11.085938 L 24.042969 23.966797 L 17.419922 18.005859 L 16.080078 19.494141 L 24.457031 27.03125 L 33.966797 12.164062 L 32.283203 11.085938 z M 33.701172 31.603516 L 38.498047 42 L 33.0625 42 A 1.0001 1.0001 0 0 0 32.28125 42.375 L 29.314453 46.082031 L 26.123047 38.783203 L 27.806641 34.935547 C 29.413838 35.18657 31.089508 34.478857 31.974609 33.015625 L 32.240234 32.578125 C 32.562592 32.045913 33.099287 31.704691 33.701172 31.603516 z M 16.357422 31.611328 C 16.936501 31.724996 17.45057 32.063489 17.761719 32.578125 L 18.027344 33.015625 C 19.164722 34.8946 21.60833 35.550604 23.533203 34.492188 L 23.533203 34.490234 L 23.982422 34.244141 C 24.592626 33.908038 25.321448 33.903754 25.941406 34.212891 L 20.748047 46.082031 L 17.78125 42.375 A 1.0001 1.0001 0 0 0 17 42 L 11.564453 42 L 16.357422 31.611328 z" /></svg>
                  <span>Garantía<br />1 año</span>
                </div>
              </div>

              {/* Medios de pago */}
              <div className="ipl-payment-block">
                <div className="ipl-payment-grid">
                  <img className="ipl-pay-chip" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mercado_Pago.svg/250px-Mercado_Pago.svg.png" alt="MercadoPago" style={{ height: 22 }} loading="lazy" decoding="async" />
                  <svg className="ipl-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 38 24" width="38" height="24" aria-label="Visa"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"/></svg>
                  <svg className="ipl-pay-chip" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-label="Mastercard"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"/><circle fill="#EB001B" cx="15" cy="12" r="7"/><circle fill="#F79E1B" cx="23" cy="12" r="7"/><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"/></svg>
                  <svg className="ipl-pay-chip" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-amex-ipl" viewBox="0 0 38 24" width="38" height="24"><title id="pi-amex-ipl">American Express</title><path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" opacity=".07"/><path fill="#006FCF" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z"/><path fill="#FFF" d="M22.012 19.936v-8.421L37 11.528v2.326l-1.732 1.852L37 17.573v2.375h-2.766l-1.47-1.622-1.46 1.628-9.292-.02Z"/><path fill="#006FCF" d="M23.013 19.012v-6.57h5.572v1.513h-3.768v1.028h3.678v1.488h-3.678v1.01h3.768v1.531h-5.572Z"/><path fill="#006FCF" d="m28.557 19.012 3.083-3.289-3.083-3.282h2.386l1.884 2.083 1.89-2.082H37v.051l-3.017 3.23L37 18.92v.093h-2.307l-1.917-2.103-1.898 2.104h-2.321Z"/><path fill="#FFF" d="M22.71 4.04h3.614l1.269 2.881V4.04h4.46l.77 2.159.771-2.159H37v8.421H19l3.71-8.421Z"/><path fill="#006FCF" d="m23.395 4.955-2.916 6.566h2l.55-1.315h2.98l.55 1.315h2.05l-2.904-6.566h-2.31Zm.25 3.777.875-2.09.873 2.09h-1.748Z"/><path fill="#006FCF" d="M28.581 11.52V4.953l2.811.01L32.84 9l1.456-4.046H37v6.565l-1.74.016v-4.51l-1.644 4.494h-1.59L30.35 7.01v4.51h-1.768Z"/></svg>
                  <svg className="ipl-pay-chip" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" x="0" y="0" width="38" height="24" viewBox="0 0 165.521 105.965" xmlSpace="preserve" aria-labelledby="pi-apple-ipl"><title id="pi-apple-ipl">Apple Pay</title><path fill="#000" d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.952-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z"/><path fill="#FFF" d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.065 2.583.22.75.135 1.38.34 1.984.648a6.392 6.392 0 0 1 2.804 2.807c.306.6.51 1.226.645 1.983.154.854.197 1.783.218 2.58.013.45.019.9.02 1.36.005.557.005 1.113.005 1.671v76.318c0 .558 0 1.114-.004 1.682-.002.45-.008.9-.02 1.35-.022.796-.065 1.725-.221 2.589a6.855 6.855 0 0 1-.645 1.975 6.397 6.397 0 0 1-2.808 2.807c-.6.306-1.228.511-1.971.645-.881.157-1.847.2-2.574.22-.457.01-.912.017-1.379.019-.555.004-1.113.004-1.669.004H14.801c-.55 0-1.1 0-1.66-.004a74.993 74.993 0 0 1-1.35-.018c-.744-.02-1.71-.064-2.584-.22a6.938 6.938 0 0 1-1.986-.65 6.337 6.337 0 0 1-1.622-1.18 6.355 6.355 0 0 1-1.178-1.623 6.935 6.935 0 0 1-.646-1.985c-.156-.863-.2-1.788-.22-2.578a66.088 66.088 0 0 1-.02-1.355l-.003-1.327V14.474l.002-1.325a66.7 66.7 0 0 1 .02-1.357c.022-.792.065-1.717.222-2.587a6.924 6.924 0 0 1 .646-1.981c.304-.598.7-1.144 1.18-1.623a6.386 6.386 0 0 1 1.624-1.18 6.96 6.96 0 0 1 1.98-.646c.865-.155 1.792-.198 2.586-.22.452-.012.905-.017 1.354-.02l1.677-.003h135.875"/><g><g><path fill="#000" d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.959-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858"/><path fill="#000" d="M45.587 39.079c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.447.05-6.645 2-8.395 5.1-3.598 6.2-.95 15.4 2.55 20.45 1.699 2.5 3.747 5.25 6.445 5.151 2.55-.1 3.549-1.65 6.647-1.65 3.097 0 3.997 1.65 6.696 1.6 2.798-.05 4.548-2.5 6.247-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.396-2.101-5.446-8.251-.05-5.15 4.198-7.6 4.398-7.751-2.399-3.548-6.147-3.948-7.447-4.048"/></g><g><path fill="#000" d="M78.973 32.11c7.278 0 12.347 5.017 12.347 12.321 0 7.33-5.173 12.373-12.529 12.373h-8.058V69.62h-5.822V32.11h14.062zm-8.24 19.807h6.68c5.07 0 7.954-2.729 7.954-7.46 0-4.73-2.885-7.434-7.928-7.434h-6.706v14.894z"/><path fill="#000" d="M92.764 61.847c0-4.809 3.665-7.564 10.423-7.98l7.252-.442v-2.08c0-3.04-2.001-4.704-5.562-4.704-2.938 0-5.07 1.507-5.51 3.82h-5.252c.157-4.86 4.731-8.395 10.918-8.395 6.654 0 10.995 3.483 10.995 8.89v18.663h-5.38v-4.497h-.13c-1.534 2.937-4.914 4.782-8.579 4.782-5.406 0-9.175-3.222-9.175-8.057zm17.675-2.417v-2.106l-6.472.416c-3.64.234-5.536 1.585-5.536 3.95 0 2.288 1.975 3.77 5.068 3.77 3.95 0 6.94-2.522 6.94-6.03z"/><path fill="#000" d="M120.975 79.652v-4.496c.364.051 1.247.103 1.715.103 2.573 0 4.029-1.09 4.913-3.899l.52-1.663-9.852-27.293h6.082l6.863 22.146h.13l6.862-22.146h5.927l-10.216 28.67c-2.34 6.577-5.017 8.735-10.683 8.735-.442 0-1.872-.052-2.261-.157z"/></g></g></svg>
                </div>
              </div>

              {/* Review inline hero */}
              <div className="ipl-hero-review">
                <div className="ipl-hr-avatar">
                  <SafeImg src={heroReviews[hrIdx].avatar} alt="" width={44} height={44} sizes="44px" widths={ICON_WIDTHS} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="ipl-hr-content">
                  <div className="ipl-hr-top">
                    <strong className="ipl-hr-name">{heroReviews[hrIdx].name}</strong>
                    <span className="ipl-hr-stars">{'★'.repeat(heroReviews[hrIdx].stars)}</span>
                  </div>
                  <p className="ipl-hr-text">"{heroReviews[hrIdx].text}"</p>
                </div>
                <button className="ipl-hr-next" onClick={() => setHrIdx(i => (i + 1) % heroReviews.length)} aria-label="Siguiente reseña">›</button>
              </div>

              {/* Acordeón */}
              <div className="ipl-accordion">
                {PRODUCT_TABS.map((tab, i) => (
                  <div key={i} className="ipl-acc-item">
                    <button
                      className="ipl-acc-trigger"
                      onClick={() => setOpenTab(openTab === i ? null : i)}
                      aria-expanded={openTab === i}
                    >
                      <span className="ipl-acc-icon">{accordionIcons[i]}</span>
                      <span className="ipl-acc-title">{tab.title}</span>
                      <span className={`ipl-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
                    </button>
                    <div className={`ipl-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
                      <div className="ipl-acc-body-inner">
                        {tab.content.map((line, j) => <p key={j}>{line}</p>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ S3.5 — ANTES / DESPUÉS POR ZONA ══ */}
        <ZoneProgress />

        <ResultsStats />

        <VideoStrip />

        <FeatureBlocks />

        <Comparison />

        <Reviews />

        <HowToUse />

        <Guarantee onBuy={handleBuy} soldOut={soldOut} />

        <Faq />

      </main>{/* /ipl-wrap */}

      {/* Sticky CTA bar */}
      <div className={`ipl-sticky-bar${stickyVisible ? ' ipl-visible' : ''}`} aria-hidden={!stickyVisible} inert={!stickyVisible}>
        <button className="ipl-btn-cta" onClick={handleBuy} disabled={soldOut}>
          {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
        </button>
      </div>

      {/* Footer */}
      <Footer />

      {showCheckout && (
        <CheckoutSheet
          onClose={() => setShowCheckout(false)}
          primaryColor="#9F1239"
          primaryHover="#7f0f2e"
          accentColor="#F9A8D4"
          fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        />
      )}
    </>
  );
}
