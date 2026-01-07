// frontend/src/pages/ProductDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { track } from "../lib/metaPixel";

/* =========================
   HELPERS
========================= */
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

function calcDiscountPercent(price, compareAt) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p || c <= 0) return null;
  return Math.round(((c - p) / c) * 100);
}

function Stars({ value = 4.8 }) {
  const v = Number(value);
  const full = Math.round(Number.isFinite(v) ? v : 4.8);
  const stars = Array.from({ length: 5 }, (_, i) => i < full);
  return (
    <div
      className="hero-stars"
      aria-label={`Rating ${Number.isFinite(v) ? v.toFixed(1) : "4.8"} de 5`}
    >
      {stars.map((on, i) => (
        <span key={i} className={`hero-star ${on ? "on" : ""}`}>
          ★
        </span>
      ))}
      <span className="hero-ratingText">{Number.isFinite(v) ? v.toFixed(1) : "4.8"}</span>
    </div>
  );
}

function moneyARS(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("es-AR")}`;
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);

  // NUEVO: Estado para la Notificación Flotante
  const [showToast, setShowToast] = useState(false);

  // Galería
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Qty / Bundle
  const [qty, setQty] = useState(1);
  const [bundle, setBundle] = useState(1);

  // Swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 40;

  // Evitar track duplicado de ViewContent
  const lastViewedRef = useRef(null);

  useEffect(() => {
    async function fetchOne() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/products/${id}`);
        if (res.data?.ok) setProduct(res.data.data);
        else setError("No se pudo cargar el producto.");
      } catch (e) {
        console.error(e);
        setError("Error al cargar el producto.");
      } finally {
        setLoading(false);
      }
    }
    fetchOne();
  }, [id]);

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

  // Swipe handlers
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

  // Mouse drag handlers
  const onMouseDown = (e) => setTouchStart(e.clientX);
  const onMouseUp = (e) => {
    if (!touchStart) return;
    const distance = touchStart - e.clientX;
    if (distance > minSwipeDistance) nextImage();
    if (distance < -minSwipeDistance) prevImage();
    setTouchStart(null);
  };

  // Datos producto
  const price = Number(product?.price) || 0;
  const compareAt = Number(product?.compareAtPrice) || (price ? Math.round(price * 2) : 0);
  const discountPct = calcDiscountPercent(price, compareAt) || 0;

  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 4766;
  const rating = product?.rating ?? 4.8;
  const reviewCount = product?.reviewCount ?? 1168;

  // --- MODIFICACIÓN: Lógica de Bullets inteligente ---
  const dbBullets =
    Array.isArray(product?.highlights) && product.highlights.length
      ? product.highlights
      : [product?.bullet1, product?.bullet2, product?.bullet3].filter(Boolean);

  const defaultBullets = [
    "Excelente Calidad Garantizada",
    "Compra Protegida 100%",
    "Envío Rápido y Seguro"
  ];

  const bullets = dbBullets.length > 0 ? dbBullets : defaultBullets;
  // ----------------------------------------------------

  // Promo x2
  const pack2Discount = 18;
  const unitPrice = price;
  const totalQty = qty;

  const promoOn = bundle === 2;
  const pairsQty = promoOn ? Math.floor(totalQty / 2) * 2 : 0;
  const remQty = totalQty - pairsQty;

  const displayTotal = promoOn
    ? Math.round(pairsQty * unitPrice * (1 - pack2Discount / 100) + remQty * unitPrice)
    : Math.round(totalQty * unitPrice);

  const contentId = useMemo(() => {
    return (
      product?.sku ||
      product?.productId ||
      product?._id ||
      (product?.id ? String(product.id) : null) ||
      id ||
      "SPEAKER_1"
    );
  }, [product, id]);

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

  // Click: AddToCart
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

    // Mostrar Notificación Flotante
    setShowToast(true);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 5000);

    window.dispatchEvent(
      new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } })
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    track("InitiateCheckout", {
      content_ids: [String(contentId)],
      content_type: "product",
      value: Number(displayTotal) || 0,
      currency: "ARS",
      num_items: Number(totalQty) || 1,
    });

    const promo = promoOn ? { type: "bundle2", discountPct: pack2Discount } : null;
    addItem(product, totalQty, promo ? { promo } : undefined);
    navigate("/checkout");
  };

  // --- ESTILOS INLINE ---
  const arrowStyle = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    cursor: "pointer",
    zIndex: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  };

  if (loading)
    return (
      <main className="section">
        <div className="container">
          <div className="pd-skeleton card">
            <div className="pd-skel-left" />
            <div className="pd-skel-right" />
          </div>
        </div>
      </main>
    );

  if (error || !product)
    return (
      <main className="section">
        <div className="container">
          <div className="card" style={{ padding: "1.1rem" }}>
            <div className="pd-badge">Error</div>
            <p className="pd-error" style={{ marginTop: "0.75rem" }}>
              {error || "Producto no encontrado."}
            </p>
            <div style={{ marginTop: "0.9rem" }}>
              <Link className="btn btn-ghost" to="/products">
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </main>
    );

  return (
    <main className="section">
      <div className="container">
        <div className="pd-grid" style={{ alignItems: "stretch" }}>
          {/* === IZQUIERDA: GALERÍA === */}
          <section
            className="pd-media card"
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              className="pd-mediaMain"
              style={{
                flex: 1,
                position: "relative",
                width: "100%",
                overflow: "hidden",
                background: "#f8fbff",
                cursor: "grab",
                touchAction: "pan-y",
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={() => setTouchStart(null)}
            >
              <div className="pd-discount" style={{ zIndex: 10 }}>
                {discountPct ? `${discountPct}%` : "OFERTA"} <span>OFF</span>
              </div>

              {images.length > 0 ? (
                <>
                  <img
                    className="pd-mainImg"
                    src={images[activeImgIndex]}
                    alt={product.name}
                    loading="lazy"
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                    }}
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        style={{ ...arrowStyle, left: "10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        style={{ ...arrowStyle, right: "10px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        ›
                      </button>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          background: "rgba(0,0,0,0.6)",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          pointerEvents: "none",
                        }}
                      >
                        {activeImgIndex + 1}/{images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div
                  className="pd-empty"
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Sin imagen
                </div>
              )}
            </div>

            {/* Thumbs */}
            {images.length > 1 && (
              <div
                className="pd-thumbs"
                style={{ padding: "10px", background: "#fff", borderTop: "1px solid #eee" }}
              >
                {images.slice(0, 8).map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    className={`pd-thumb ${idx === activeImgIndex ? "is-active" : ""}`}
                    onClick={() => setActiveImgIndex(idx)}
                    style={{ minWidth: "60px", height: "60px" }}
                  >
                    <img
                      src={img}
                      alt="thumb"
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* === DERECHA: INFO === */}
          <aside className="pd-info">
            <div className="hero-top">
              <div className="hero-proof">
                <div className="hero-avatars" aria-hidden="true">
                  <span className="av"></span>
                  <span className="av"></span>
                  <span className="av"></span>
                </div>
                <div className="hero-proofText">
                  <b>{Number(soldCount).toLocaleString("es-AR")}</b> personas compraron
                </div>
              </div>

              <div className="hero-badgesRow">
                {discountPct ? (
                  <div className="hero-badgeOff">
                    <span className="hero-badgeOffBig">{discountPct}%</span>
                    <span className="hero-badgeOffSmall">OFF</span>
                  </div>
                ) : (
                  <div className="hero-badgeSoft">Oferta limitada</div>
                )}
                <div className="hero-badgeSoft">Envío gratis</div>
                <div className="hero-badgeSoft">Pago protegido</div>
              </div>

              <h1 className="hero-title">{product.name}</h1>
              <p className="hero-sub">
                {product.subtitle || "Comprá fácil y seguro. Envío gratis a todo el país."}
              </p>

              <div className="hero-ratingRow">
                <Stars value={rating} />{" "}
                <span className="hero-reviews">({Number(reviewCount).toLocaleString("es-AR")} reseñas)</span>
              </div>

              <div className="hero-priceRow">
                <span className="hero-price">{formatARS(price || 0)}</span>
                {compareAt > price && (
                  <>
                    <span className="hero-compare">{formatARS(compareAt)}</span>
                    <span className="hero-pill">{discountPct}% OFF</span>
                  </>
                )}
              </div>

              {/* --- MODIFICACIÓN: Ticks visuales --- */}
              <div className="pd-ticks-container">
                {bullets.slice(0, 3).map((b, idx) => (
                  <div key={idx} className="pd-tick-row">
                    <div className="pd-tick-icon">
                      {/* Icono Check SVG */}
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4.14286 8.14286L11 1.28571" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="pd-tick-text">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pd-trust">
              <div className="pd-trustItem">
                <div className="pd-ico">❤</div>
                <div>
                  <div className="pd-trustT">Pago 100% protegido</div>
                </div>
              </div>
              <div className="pd-trustItem">
                <div className="pd-ico">↩</div>
                <div>
                  <div className="pd-trustT">Devolución sin vueltas</div>
                </div>
              </div>
              <div className="pd-trustItem">
                <div className="pd-ico">🚚</div>
                <div>
                  <div className="pd-trustT">Envío gratis a todo el país</div>
                </div>
              </div>
            </div>

            <div className="pd-divider">Compra en combo y ahorrá 🔥</div>

            <div className="pd-bundles">
              <label className={`pd-bundle ${bundle === 1 ? "is-selected" : ""}`}>
                <input type="radio" name="bundle" checked={bundle === 1} onChange={() => setBundle(1)} />
                <div className="pd-bundleBody">
                  <div className="pd-bundleLeft">
                    <div className="pd-bundleTitle">
                      Lleva 1 <span className="pd-miniTag">Envío gratis</span>
                    </div>
                    <div className="pd-bundleSub">Precio normal</div>
                  </div>
                  <div className="pd-bundleRight">{moneyARS(unitPrice)}</div>
                </div>
              </label>

              <label className={`pd-bundle ${bundle === 2 ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="bundle"
                  checked={bundle === 2}
                  onChange={() => {
                    setBundle(2);
                    setQty((q) => (q < 2 ? 2 : q));
                  }}
                />
                <div className="pd-bundleBody">
                  <div className="pd-bundleLeft">
                    <div className="pd-bundleTitle">
                      Lleva 2 <span className="pd-miniTag">Envío gratis</span>
                    </div>
                    {/* Aquí está tu texto personalizado */}
                    <div className="pd-bundleSub"><b>ahorra</b> {pack2Discount}% mas!!</div>
                  </div>
                  <div className="pd-bundleRight">
                    {/* Precio final con descuento */}
                    {moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}
                    
                    {/* ESTA ES LA LÍNEA QUE FALTABA (PRECIO TACHADO) */}
                    <div className="pd-bundleCompare">{moneyARS(unitPrice * 4)}</div>
                  </div>
                </div>
                <div className="pd-popular">Más popular</div>
              </label>
            </div>

            <div className="pd-qtyRow">
              <div className="pd-qtyLabel">Cantidad</div>
              <div className="pd-qty">
                <button type="button" className="pd-qtyBtn" onClick={() => setQty((q) => clampInt(q - 1, 1, 20))}>
                  −
                </button>
                <div className="pd-qtyVal">{qty}</div>
                <button type="button" className="pd-qtyBtn" onClick={() => setQty((q) => clampInt(q + 1, 1, 20))}>
                  +
                </button>
              </div>
              <div className="pd-qtyHint">Total: {totalQty} u.</div>
            </div>

            <button className="pd-ctaPrimary" type="button" onClick={handleAddToCart}>
              AGREGAR AL CARRITO <span className="pd-ctaSub">Total: {moneyARS(displayTotal)}</span>
            </button>
            <button className="pd-ctaSecondary" type="button" onClick={handleBuyNow}>
              COMPRAR AHORA
            </button>

            <a
              className="pd-detailsLink"
              href="#details"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Ver todos los detalles →
            </a>

            <div className="pd-miniNav">
              <Link className="btn btn-ghost" to="/cart">
                Carrito
              </Link>
              <Link className="btn btn-ghost" to="/checkout">
                Checkout
              </Link>
              <Link className="btn btn-ghost" to="/products">
                Tienda
              </Link>
            </div>
          </aside>
        </div>

        <section id="details" className="pd-details card" style={{ marginTop: "1.1rem" }}>
          <div className="pd-detailsHead">
            <div className="pd-badge">Detalles</div>
            <div className="pd-detailsTitle">Todo lo que incluye tu compra</div>
          </div>

          <div className="pd-detailsGrid">
            <div className="pd-detailBlock">
              <div className="pd-detailT">Descripción</div>
              <p className="pd-detailP">{product.description || `Producto premium de ${storeName}.`}</p>
            </div>
            <div className="pd-detailBlock">
              <div className="pd-detailT">Envío</div>
              <p className="pd-detailP">Envío gratis a todo el país. Coordinamos por WhatsApp apenas se confirme el pago.</p>
            </div>
            <div className="pd-detailBlock">
              <div className="pd-detailT">Pago</div>
              <p className="pd-detailP">Mercado Pago / Transferencia. Compra rápida y segura.</p>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          AVISO FLOTANTE (TOAST)
          ============================================================ */}
      {showToast && (
        <div className="pd-toast-wrapper">
          <div className="pd-toast-content">
            {/* Foto y texto */}
            <div className="pd-toast-main">
              <img src={images[0]} alt="" className="pd-toast-img" />
              <div className="pd-toast-info">
                <span className="pd-toast-status">✓ ¡Agregado!</span>
                <span className="pd-toast-name">{product.name}</span>
              </div>
              <button className="pd-toast-close" onClick={() => setShowToast(false)}>✕</button>
            </div>

            {/* Botones de acción */}
            <div className="pd-toast-actions">
              <button className="pd-toast-btn-secondary" onClick={() => navigate('/cart')}>
                IR AL CARRITO
              </button>
              <button className="pd-toast-btn-primary" onClick={() => navigate('/checkout')}>
                FINALIZAR COMPRA
              </button>
            </div>
            {/* Barra de progreso de auto-cierre */}
            <div className="pd-toast-progress"></div>
          </div>
        </div>
      )}

      {/* Estilos específicos */}
      <style>{`
        /* ESTILOS DE LOS TICKS NUEVOS */
        .pd-ticks-container {
          margin: 14px 0 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pd-tick-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pd-tick-icon {
          width: 22px;
          height: 22px;
          min-width: 22px;
          background: #25D366; /* Verde Éxito */
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(37, 211, 102, 0.3);
        }
        .pd-tick-text {
          font-weight: 600;
          color: #334155;
          font-size: 0.95rem;
          line-height: 1.3;
        }

        /* Contenedor Toast */
        .pd-toast-wrapper {
          position: fixed;
          z-index: 10000;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: toastSlideIn 0.5s ease-out;
        }

        /* Posicionamiento Responsivo */
        @media (min-width: 768px) {
          .pd-toast-wrapper {
            bottom: 24px;
            right: 24px;
            width: 350px;
          }
        }
        @media (max-width: 767px) {
          .pd-toast-wrapper {
            top: 12px;
            left: 12px;
            right: 12px;
            width: auto;
          }
        }

        .pd-toast-content {
          background: white;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 30px rgba(6, 55, 165, 0.15);
          border: 1px solid #DDF5FF;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
          position: relative;
        }

        .pd-toast-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pd-toast-img {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          object-fit: cover;
        }

        .pd-toast-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pd-toast-status {
          color: #22C3FF;
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .pd-toast-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0637A5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pd-toast-close {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          font-size: 1rem;
          padding: 4px;
        }

        .pd-toast-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .pd-toast-btn-primary {
          background: #0B5CFF;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .pd-toast-btn-secondary {
          background: #DDF5FF;
          color: #0637A5;
          border: none;
          padding: 8px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .pd-toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: #22C3FF;
          width: 100%;
          animation: toastProgress 5s linear forwards;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </main>
  );
}