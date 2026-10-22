// frontend/src/pages/Privacy.jsx

import { Link } from 'react-router-dom';
import { STORE_NAME } from "../config/brand.js";

function Privacy() {
    const storeName = STORE_NAME;
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || '';
    const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '';

    const waLink = whatsapp
        ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Hola! 👋 Tengo una consulta sobre privacidad/datos en ${storeName}.`
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
                        Política de privacidad
                    </h1>
                    <p className="muted" style={{ marginTop: '0.35rem', maxWidth: 900, lineHeight: 1.6 }}>
                        En <strong style={{ color: 'var(--text)' }}>{storeName}</strong> cuidamos tus datos.
                        Usamos la información solo para gestionar pedidos, soporte y mejoras del servicio.
                    </p>

                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">1) Qué datos recopilamos</span>
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    Datos de contacto: <strong style={{ color: 'var(--text)' }}>nombre, email, teléfono</strong>.
                                </li>
                                <li className="muted">
                                    Datos de envío: <strong style={{ color: 'var(--text)' }}>dirección</strong> y notas para la entrega.
                                </li>
                                <li className="muted">
                                    Datos del pedido: productos, cantidades, estado de pago y envío.
                                </li>
                                <li className="muted">
                                    Comprobante de pago (si lo subís): imagen/PDF asociado a tu pedido.
                                </li>
                            </ul>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">2) Para qué los usamos</span>
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    Procesar y confirmar pedidos.
                                </li>
                                <li className="muted">
                                    Coordinar envíos y comunicar estados (pago/envío).
                                </li>
                                <li className="muted">
                                    Soporte y atención al cliente.
                                </li>
                                <li className="muted">
                                    Mejorar la experiencia de compra (métricas básicas y errores).
                                </li>
                            </ul>
                            <p className="muted" style={{ marginTop: '0.75rem', lineHeight: 1.6 }}>
                                Importante: <strong style={{ color: 'var(--text)' }}>no almacenamos datos de tarjeta</strong>.
                                El pago se realiza por transferencia (banco/MP).
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">3) Con quién compartimos datos</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Solo compartimos lo necesario para cumplir el servicio:
                            </p>
                            <ul style={{ marginTop: '0.65rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                <li className="muted">
                                    Servicios de envío (Correo Argentino / Andreani / OCA / Moto) para entregar tu compra.
                                </li>
                                <li className="muted">
                                    Proveedores de email (si se envían notificaciones).
                                </li>
                            </ul>
                            <p className="muted" style={{ marginTop: '0.75rem', lineHeight: 1.6 }}>
                                No vendemos ni alquilamos tu información.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">4) Seguridad</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Aplicamos medidas razonables de seguridad para proteger tus datos. Aun así,
                                ninguna transmisión por internet es 100% infalible. Si detectás algo raro, avisános.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">5) Tus derechos</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Podés solicitar acceso, actualización o eliminación de tus datos, salvo lo necesario
                                para cumplir obligaciones legales/operativas (por ejemplo, registros de pedidos).
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.1rem' }}>
                            <span className="badge">Contacto</span>
                            <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                                Para consultas sobre privacidad, escribinos:
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
                    <span className="badge">Nota</span>
                    <p className="muted" style={{ marginTop: '0.55rem', lineHeight: 1.6 }}>
                        Esta política puede actualizarse para mejorar la claridad o adaptarse a cambios operativos.
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Privacy;
