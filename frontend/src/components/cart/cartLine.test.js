import { describe, expect, it } from "vitest";
import { MAX_QTY, cartCount, cartSavings, describeLine, unitsLabel } from "./cartLine.js";

describe("describeLine", () => {
  it("línea común: total = precio × cantidad y stepper habilitado", () => {
    const d = describeLine({ price: 1000, quantity: 3 });
    expect(d).toMatchObject({ qty: 3, unitPrice: 1000, total: 3000, isPack: false, saving: 0, promoPct: 0 });
    expect(d.canDecrease).toBe(true);
    expect(d.canIncrease).toBe(true);
  });

  it("no deja bajar de 1 ni pasar el tope", () => {
    expect(describeLine({ price: 10, quantity: 1 }).canDecrease).toBe(false);
    expect(describeLine({ price: 10, quantity: MAX_QTY }).canIncrease).toBe(false);
  });

  it("pack de precio cerrado: sin stepper y con ahorro contra el precio de lista", () => {
    const d = describeLine({ price: 30000, quantity: 3, bundleTotal: 69900, compareAtPrice: 90000 });
    expect(d).toMatchObject({ isPack: true, total: 69900, saving: 20100, canDecrease: false, canIncrease: false });
  });

  it("detecta packs por bundleTotal, no por slug", () => {
    expect(describeLine({ productId: "64c0abc", price: 1, quantity: 2, bundleTotal: 5 }).isPack).toBe(true);
    expect(describeLine({ productId: "lampara-magnetica-negro-kit", price: 1, quantity: 1 }).isPack).toBe(false);
  });

  it("sin ahorro si el precio de lista no es mayor al del pack", () => {
    expect(describeLine({ bundleTotal: 100, compareAtPrice: 80, quantity: 2 }).saving).toBe(0);
    expect(describeLine({ bundleTotal: 100, quantity: 2 }).saving).toBe(0);
  });

  it("promo Lleva 2: el porcentaje se muestra solo con 2 o más", () => {
    const promo = { type: "bundle2", discountPct: 18 };
    expect(describeLine({ price: 1000, quantity: 2, promo }).promoPct).toBe(18);
    expect(describeLine({ price: 1000, quantity: 1, promo }).promoPct).toBe(0);
  });

  it("datos basura no rompen la vista", () => {
    const d = describeLine({ price: "abc", quantity: "x" });
    expect(d).toMatchObject({ qty: 1, unitPrice: 0, total: 0 });
    expect(describeLine(undefined).qty).toBe(1);
  });
});

describe("totales del carrito", () => {
  const items = [
    { price: 100, quantity: 2 },
    { price: 1, quantity: 3, bundleTotal: 700, compareAtPrice: 900 },
    { price: 1, quantity: "nope" },
  ];
  it("cuenta unidades e ignora cantidades inválidas", () => expect(cartCount(items)).toBe(5));
  it("suma el ahorro de los packs", () => expect(cartSavings(items)).toBe(200));
  it("pluraliza", () => {
    expect(unitsLabel(1)).toBe("1 producto");
    expect(unitsLabel(4)).toBe("4 productos");
  });
});
