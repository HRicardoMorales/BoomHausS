import { describe, expect, it } from "vitest";
import { discountPct, moneyARS } from "./pricing";

// Intl usa espacio duro entre "$" y el número: normalizamos para comparar.
const plain = (s) => s.replace(/\s/g, " ");

describe("discountPct", () => {
  it.each([
    [80, 100, 20],
    [6666, 9999, 33], // redondeo al entero más cercano
    [1, 3, 67],
    ["750", "1000", 25], // strings numéricos de la API
  ])("price %s / lista %s → %i%%", (price, compareAt, expected) => {
    expect(discountPct(price, compareAt)).toBe(expected);
  });

  it.each([
    ["sin precio de lista", 100, undefined],
    ["lista igual al precio", 100, 100],
    ["lista menor (dato invertido)", 120, 100],
    ["precio 0 (evita -100%/regalo)", 0, 100],
    ["precio negativo", -5, 100],
    ["basura", "abc", "xyz"],
    ["null", null, null],
  ])("%s → 0", (_label, price, compareAt) => {
    expect(discountPct(price, compareAt)).toBe(0);
  });
});

describe("moneyARS", () => {
  it("formatea en es-AR sin decimales", () => {
    expect(plain(moneyARS(12345))).toBe("$ 12.345");
    expect(plain(moneyARS(1234.6))).toBe("$ 1.235");
  });

  it("valores inválidos se muestran como $ 0", () => {
    for (const v of [undefined, null, NaN, "abc"]) expect(plain(moneyARS(v))).toBe("$ 0");
  });
});
