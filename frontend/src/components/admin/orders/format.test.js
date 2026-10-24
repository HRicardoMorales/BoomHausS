import { describe, expect, it } from "vitest";
import {
  money, formatDate, relativeTime, isHotCart, cartStepLabel, cartItemCount, waPhone,
  orderWaLink, cartWaLink, orderClipboardText, cartClipboardText,
  computeCartStats, filterCarts,
} from "./format.js";

const NOW = new Date("2026-10-21T12:00:00Z").getTime();
const minsAgo = (m) => new Date(NOW - m * 60000).toISOString();
const nbsp = (s) => s.replace(/\u00a0/g, " ");

describe("formatos", () => {
  it("money y formatDate toleran basura", () => {
    expect(nbsp(money(12500))).toBe("$ 12.500");
    expect(nbsp(money("x"))).toBe("$ 0");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("no-es-fecha")).toBe("—");
  });

  it("relativeTime en minutos, horas y días; vacío si no hay fecha o es futura", () => {
    expect(relativeTime(minsAgo(5), NOW)).toBe("hace 5m");
    expect(relativeTime(minsAgo(180), NOW)).toBe("hace 3h");
    expect(relativeTime(minsAgo(60 * 24 * 2), NOW)).toBe("hace 2d");
    expect(relativeTime(undefined, NOW)).toBe("");
    expect(relativeTime(minsAgo(-10), NOW)).toBe("");
  });

  it("un carrito es hot con menos de 1 h desde el último cambio, y sin fecha no lo es", () => {
    expect(isHotCart({ updatedAt: minsAgo(59), createdAt: minsAgo(500) }, NOW)).toBe(true);
    expect(isHotCart({ createdAt: minsAgo(61) }, NOW)).toBe(false);
    expect(isHotCart({}, NOW)).toBe(false);
  });

  it("paso y cantidad de ítems", () => {
    expect(cartStepLabel("checkout_page")).toBe("Checkout");
    expect(cartStepLabel("raro")).toBe("raro");
    expect(cartStepLabel()).toBe("—");
    expect(cartItemCount({ items: [{ quantity: 2 }, { quantity: "3" }, {}] })).toBe(5);
    expect(cartItemCount({ totalItems: 7, items: [] })).toBe(7);
  });
});

describe("WhatsApp", () => {
  it("normaliza teléfonos argentinos al formato de wa.me", () => {
    expect(waPhone("+54 9 11 5555-1234")).toBe("5491155551234");
    expect(waPhone("11 5555-1234")).toBe("5491155551234");
    expect(waPhone("011 5555-1234")).toBe("5491155551234");
    expect(waPhone("—")).toBeNull();
  });

  it("arma el link del pedido con el mensaje codificado y null sin teléfono", () => {
    const url = orderWaLink({ customerPhone: "1155551234", customerName: "Ana", items: [{ quantity: 2, name: "Lámpara" }], totalAmount: 1000, createdAt: minsAgo(1) });
    expect(url.startsWith("https://wa.me/5491155551234?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("2x Lámpara");
    expect(orderWaLink({ customerName: "Sin tel" })).toBeNull();
  });

  it("el mensaje del carrito usa solo el primer nombre y cae a 'tu pedido' sin ítems", () => {
    const msg = decodeURIComponent(cartWaLink({ phone: "1155551234", name: "  María José Pérez" }).split("text=")[1]);
    expect(msg.startsWith("Hola María! 👋")).toBe(true);
    expect(msg).toContain("compra de tu pedido y quedó pendiente");
    expect(cartWaLink({ name: "Sin tel" })).toBeNull();
  });
});

describe("textos para copiar", () => {
  it("pedido: omite líneas vacías y traduce métodos", () => {
    const text = orderClipboardText({ _id: "abc", customerName: "Ana", shippingMethod: "caba_cod", paymentMethod: "cod", items: [{ quantity: 2, name: "X", price: 500 }], totalAmount: 1000 });
    expect(text).toContain("Envío: CABA · pago al recibir");
    expect(text).toContain("Método pago: Contra entrega");
    expect(nbsp(text)).toContain("2x X — $ 1.000");
    expect(text).not.toContain("DNI");
    expect(text).not.toContain("Notas");
  });

  it("carrito: precio faltante cuenta como 0, no NaN", () => {
    const text = cartClipboardText({ name: "Leo", city: "CABA", postalCode: "1414", items: [{ quantity: 1, name: "Y" }], totalAmount: 0 });
    expect(text).toContain("CABA, 1414");
    expect(text).not.toContain("NaN");
  });
});

describe("estadísticas y filtros de carritos", () => {
  it("computeCartStats solo cuenta como pendientes los no recuperados", () => {
    const carts = [
      { phone: "1", totalAmount: 100, updatedAt: minsAgo(5) },
      { totalAmount: 200, updatedAt: minsAgo(300) },
      { phone: "2", totalAmount: 999, recovered: true, updatedAt: minsAgo(1) },
    ];
    expect(computeCartStats(carts, NOW)).toEqual({ pendingCount: 2, totalValue: 300, hot: 1, withPhone: 1, recovered: 1 });
  });

  it("filterCarts busca en contacto, landing y productos", () => {
    const carts = [{ name: "Ana", landingSource: "escultor-led" }, { name: "Beto", items: [{ name: "Depiladora" }] }];
    expect(filterCarts(carts, "ESCULTOR").map((c) => c.name)).toEqual(["Ana"]);
    expect(filterCarts(carts, "depil").map((c) => c.name)).toEqual(["Beto"]);
    expect(filterCarts(carts, "  ")).toBe(carts);
  });
});
