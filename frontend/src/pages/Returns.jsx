// frontend/src/pages/Returns.jsx

import { Link } from 'react-router-dom';
import { STORE_NAME } from "../config/brand.js";

function Returns() {
    const storeName = STORE_NAME;
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || '';
    const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '';

    const waLink = whatsapp
        ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Hola! 👋 Necesito ayuda con un cambio/devolución en ${storeName}.`
        )}`
        : null;

    return (
        <main className="section">
            <div className="container">
                <div className="reveal" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link className="btn btn-ghost" to="/">← Home</Link>
                    <Link className="btn btn-ghost" to="/products">Productos</Link>
                    <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
                </div>

                <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
                    <span className="badge">Legal</span>
                    <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.04em' }}>
                        Cambios y devoluciones
                    </h1>
                    <p className="muted" style={{ marginTop: '0.35rem', maxWidth: 900, lineHeight: 1.6 }}>
                        Queremos que compres con tranquilidad. Si algo no llega como esperabas, lo resolvemos.
                        Esta política aplica a compras en <strong style={{ color: 'var(--text)' }}>{storeName}</strong>.
                    </p>

                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">1) ¿Cuándo aplica?</span>
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    Producto con <strong style={{ color: 'var(--text)' }}>fallas</strong> o que llegó{' '}
                                    <strong style={{ color: 'var(--text)' }}>dañado</strong>.
                                </li>
                                <li className="muted">
                                    Producto <strong style={{ color: 'var(--text)' }}>incorrecto</strong> (no coincide con lo pedido).
                                </li>
                                <li className="muted">
                                    Problemas de entrega (evaluamos caso a caso según el método de envío).
                                </li>
                            </ul>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">2) Plazos</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Recomendación: contactanos dentro de las{' '}
                                <strong style={{ color: 'var(--text)' }}>48 horas</strong> desde que recibís el producto.
                                Si el problema es visible (daño/falla), cuanto antes nos escribas, mejor.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">3) ¿Qué necesitamos?</span>
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    Número de pedido (lo ves en <strong style={{ color: 'var(--text)' }}>Mis pedidos</strong>).
                                </li>
                                <li className="muted">
                                    Fotos o video del problema (daño, falla o producto incorrecto).
                                </li>
                                <li className="muted">Dirección de entrega y datos de contacto.</li>
                            </ul>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">4) Resolución</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Según el caso, podemos ofrecer:
                            </p>
                            <ul style={{ marginTop: '0.65rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    <strong style={{ color: 'var(--text)' }}>Cambio</strong> por otro producto equivalente.
                                </li>
                                <li className="muted">
                                    <strong style={{ color: 'var(--text)' }}>Reintegro</strong> (por transferencia), si corresponde.
                                </li>
                                <li className="muted">
                                    <strong style={{ color: 'var(--text)' }}>Solución alternativa</strong> acordada con vos (caso a caso).
                                </li>
                            </ul>
                            <p className="muted" style={{ marginTop: '0.75rem', lineHeight: 1.6 }}>
                                Importante: como el pago es por transferencia, los reintegros se realizan también por transferencia.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">Contacto</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Si necesitás iniciar un cambio o devolución, escribinos y te guiamos.
                            </p>

                            <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
                                    <div className="muted">(Opcional) Configurá VITE_SUPPORT_EMAIL</div>
                                )}

                                <Link className="btn btn-ghost" to="/my-orders">
                                    Ver mis pedidos →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card reveal" style={{ marginTop: '1rem', padding: '1.1rem' }}>
                    <span className="badge">Nota</span>
                    <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                        Esta política es un marco general. Si hay un caso especial, lo charlamos y lo resolvemos de la mejor manera.
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Returns;
