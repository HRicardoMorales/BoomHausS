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
  const compareAt = Number(product?.compareAtPrice) || (price ? Math.round(price * 1.34) : 0);
  const discountPct = calcDiscountPercent(price, compareAt) || 0;

  const soldCount = product?.soldCount ?? product?.socialProofCount ?? 4766;
  const rating = product?.rating ?? 4.8;
  const reviewCount = product?.reviewCount ?? 1168;

  const bullets =
    Array.isArray(product?.highlights) && product.highlights.length
      ? product.highlights.slice(0, 3)
      : [product?.bullet1, product?.bullet2, product?.bullet3].filter(Boolean).slice(0, 3);

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

  // ID estable para Meta (mejor SKU/ID real)
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

  // ✅ TRACK: ViewContent cuando ya hay product (una sola vez por producto)
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

  // ✅ CLICK: AddToCart
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

    // (tu toast ya escucha este evento)
    window.dispatchEvent(
      new CustomEvent("cart:added", { detail: { name: product?.name || "Producto" } })
    );
  };

  // ✅ CLICK: BuyNow (inicia checkout)
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

              <ul className="hero-bullets">
                {bullets.map((b, idx) => (
                  <li key={idx}>✅ {b}</li>
                ))}
              </ul>
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
                    <div className="pd-bundleSub">Ahorrás un {pack2Discount}%</div>
                  </div>
                  <div className="pd-bundleRight">
                    {moneyARS(Math.round(unitPrice * 2 * (1 - pack2Discount / 100)))}
                    <div className="pd-bundleCompare">{moneyARS(unitPrice * 2)}</div>
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
    </main>
  );
}
