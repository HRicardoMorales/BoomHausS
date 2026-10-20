import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "./CartContext";
import { useCart } from "../hooks/useCart";

// El pixel de Meta no se prueba acá: solo verificamos que se le avise.
vi.mock("../lib/metaPixel", () => ({ trackWithCapi: vi.fn() }));
const { trackWithCapi } = await import("../lib/metaPixel");

const CART_KEY = "cartItems";
const crema = { _id: "p1", name: "Crema", price: 1000, imageUrl: "/crema.jpg" };
const serum = { _id: "p2", name: "Sérum", price: 2500, images: ["/serum.jpg"] };

const renderCart = () => renderHook(() => useCart(), { wrapper: CartProvider });
const stored = () => JSON.parse(localStorage.getItem(CART_KEY));

describe("CartProvider", () => {
  beforeEach(() => localStorage.clear());

  it("useCart fuera del provider falla con un mensaje claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  });

  it("arranca vacío y tolera storage corrupto o con otra forma", () => {
    localStorage.setItem(CART_KEY, "{no es json");
    expect(renderCart().result.current.items).toEqual([]);

    localStorage.setItem(CART_KEY, JSON.stringify({ items: [] }));
    expect(renderCart().result.current.items).toEqual([]);
  });

  it("rehidrata desde localStorage", () => {
    localStorage.setItem(CART_KEY, JSON.stringify([{ productId: "p1", price: 1000, quantity: 2 }]));
    const { result } = renderCart();
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalPrice).toBe(2000);
  });

  it("addItem agrega, persiste, avisa al pixel y dispara cart:added", () => {
    const onAdded = vi.fn();
    window.addEventListener("cart:added", onAdded);
    const { result } = renderCart();

    act(() => result.current.addItem(serum));

    expect(result.current.items).toEqual([
      expect.objectContaining({ productId: "p2", quantity: 1, price: 2500, imageUrl: "/serum.jpg", promo: null }),
    ]);
    expect(result.current.totalPrice).toBe(2500);
    expect(stored()).toHaveLength(1);
    expect(trackWithCapi).toHaveBeenCalledWith("AddToCart", expect.objectContaining({ value: 2500, content_ids: ["p2"], num_items: 1 }));
    expect(onAdded.mock.calls[0][0].detail).toEqual({ name: "Sérum", qty: 1 });
    window.removeEventListener("cart:added", onAdded);
  });

  it("el mismo producto suma cantidad y activa la promo Lleva 2", () => {
    const { result } = renderCart();
    act(() => result.current.addItem(crema));
    act(() => result.current.addItem(crema));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ quantity: 2, promo: { type: "bundle2", discountPct: 18 } });
    expect(result.current.totalPrice).toBe(1640);
  });

  it("cantidad inválida cuenta como 1", () => {
    const { result } = renderCart();
    act(() => result.current.addItem(crema, "abc"));
    act(() => result.current.addItem(serum, -3));
    expect(result.current.items.map((i) => i.quantity)).toEqual([1, 1]);
  });

  it("un pack cerrado (bundleTotal) no lleva promo porcentual", () => {
    const { result } = renderCart();
    act(() => result.current.addItem(crema, 3, { bundleTotal: 2400, compareAtPrice: 3000 }));

    expect(result.current.items[0]).toMatchObject({ quantity: 3, bundleTotal: 2400, compareAtPrice: 3000, promo: null });
    expect(result.current.totalPrice).toBe(2400);
    expect(trackWithCapi).toHaveBeenCalledWith("AddToCart", expect.objectContaining({ value: 2400 }));
  });

  it("updateQty recalcula la promo y en 0 quita la línea", () => {
    const { result } = renderCart();
    act(() => result.current.addItem(crema, 3));
    expect(result.current.totalPrice).toBe(2640);

    act(() => result.current.updateQty("p1", 1));
    expect(result.current.items[0].promo).toBeNull();
    expect(result.current.totalPrice).toBe(1000);

    act(() => result.current.updateQty("p1", "no-num"));
    expect(result.current.items[0].quantity).toBe(1);

    act(() => result.current.updateQty("p1", 0));
    expect(result.current.items).toEqual([]);
  });

  it("updateQty conserva el bundleTotal del pack", () => {
    const { result } = renderCart();
    act(() => result.current.addItem(crema, 2, { bundleTotal: 1500 }));
    act(() => result.current.updateQty("p1", 4));
    expect(result.current.items[0]).toMatchObject({ quantity: 4, bundleTotal: 1500, promo: null });
  });

  it("removeItem, clearPromo y clearCart", () => {
    const { result } = renderCart();
    act(() => {
      result.current.addItem(crema, 2);
      result.current.addItem(serum);
    });

    act(() => result.current.clearPromo("p1"));
    expect(result.current.totalPrice).toBe(2000 + 2500);

    act(() => result.current.removeItem("p2"));
    expect(result.current.items.map((i) => i.productId)).toEqual(["p1"]);

    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
    expect(stored()).toEqual([]);
  });
});
