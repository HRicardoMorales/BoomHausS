// frontend/src/pages/Terms.jsx

import { Link } from 'react-router-dom';

function Terms() {
    const storeName = import.meta.env.VITE_STORE_NAME || 'Encontratodo';
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || '';
    const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '';

    const waLink = whatsapp
        ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Hola! 👋 Tengo una consulta sobre términos/compra en ${storeName}.`
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
                        Términos y condiciones
                    </h1>
                    <p className="muted" style={{ marginTop: '0.35rem', maxWidth: 900, lineHeight: 1.6 }}>
                        Estos términos regulan el uso del sitio y las compras realizadas en{' '}
                        <strong style={{ color: 'var(--text)' }}>{storeName}</strong>. Al comprar, aceptás estas condiciones.
                    </p>

                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">1) Compra y registro</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Podés comprar como invitado o crear cuenta. En ambos casos, sos responsable de brindar datos correctos
                                (nombre, email, teléfono y dirección de envío).
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">2) Precios y disponibilidad</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Los precios se muestran en el sitio y pueden actualizarse. La compra queda sujeta a disponibilidad
                                y a la validación del pago por transferencia.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">3) Pagos (transferencia)</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                El pago se realiza por transferencia bancaria o transferencia por Mercado Pago. Una vez creado el pedido,
                                deberás enviar/subir el comprobante para su verificación. La confirmación del pedido depende de la validación
                                del pago.
                            </p>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Importante: <strong style={{ color: 'var(--text)' }}>no solicitamos datos de tarjeta</strong>.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">4) Envíos</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                El envío se coordina según el método seleccionado (Correo Argentino / Andreani / OCA / Moto, según zona).
                                Los plazos pueden variar según la empresa y la disponibilidad logística.
                            </p>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Asegurate de ingresar una dirección completa y correcta. No nos responsabilizamos por demoras derivadas
                                de datos incorrectos o ausencia en el domicilio.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">5) Cambios y devoluciones</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Si el producto llega dañado, con fallas o incorrecto, podés iniciar un reclamo. Revisá la política completa en:
                            </p>
                            <div style={{ marginTop: '0.65rem' }}>
                                <Link className="btn btn-ghost" to="/returns">
                                    Cambios y devoluciones →
                                </Link>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">6) Uso del sitio</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Te comprometés a usar el sitio de forma lícita, sin intentar vulnerar la seguridad, automatizar abusivamente,
                                ni interferir con el funcionamiento del servicio.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">7) Limitación de responsabilidad</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Hacemos nuestro mejor esfuerzo para ofrecer información correcta y una experiencia segura. Aun así,
                                pueden existir fallas técnicas o demoras ajenas al control del sitio (proveedores externos, envíos, etc.).
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">Contacto</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Si tenés dudas sobre estos términos, escribinos:
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
                            </div>
                        </div>
                    </div>
                </section>

                <section className="card reveal" style={{ marginTop: '1rem', padding: '1.1rem' }}>
                    <span className="badge">Actualizaciones</span>
                    <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                        Estos términos pueden actualizarse. Si se realizan cambios relevantes, se reflejarán en el sitio.
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Terms;
