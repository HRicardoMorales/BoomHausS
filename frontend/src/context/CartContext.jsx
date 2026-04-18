import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const CART_KEY = "cartItems";

// 🔧 Config promo (mantenelo igual que en ProductDetail)
const BUNDLE2_DISCOUNT_PCT = 18;

function safeParse(json, fallback) {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}

function readCartFromStorage() {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? safeParse(raw, []) : [];
    return Array.isArray(parsed) ? parsed : [];
}

function writeCartToStorage(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// ✅ total por item con promos
function calcItemTotal(it) {
    // Bundle con precio fijo (el más común en landings con bundle picker)
    if (it?.bundleTotal) return Math.round(Number(it.bundleTotal));

    const qty = Math.max(0, Number(it?.quantity) || 0);
    const base = Math.max(0, Number(it?.price) || 0);
    if (!qty || !base) return 0;

    // Promo "Lleva 2" (-X% por pares)
    if (it?.promo?.type === "bundle2") {
        const discountPct = Math.max(0, Number(it?.promo?.discountPct) || 0);
        const pairsQty = Math.floor(qty / 2) * 2;
        const remQty = qty - pairsQty;
        return Math.round(pairsQty * base * (1 - discountPct / 100) + remQty * base);
    }

    return Math.round(qty * base);
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => readCartFromStorage());

    useEffect(() => {
        writeCartToStorage(items);
    }, [items]);

    const totalPrice = useMemo(() => {
        return items.reduce((acc, it) => acc + calcItemTotal(it), 0);
    }, [items]);

    // ✅ Agregar / sumar
    function addItem(product, qty = 1, options = {}) {
        const q = Math.max(1, Number(qty) || 1);
        const promo = options?.promo || null;
        const compareAtPrice = options?.compareAtPrice ? Number(options.compareAtPrice) || null : null;
        const bundleTotal = options?.bundleTotal ? Number(options.bundleTotal) || null : null;

        // 🔥 NUEVO: Disparamos evento para que App.jsx muestre el Popup
        window.dispatchEvent(new CustomEvent('cart:added', {
            detail: { name: product.name, qty: q }
        }));

        setItems((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((x) => x.productId === product._id);

            if (idx >= 0) {
                const prevItem = copy[idx];
                const nextQty = (Number(prevItem.quantity) || 0) + q;

                // Si hay bundleTotal fijo, no aplica promo porcentual
                const nextPromo = bundleTotal
                    ? null
                    : promo
                        ? promo
                        : nextQty >= 2
                            ? { type: "bundle2", discountPct: BUNDLE2_DISCOUNT_PCT }
                            : null;

                copy[idx] = {
                    ...prevItem,
                    price: Number(product.price) || prevItem.price,
                    name: product.name || prevItem.name,
                    imageUrl: product.imageUrl || product.images?.[0] || prevItem.imageUrl,
                    quantity: nextQty,
                    promo: nextPromo,
                    ...(compareAtPrice != null ? { compareAtPrice } : {}),
                    ...(bundleTotal != null ? { bundleTotal } : {}),
                };
                return copy;
            }

            // ✅ Nuevo item
            const initialPromo = bundleTotal
                ? null
                : promo
                    ? promo
                    : q >= 2
                        ? { type: "bundle2", discountPct: BUNDLE2_DISCOUNT_PCT }
                        : null;

            return [
                ...copy,
                {
                    productId: product._id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    compareAtPrice,
                    bundleTotal,
                    quantity: q,
                    imageUrl: product.imageUrl || product.images?.[0] || "",
                    promo: initialPromo,
                },
            ];
        });
    }

    function removeItem(productId) {
        setItems((prev) => prev.filter((x) => x.productId !== productId));
    }

    function updateQty(productId, qty) {
        const q = Number(qty);
        if (!Number.isFinite(q)) return;

        setItems((prev) =>
            prev
                .map((x) => {
                    if (x.productId !== productId) return x;
                    const nextQty = Math.max(0, Math.round(q));
                    // Para items con bundleTotal fijo, no aplicamos promo porcentual
                    // y mantenemos el bundleTotal (el cliente eligió un pack cerrado)
                    if (x.bundleTotal) {
                        return { ...x, quantity: nextQty, promo: null };
                    }
                    const nextPromo =
                        nextQty >= 2
                            ? { type: "bundle2", discountPct: BUNDLE2_DISCOUNT_PCT }
                            : null;
                    return { ...x, quantity: nextQty, promo: nextPromo };
                })
                .filter((x) => (Number(x.quantity) || 0) > 0)
        );
    }

    function clearPromo(productId) {
        setItems((prev) =>
            prev.map((x) => (x.productId === productId ? { ...x, promo: null } : x))
        );
    }

    function clearCart() {
        setItems([]);
    }

    const value = useMemo(
        () => ({
            items,
            totalPrice,
            addItem,
            removeItem,
            updateQty,
            clearCart,
            clearPromo,
            calcItemTotal,
        }),
        [items, totalPrice]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart() debe usarse dentro de <CartProvider>");
    return ctx;
}