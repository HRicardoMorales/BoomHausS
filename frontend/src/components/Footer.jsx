// frontend/src/components/Footer.jsx

import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function buildWhatsAppLink({ phone, text }) {
    const digits = String(phone || '').replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(text || '');
    return `https://wa.me/${digits}?text=${encoded}`;
}

function Footer() {
    const navigate = useNavigate();
    const location = useLocation();

    const storeName = import.meta.env.VITE_STORE_NAME || 'Encontratodo';
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || '';

    const sections = useMemo(
        () => [
            { id: 'benefits', label: 'Beneficios' },
            { id: 'gallery', label: 'Galería' },
            { id: 'product', label: 'Producto' },
            { id: 'reviews', label: 'Opiniones' },
            { id: 'faq', label: 'FAQ' }
        ],
        []
    );

    function goToSection(id) {
        if (location.pathname !== '/') {
            navigate(`/#${id}`);
            return;
        }
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const waLink = useMemo(() => {
        if (!whatsappNumber) return null;
        return buildWhatsAppLink({
            phone: whatsappNumber,
            text: `Hola! 👋 Quería hacer una consulta sobre ${storeName}.`
        });
    }, [whatsappNumber, storeName]);

    return (
        <footer
            style={{
                marginTop: '3rem',
                borderTop: '1px solid var(--border)',
                background: 'rgba(10,10,10,0.45)',
                backdropFilter: 'blur(10px)'
            }}
        >
            <div className="container" style={{ padding: '2.2rem 0' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr',
                        gap: '1rem',
                        alignItems: 'start'
                    }}
                >
                    {/* Brand + trust */}
                    <div className="card" style={{ padding: '1.1rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.03em' }}>
                            {storeName}
                        </div>

                        <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                            Store premium enfocada en una compra simple: transferencia + comprobante.
                            No pedimos datos de tarjeta.
                        </p>

                        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge">Transferencia</span>
                            <span className="badge">Comprobante</span>
                            <span className="badge">Envíos</span>
                        </div>

                        <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link className="btn btn-ghost" to="/products">Ver producto</Link>
                            <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="card" style={{ padding: '1.1rem' }}>
                        <div className="badge">Secciones</div>
                        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.35rem' }}>
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => goToSection(s.id)}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start' }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Support + Legal */}
                    <div className="card" style={{ padding: '1.1rem' }}>
                        <div className="badge">Soporte</div>

                        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                            {waLink ? (
                                <a className="btn btn-primary" href={waLink} target="_blank" rel="noreferrer">
                                    WhatsApp →
                                </a>
                            ) : (
                                <div className="muted" style={{ fontWeight: 900 }}>
                                    Configurá VITE_WHATSAPP_NUMBER para habilitar WhatsApp
                                </div>
                            )}

                            {supportEmail ? (
                                <a className="btn btn-ghost" href={`mailto:${supportEmail}`}>
                                    {supportEmail}
                                </a>
                            ) : (
                                <div className="muted">
                                    (Opcional) Configurá <strong>VITE_SUPPORT_EMAIL</strong>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                            <div className="badge">Legal</div>
                            <div style={{ marginTop: '0.65rem', display: 'grid', gap: '0.35rem' }}>
                                {/* placeholders: más adelante los creamos */}
                                <Link className="btn btn-ghost" to="/terms">Términos</Link>
                                <Link className="btn btn-ghost" to="/privacy">Privacidad</Link>
                                <Link className="btn btn-ghost" to="/returns">Cambios y devoluciones</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* bottom bar */}
                <div
                    style={{
                        marginTop: '1.2rem',
                        paddingTop: '1.2rem',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}
                >
                    <div className="muted" style={{ fontWeight: 900 }}>
                        © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
                    </div>

                    <div className="muted" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span>Pagos: Transferencia</span>
                        <span>•</span>
                        <span>Envíos: a coordinar</span>
                    </div>
                </div>

                <style>{`
          @media (max-width: 980px){
            footer .container > div[style*="grid-template-columns: 1.2fr 1fr 1fr"]{
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
            </div>
        </footer>
    );
}

export default Footer;
