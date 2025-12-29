// frontend/src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

import GalleryCarousel from "../components/GalleryCarousel";
import Testimonials from "../components/Testimonials";

function Home() {
    const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";
    const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";
    const waLink = whatsapp
        ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}?text=${encodeURIComponent(
            `Hola! 👋 Quiero hacer una consulta sobre ${storeName}.`
        )}`
        : null;

    // ✅ Traemos el producto único para usar su imagen como fondo del HERO (si no hay imagen, queda con gradiente)
    const [product, setProduct] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/products/single");
                const p = res.data?.data;
                setProduct(p || null);
            } catch (e) {
                console.error("Home hero product load error:", e);
                setProduct(null);
            }
        })();
    }, []);

    const heroImages = useMemo(() => {
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

    // 👉 Si querés poner una imagen fija como miaqualys (persona usando el producto),
    // ponela en /public y seteá en .env:
    const heroBgUrl = import.meta.env.VITE_HERO_BG_URL || "";

    return (
        <main className="section">
            <div className="container">
                {/* =========================
            HERO (estilo Miaqualys)
           ========================= */}
                <section
                    className="homeHeroBanner reveal"
                    style={{ ["--hero-bg"]: heroBgUrl ? `url(${heroBgUrl})` : "none" }}
                >
                    {/* capa oscura suave para contraste */}
                    <div className="homeHeroShade" />

                    {/* Card blanca encima (como la referencia) */}
                    <div className="homeHeroCard">
                        <div className="homeHeroBadge">Oferta limitada</div>

                        <h1 className="homeHeroTitle">
                            {product?.heroTitle || "El producto ideal"}
                        </h1>

                        <p className="homeHeroText">
                            {product?.heroSubtitle ||
                                "Comprá en 1 minuto. Pagás por transferencia y subís el comprobante. Y Listo!! Te lo enviamos."}
                        </p>

                        <div className="homeHeroButtons">
                            <Link className="homeHeroBtnPrimary" to="/products">
                                IR A LA PÁGINA DEL PRODUCTO
                            </Link>

                            <Link className="homeHeroBtnGhost" to="/cart">
                                Ir al carrito
                            </Link>

                            {waLink ? (
                                <a className="homeHeroBtnGhost" href={waLink} target="_blank" rel="noreferrer">
                                    WhatsApp →
                                </a>
                            ) : null}
                        </div>

                        <div className="homeHeroChips">
                            <span className="homeHeroChip">Transferencia</span>
                            <span className="homeHeroChip">Comprobante</span>
                            <span className="homeHeroChip">Envíos</span>
                            <span className="homeHeroChip">Soporte</span>
                        </div>
                    </div>

                    {/* Mini “preview” a la derecha (queda pro como tu 1er screenshot) */}
                    <div className="homeHeroPreview">
                        <div className="homeHeroPreviewTop">
                            <div className="homeHeroPreviewTitle">Galería</div>
                            <div className="homeHeroPreviewSub">Deslizá o usá las flechas</div>
                        </div>

                        <div className="homeHeroPreviewMedia">
                            {heroImages?.[1] ? (
                                <img src={heroImages[0]} alt="Producto" loading="lazy" />
                            ) : (
                                <div className="homeHeroPreviewEmpty">Agregá imágenes del producto</div>
                            )}

                            <div className="homeHeroPreviewCount">
                                1/{Math.max(1, heroImages.length || 1)}
                            </div>
                        </div>

                        <div className="homeHeroDots" aria-hidden="true">
                            <span className="dot on" />
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="benefits" className="reveal" style={{ marginTop: "1.1rem" }}>
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <span className="badge">Cómo comprar</span>
                        <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                            3 pasos y listo
                        </h2>
                        <p className="muted" style={{ marginTop: "0.35rem", maxWidth: 900, lineHeight: 1.6 }}>
                            Un flujo simple pensado para que compres rápido y con confianza.
                        </p>

                        <div
                            style={{
                                marginTop: "1rem",
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "0.75rem",
                            }}
                        >
                            <div className="card" style={{ padding: "1.05rem" }}>
                                <span className="badge">Paso 1</span>
                                <div style={{ marginTop: "0.55rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                                    Elegís el producto
                                </div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Mirá fotos, detalles y agregalo al carrito.
                                </p>
                            </div>

                            <div className="card" style={{ padding: "1.05rem" }}>
                                <span className="badge">Paso 2</span>
                                <div style={{ marginTop: "0.55rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                                    Creás tu pedido
                                </div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Checkout rápido (con o sin cuenta) + método de envío.
                                </p>
                            </div>

                            <div className="card" style={{ padding: "1.05rem" }}>
                                <span className="badge">Paso 3</span>
                                <div style={{ marginTop: "0.55rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                                    Transferís y subís comprobante
                                </div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Desde “Mis pedidos” subís la imagen/PDF del pago.
                                </p>
                            </div>
                        </div>

                        <style>{`
              @media (max-width: 980px){
                section#benefits .card > div[style*="grid-template-columns: repeat(3, 1fr)"]{
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
                    </div>
                </section>

                {/* GALLERY */}
                <section id="gallery" className="reveal" style={{ marginTop: "1.1rem" }}>
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <span className="badge">Galería</span>
                        <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                            Miralo en detalle
                        </h2>
                        <p className="muted" style={{ marginTop: "0.35rem", maxWidth: 900, lineHeight: 1.6 }}>
                            Imágenes reales del producto y su presentación.
                        </p>

                        <div style={{ marginTop: "1rem" }}>
                            <GalleryCarousel />
                        </div>
                    </div>
                </section>

                {/* PRODUCT CTA */}
                <section id="product" className="reveal" style={{ marginTop: "1.1rem" }}>
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <span className="badge">Producto</span>
                        <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                            Lo querés hoy
                        </h2>
                        <p className="muted" style={{ marginTop: "0.35rem", maxWidth: 900, lineHeight: 1.6 }}>
                            Entrá a la tienda para ver precio, detalle y agregar al carrito.
                        </p>

                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                            <Link className="btn btn-primary" to="/products">
                                Ver producto →
                            </Link>
                            <Link className="btn btn-ghost" to="/cart">
                                Ir al carrito
                            </Link>
                        </div>
                    </div>
                </section>

                {/* REVIEWS */}
                <section id="reviews" className="reveal" style={{ marginTop: "1.1rem" }}>
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <span className="badge">Opiniones</span>
                        <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                            Lo que dicen los clientes
                        </h2>
                        <p className="muted" style={{ marginTop: "0.35rem", maxWidth: 900, lineHeight: 1.6 }}>
                            Testimonios reales.
                        </p>

                        <div style={{ marginTop: "1rem" }}>
                            <Testimonials />
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="reveal" style={{ marginTop: "1.1rem" }}>
                    <div className="card" style={{ padding: "1.2rem" }}>
                        <span className="badge">FAQ</span>
                        <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                            Preguntas frecuentes
                        </h2>

                        <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.75rem" }}>
                            <div className="card" style={{ padding: "1rem" }}>
                                <div style={{ fontWeight: 900 }}>¿Cómo pago?</div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Por transferencia bancaria o transferencia por Mercado Pago. Luego subís el comprobante desde “Mis pedidos”.
                                </p>
                            </div>

                            <div className="card" style={{ padding: "1rem" }}>
                                <div style={{ fontWeight: 900 }}>¿Necesito crear cuenta?</div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    No. Podés comprar como invitado. Si querés, creás la cuenta después.
                                </p>
                            </div>

                            <div className="card" style={{ padding: "1rem" }}>
                                <div style={{ fontWeight: 900 }}>¿Cómo es el envío?</div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Coordinamos el envío según método elegido (Correo Argentino / Andreani / OCA / Moto, según zona).
                                </p>
                            </div>

                            <div className="card" style={{ padding: "1rem" }}>
                                <div style={{ fontWeight: 900 }}>¿Qué pasa después de pagar?</div>
                                <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                    Subís el comprobante. Cuando se verifica, se confirma el pedido y se despacha.
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                            <Link className="btn btn-primary" to="/products">
                                Comprar →
                            </Link>
                            <Link className="btn btn-ghost" to="/privacy">
                                Privacidad
                            </Link>
                            <Link className="btn btn-ghost" to="/returns">
                                Devoluciones
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="card reveal" style={{ marginTop: "1.1rem", padding: "1.2rem" }}>
                    <span className="badge">Listo</span>
                    <h2 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.04em" }}>
                        ¿Lo querés ahora?
                    </h2>
                    <p className="muted" style={{ marginTop: "0.35rem", maxWidth: 900, lineHeight: 1.6 }}>
                        Te lleva 1 minuto crear el pedido. Después pagás por transferencia y subís el comprobante.
                    </p>

                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                        <Link className="btn btn-primary" to="/products">
                            Ir a comprar →
                        </Link>
                        <Link className="btn btn-ghost" to="/my-orders">
                            Mis pedidos
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Home;
