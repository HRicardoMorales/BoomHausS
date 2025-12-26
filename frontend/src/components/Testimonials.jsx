// frontend/src/components/Testimonials.jsx

import { useEffect } from 'react';

const DEFAULT_TESTIMONIALS = [
    {
        name: 'Sofía G.',
        city: 'CABA',
        title: 'Se nota la calidad',
        text:
            'Me llegó rápido y la presentación es excelente. El producto cumple tal cual lo que promete. Recompraría sin dudar.'
    },
    {
        name: 'Nicolás R.',
        city: 'Zona Norte',
        title: 'Muy buena atención',
        text:
            'Tuve una duda antes de comprar y me respondieron al toque por WhatsApp. La experiencia fue súper simple.'
    },
    {
        name: 'Camila P.',
        city: 'La Plata',
        title: 'Compra sin vueltas',
        text:
            'Hice la transferencia, subí el comprobante y listo. A las pocas horas ya tenía la confirmación del pedido.'
    }
];

function Stars({ count = 5 }) {
    return (
        <div style={{ display: 'flex', gap: '0.2rem' }} aria-label={`${count} estrellas`}>
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} style={{ fontSize: '1rem', lineHeight: 1 }}>
                    ★
                </span>
            ))}
        </div>
    );
}

function Testimonials({ items = DEFAULT_TESTIMONIALS, id = 'reviews' }) {
    // Reveal animation
    useEffect(() => {
        const els = Array.from(document.querySelectorAll('.reveal'));
        if (!('IntersectionObserver' in window)) {
            els.forEach((el) => el.classList.add('is-visible'));
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
            { threshold: 0.12 }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    return (
        <section id={id} className="section">
            <div className="container">
                <div className="reveal">
                    <span className="badge">Opiniones</span>
                    <h2 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.03em' }}>
                        Lo que dicen nuestros clientes
                    </h2>
                    <p className="muted" style={{ marginTop: '0.35rem', maxWidth: 720 }}>
                        Testimonios reales. Compras claras, transferencia simple y comprobante desde “Mis pedidos”.
                    </p>
                </div>

                <div
                    className="reveal"
                    style={{
                        marginTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.9rem'
                    }}
                >
                    {items.map((t, idx) => (
                        <article
                            key={idx}
                            className="card"
                            style={{
                                padding: '1.1rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background:
                                        'radial-gradient(600px circle at 20% -10%, rgba(255,255,255,0.10), transparent 40%)',
                                    pointerEvents: 'none'
                                }}
                            />
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontWeight: 900 }}>{t.title}</div>
                                        <div className="muted" style={{ marginTop: '0.15rem' }}>
                                            {t.name} · {t.city}
                                        </div>
                                    </div>
                                    <div className="muted">
                                        <Stars />
                                    </div>
                                </div>

                                <p className="muted" style={{ marginTop: '0.85rem', lineHeight: 1.6 }}>
                                    “{t.text}”
                                </p>

                                <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="badge">Verificado</span>
                                    <span className="badge">Entrega OK</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="reveal" style={{ marginTop: '1rem' }}>
                    <div className="card" style={{ padding: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>¿Querés comprar con confianza?</div>
                                <div className="muted" style={{ marginTop: '0.25rem' }}>
                                    Transferencia + comprobante + confirmación. Todo claro y sin vueltas.
                                </div>
                            </div>
                            <a className="btn btn-primary" href="#product">
                                Ver el producto →
                            </a>
                        </div>
                    </div>
                </div>

                <style>{`
          @media (max-width: 980px){
            .container > div[style*="grid-template-columns: repeat(3, 1fr)"]{
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
            </div>
        </section>
    );
}

export default Testimonials;
