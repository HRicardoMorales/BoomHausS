// frontend/src/pages/Cart.jsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

function money(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
}

function Cart() {
    const { items, totalPrice, updateQty, removeItem, clearCart, calcItemTotal } = useCart();

    const isEmpty = !Array.isArray(items) || items.length === 0;

    const totalItems = useMemo(() => {
        return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }, [items]);

    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: '1.2rem' }}>
                    <span className="badge">Carrito</span>
                    <h1 style={{ margin: '0.65rem 0 0.25rem', letterSpacing: '-0.05em' }}>
                        Tu carrito
                    </h1>
                    <p className="muted" style={{ marginTop: '0.35rem', lineHeight: 1.7 }}>
                        Revisá tu compra y avanzá al checkout.
                    </p>

                    <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <Link className="btn btn-ghost" to="/products">← Seguir viendo</Link>
                        <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
                    </div>
                </section>

                {isEmpty ? (
                    <section className="card reveal" style={{ marginTop: '1rem', padding: '1.2rem' }}>
                        <span className="badge">Vacío</span>
                        <p className="muted" style={{ marginTop: '0.65rem' }}>
                            No tenés productos en el carrito.
                        </p>
                        <div style={{ marginTop: '1rem' }}>
                            <Link className="btn btn-primary" to="/products">Ir a la tienda →</Link>
                        </div>
                    </section>
                ) : (
                    <section
                        className="reveal"
                        style={{
                            marginTop: '1rem',
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 0.8fr',
                            gap: '1rem',
                            alignItems: 'start'
                        }}
                    >
                        {/* LISTA */}
                        <div className="card" style={{ padding: '1.2rem' }}>
                            <span className="badge">Productos</span>

                            <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
                                {items.map((it) => {
                                    const qty = Number(it.quantity) || 1;
                                    const price = Number(it.price) || 0;

                                    // ✅ total de línea con promo incluida
                                    const lineTotal = typeof calcItemTotal === 'function' ? calcItemTotal(it) : qty * price;

                                    // ✅ detectar promo “Lleva 2”
                                    const hasBundle2 = it?.promo?.type === 'bundle2';
                                    const discountPct = Number(it?.promo?.discountPct) || 0;

                                    return (
                                        <article
                                            key={it.productId}
                                            className="card"
                                            style={{
                                                padding: '1rem',
                                                display: 'grid',
                                                gridTemplateColumns: '96px 1fr',
                                                gap: '0.9rem',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 96,
                                                    height: 72,
                                                    borderRadius: 14,
                                                    overflow: 'hidden',
                                                    border: '1px solid var(--border)',
                                                    background: 'rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                {it.imageUrl ? (
                                                    <img
                                                        src={it.imageUrl}
                                                        alt={it.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="muted" style={{ padding: '0.9rem' }}>Sin imagen</div>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <div style={{ fontWeight: 950, letterSpacing: '-0.02em' }}>
                                                        {it.name}
                                                    </div>
                                                    <div style={{ fontWeight: 950 }}>
                                                        {money(lineTotal)}
                                                    </div>
                                                </div>

                                                <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span>{money(price)} c/u</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => removeItem(it.productId)}
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                {/* ✅ cartel promo */}
                                                {hasBundle2 ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span className="badge">Promo x2</span>
                                                        <span className="muted">-{discountPct}% por cada 2 unidades</span>
                                                    </div>
                                                ) : null}

                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span className="muted">Cantidad</span>

                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => updateQty(it.productId, Math.max(1, qty - 1))}
                                                        aria-label="Restar"
                                                    >
                                                        −
                                                    </button>

                                                    <input
                                                        value={qty}
                                                        onChange={(e) => {
                                                            const v = Number(e.target.value);
                                                            if (!Number.isFinite(v)) return;
                                                            updateQty(it.productId, v);
                                                        }}
                                                        inputMode="numeric"
                                                        style={{ width: 70, textAlign: 'center' }}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => updateQty(it.productId, qty + 1)}
                                                        aria-label="Sumar"
                                                    >
                                                        +
                                                    </button>

                                                    <span className="badge">Transferencia</span>
                                                    <span className="badge">Comprobante</span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-ghost" type="button" onClick={clearCart}>
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>

                        {/* RESUMEN STICKY */}
                        <aside
                            className="card"
                            style={{
                                padding: '1.2rem',
                                position: 'sticky',
                                top: 90,
                                borderRadius: 18,
                                border: '1px solid var(--border)',
                                background: 'rgba(255,255,255,0.03)'
                            }}
                        >
                            <span className="badge">Resumen</span>

                            <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.45rem' }}>
                                <div className="muted">
                                    Productos: <strong>{totalItems}</strong>
                                </div>
                                <div className="muted">
                                    Subtotal: <strong>{money(totalPrice)}</strong>
                                </div>
                                <div className="muted">
                                    Envío: <strong>A coordinar</strong>
                                </div>
                            </div>

                            <div style={{ marginTop: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div className="muted" style={{ fontWeight: 900 }}>Total</div>
                                <div style={{ fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.04em' }}>
                                    {money(totalPrice)}
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem' }}>
                                <Link className="btn btn-primary" to="/checkout">
                                    Ir a checkout →
                                </Link>
                                <Link className="btn btn-ghost" to="/products">
                                    Seguir viendo →
                                </Link>
                            </div>

                            <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="badge">Sin tarjeta</span>
                                <span className="badge">Transferencia</span>
                                <span className="badge">Subís comprobante</span>
                            </div>
                        </aside>

                        <style>{`
              @media (max-width: 980px){
                section.reveal[style*="grid-template-columns: 1.2fr 0.8fr"]{
                  grid-template-columns: 1fr !important;
                }
                aside.card[style*="position: sticky"]{
                  position: relative !important;
                  top: auto !important;
                }
              }
            `}</style>
                    </section>
                )}
            </div>
        </main>
    );
}

export default Cart;
