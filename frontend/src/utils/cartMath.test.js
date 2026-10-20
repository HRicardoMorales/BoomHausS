import { describe, expect, it } from "vitest";
import { BUNDLE2_DISCOUNT_PCT, calcItemTotal, cartTotal } from "./cartMath";

const bundle2 = { type: "bundle2", discountPct: BUNDLE2_DISCOUNT_PCT };

describe("calcItemTotal", () => {
  it("precio × cantidad sin promo", () => {
    expect(calcItemTotal({ price: 1000, quantity: 3 })).toBe(3000);
  });

  it("bundleTotal (pack cerrado) gana sobre precio, cantidad y promo", () => {
    expect(calcItemTotal({ price: 1000, quantity: 5, bundleTotal: 3999.6, promo: bundle2 })).toBe(4000);
  });

  it("bundle2: -18% solo sobre los pares", () => {
    // 2 u. → 2 × 1000 × 0,82
    expect(calcItemTotal({ price: 1000, quantity: 2, promo: bundle2 })).toBe(1640);
    // 3 u. → un par con descuento + 1 a precio lleno
    expect(calcItemTotal({ price: 1000, quantity: 3, promo: bundle2 })).toBe(2640);
    // 1 u. → no hay par
    expect(calcItemTotal({ price: 1000, quantity: 1, promo: bundle2 })).toBe(1000);
  });

  it("bundle2 redondea a pesos enteros", () => {
    expect(calcItemTotal({ price: 999, quantity: 2, promo: { type: "bundle2", discountPct: 33 } })).toBe(1339);
  });

  it("promo con descuento negativo o inválido no encarece", () => {
    expect(calcItemTotal({ price: 1000, quantity: 2, promo: { type: "bundle2", discountPct: -50 } })).toBe(2000);
    expect(calcItemTotal({ price: 1000, quantity: 2, promo: { type: "bundle2", discountPct: "x" } })).toBe(2000);
  });

  it("promo desconocida se ignora", () => {
    expect(calcItemTotal({ price: 1000, quantity: 2, promo: { type: "3x2" } })).toBe(2000);
  });

  it.each([
    ["sin ítem", undefined],
    ["cantidad 0", { price: 1000, quantity: 0 }],
    ["cantidad negativa", { price: 1000, quantity: -2 }],
    ["precio negativo", { price: -1000, quantity: 2 }],
    ["strings basura", { price: "abc", quantity: "x" }],
  ])("%s → 0", (_label, item) => {
    expect(calcItemTotal(item)).toBe(0);
  });

  it("acepta strings numéricos (localStorage/API)", () => {
    expect(calcItemTotal({ price: "1500", quantity: "2" })).toBe(3000);
  });
});

describe("cartTotal", () => {
  it("suma las líneas con sus reglas", () => {
    const items = [
      { price: 1000, quantity: 1 },
      { price: 1000, quantity: 2, promo: bundle2 },
      { price: 1, quantity: 1, bundleTotal: 5000 },
    ];
    expect(cartTotal(items)).toBe(1000 + 1640 + 5000);
  });

  it("carrito vacío o ausente → 0", () => {
    expect(cartTotal([])).toBe(0);
    expect(cartTotal()).toBe(0);
  });
});
