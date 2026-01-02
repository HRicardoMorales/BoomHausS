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

    const [product, setProduct] = useState(null);
    const [heroIndex, setHeroIndex] = useState(0);

    // Swipe
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

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

    const nextImage = () => {
        if (heroImages.length > 0) setHeroIndex((prev) => (prev + 1) % heroImages.length);
    };
    const prevImage = () => {
        if (heroImages.length > 0) setHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
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
    const onMouseDown = (e) => setTouchStart(e.clientX);
    const onMouseUp = (e) => {
        if (!touchStart) return;
        const distance = touchStart - e.clientX;
        if (distance > minSwipeDistance) nextImage();
        if (distance < -minSwipeDistance) prevImage();
        setTouchStart(null);
    };

    const heroBgUrl = import.meta.env.VITE_HERO_BG_URL || "";

    return (
        <main className="section">
            <div className="container">
                
                {/* 🔧 FIX: Botón blanco al hover + Grid simétrico */}
                <style>{`
                    .homeHeroBtnPrimary:hover {
                        color: #ffffff !important;
                        opacity: 0.95;
                    }
                    /* Forzamos simetría en PC */
                    @media (min-width: 981px) {
                        .homeHeroBanner {
                            grid-template-columns: 1fr 1fr !important; /* Mismo ancho */
                            align-items: stretch !important; /* Misma altura */
                        }
                    }
                    /* Arreglo pasos en mobile */
                    @media (max-width: 980px){
                        section#benefits .card > div[style*="grid-template-columns: repeat(3, 1fr)"]{
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>

                {/* =========================
                    HERO
                   ========================= */}
                <section
                    className="homeHeroBanner reveal"
                    style={{
                        ["--hero-bg"]: heroBgUrl ? `url(${heroBgUrl})` : "none"
                    }}
                >
                    <div className="homeHeroShade" />

                    {/* 🚨 CAMBIO IMPORTANTE:
                        Eliminé el <div className="homeHeroContent"> que causaba el error.
                        Ahora las cards son hijas directas del grid .homeHeroBanner
                    */}

                    {/* CAJA IZQUIERDA: TEXTO */}
                    <div className="homeHeroCard" style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div className="homeHeroBadge" style={{ width: "fit-content" }}>
                            Oferta limitada
                        </div>

                        <h1 className="homeHeroTitle">
                            {product?.heroTitle || "El producto ideal"}
                        </h1>

                        <p className="homeHeroText">
                            {product?.heroSubtitle ||
                                "Comprá en 1 minuto. Pagás por transferencia y subís el comprobante. Y Listo!! Te lo enviamos."}
                        </p>

                        <div className="homeHeroButtons">
                            <Link 
                                className="homeHeroBtnPrimary" 
                                to="/products"
                                style={{ color: '#ffffff', textDecoration: 'none' }} 
                            >
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

                    {/* CAJA DERECHA: MINI GALERÍA */}
                    <div className="homeHeroPreview" style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column" }}>
                        <div className="homeHeroPreviewTop">
                            <div className="homeHeroPreviewTitle">Galería</div>
                            <div className="homeHeroPreviewSub">Deslizá o usá las flechas</div>
                        </div>

                        {/* Contenedor cuadrado de imagen */}
                        <div
                            className="homeHeroPreviewMedia"
                            style={{ cursor: "grab", touchAction: "pan-y", flex: 1 }} // Flex 1 ayuda a llenar el alto
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onMouseDown={onMouseDown}
                            onMouseUp={onMouseUp}
                            onMouseLeave={() => setTouchStart(null)}
                        >
                            {heroImages.length > 0 ? (
                                <>
                                    <img
                                        src={heroImages[heroIndex]}
                                        alt="Producto"
                                        onDragStart={(e) => e.preventDefault()}
                                        style={{ pointerEvents: "auto", userSelect: "none" }}
                                    />

                                    {/* Flechas */}
                                    {heroImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                style={{
                                                    position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                                                    background: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%",
                                                    width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", zIndex: 10
                                                }}
                                            >
                                                ‹
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                style={{
                                                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                                                    background: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%",
                                                    width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", zIndex: 10
                                                }}
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="homeHeroPreviewEmpty">Agregá imágenes del producto</div>
                            )}

                            <div className="homeHeroPreviewCount">
                                {heroIndex + 1}/{Math.max(1, heroImages.length || 1)}
                            </div>
                        </div>

                        <div className="homeHeroDots">
                            {heroImages.slice(0, 5).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`dot ${idx === heroIndex ? "on" : ""}`}
                                    onClick={() => setHeroIndex(idx)}
                                    style={{ cursor: "pointer", padding: "5px" }}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECCIONES RESTANTES (Igual que antes) */}
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
                    </div>
                </section>

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