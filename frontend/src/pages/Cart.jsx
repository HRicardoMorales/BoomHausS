// frontend/src/pages/Cart.jsx
import { useMemo, useEffect } from 'react';
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

    // ✅ 1. Scroll al inicio siempre que se carga la página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const totalItems = useMemo(() => {
        return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }, [items]);

    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">

                {/* Estilos responsivos inyectados */}
                <style>{`
                    .cart-grid {
                        margin-top: 1rem;
                        display: grid;
                        grid-template-columns: 1fr; /* Celular: 1 columna */
                        gap: 1.5rem;
                        align-items: start;
                    }
                    /* PC: 2 columnas */
                    @media (min-width: 900px) {
                        .cart-grid {
                            grid-template-columns: 1.2fr 0.8fr;
                        }
                    }
                    /* Ajuste para inputs en celular */
                    .qty-input {
                        width: 50px;
                        text-align: center;
                        padding: 5px;
                    }
                `}</style>

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
                    // ✅ 2. Usamos la clase .cart-grid definida arriba para responsive
                    <section className="reveal cart-grid">

                        {/* COLUMNA IZQUIERDA: PRODUCTOS */}
                        <div className="card" style={{ padding: '1.2rem' }}>
                            <span className="badge">Productos</span>

                            <div style={{ marginTop: '0.9rem', display: 'grid', gap: '1rem' }}>
                                {items.map((it) => {
                                    const qty = Number(it.quantity) || 1;
                                    const price = Number(it.price) || 0;
                                    const lineTotal = typeof calcItemTotal === 'function' ? calcItemTotal(it) : qty * price;

                                    const hasBundle2 = it?.promo?.type === 'bundle2';
                                    const discountPct = Number(it?.promo?.discountPct) || 0;

                                    return (
                                        <article
                                            key={it.productId}
                                            className="card"
                                            style={{
                                                padding: '1rem',
                                                display: 'grid',
                                                gridTemplateColumns: '80px 1fr', // Imagen un poco más chica en mobile para dar espacio
                                                gap: '1rem',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {/* Imagen */}
                                            <div
                                                style={{
                                                    width: 80,
                                                    height: 80, // Cuadrada para mejor consistencia
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
                                                    <div className="muted" style={{ padding: '0.9rem', fontSize: '0.7rem' }}>Sin foto</div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <div style={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                        {it.name}
                                                    </div>
                                                    <div style={{ fontWeight: 900 }}>
                                                        {money(lineTotal)}
                                                    </div>
                                                </div>

                                                <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                                                    <span>{money(price)} c/u</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        style={{ padding: '2px 8px', fontSize: '0.8rem', height: 'auto' }}
                                                        onClick={() => removeItem(it.productId)}
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                {hasBundle2 && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span className="badge" style={{ fontSize: '0.7rem' }}>Promo x2</span>
                                                        <span className="muted" style={{ fontSize: '0.8rem' }}>-{discountPct}% llevando 2</span>
                                                    </div>
                                                )}

                                                {/* Controles de Cantidad */}
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '5px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        style={{ padding: '5px 12px', fontSize: '1.2rem', lineHeight: 1 }}
                                                        onClick={() => updateQty(it.productId, Math.max(1, qty - 1))}
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
                                                        className="qty-input input" // Clase añadida arriba
                                                    />

                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        style={{ padding: '5px 12px', fontSize: '1.2rem', lineHeight: 1 }}
                                                        onClick={() => updateQty(it.productId, qty + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <button className="btn btn-ghost" type="button" onClick={clearCart} style={{ width: '100%' }}>
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA/ABAJO: RESUMEN */}
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
                                <div className="muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Productos:</span> <strong>{totalItems}</strong>
                                </div>
                                <div className="muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal:</span> <strong>{money(totalPrice)}</strong>
                                </div>
                                <div className="muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Envío:</span> <strong>A coordinar</strong>
                                </div>
                            </div>

                            <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="muted" style={{ fontWeight: 900 }}>Total</div>
                                <div style={{ fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.04em' }}>
                                    {money(totalPrice)}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.2rem', display: 'grid', gap: '0.8rem' }}>
                                <Link className="btn btn-primary" to="/checkout" style={{ textAlign: 'center', padding: '12px' }}>
                                    Ir a checkout →
                                </Link>
                                <Link className="btn btn-ghost" to="/products" style={{ textAlign: 'center' }}>
                                    Seguir comprando
                                </Link>
                            </div>
                        </aside>
                    </section>
                )}
            </div>
        </main>
    );
}

export default Cart;