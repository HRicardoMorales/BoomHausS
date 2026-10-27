// frontend/src/pages/Cart.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import StatePanel from '../components/ui/StatePanel.jsx';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import CartLine from '../components/cart/CartLine.jsx';
import CartSummary from '../components/cart/CartSummary.jsx';
import { cartCount, cartSavings, unitsLabel } from '../components/cart/cartLine.js';
import '../components/cart/Cart.css';

/**
 * Carrito. Solo orquesta: los totales salen de `useCart` (cartMath) y la
 * presentación de cada línea de `cartLine.js`. El scroll al inicio lo hace
 * `ScrollToTop` en el router (antes se repetía acá).
 */
function Cart() {
    const { items, totalPrice, updateQty, removeItem, clearCart } = useCart();
    const { confirm, confirmDialog } = useConfirm();
    const list = Array.isArray(items) ? items : [];
    const count = cartCount(list);

    async function handleClear() {
        const ok = await confirm({
            title: '¿Vaciar el carrito?',
            message: `Se quitan ${unitsLabel(count)}. Vas a tener que volver a agregarlos desde la tienda.`,
            confirmLabel: 'Vaciar',
            tone: 'danger',
        });
        if (ok) clearCart();
    }

    return (
        <main className="cart-page">
            <div className="container">
                <header className="cart-head">
                    <p className="cart-head__eyebrow">
                        {list.length ? unitsLabel(count) : 'Carrito'}
                    </p>
                    <h1 className="cart-head__title">Tu carrito</h1>
                    <Link className="cart-head__back" to="/products">← Seguir comprando</Link>
                </header>

                {list.length === 0 ? (
                    <StatePanel
                        size="inline"
                        icon="bag"
                        eyebrow="0 productos"
                        title="Tu carrito está esperando"
                        actions={<Link className="btn btn-primary" to="/products">Ir a la tienda</Link>}
                    >
                        <p>Todavía no agregaste nada. Lo que sumes queda guardado en este dispositivo aunque cierres la página.</p>
                    </StatePanel>
                ) : (
                    <div className="cart-grid">
                        <section className="cart-lines" aria-labelledby="cart-lines-title">
                            <h2 id="cart-lines-title" className="sr-only">Productos</h2>
                            <ul className="cart-lines__list">
                                {list.map((it) => (
                                    <CartLine
                                        key={it.productId}
                                        item={it}
                                        onQty={updateQty}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </ul>
                            <div className="cart-lines__foot">
                                <Link to="/my-orders" className="cart-lines__link">Ver mis pedidos</Link>
                                <button type="button" className="cart-lines__clear" onClick={handleClear}>
                                    Vaciar carrito
                                </button>
                            </div>
                        </section>

                        <CartSummary count={count} total={totalPrice} savings={cartSavings(list)} />
                    </div>
                )}
            </div>
            {confirmDialog}
        </main>
    );
}

export default Cart;
