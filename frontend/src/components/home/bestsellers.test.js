import { describe, it, expect } from "vitest";
import { rankBySales } from "./bestsellers";

const products = [
  { _id: "a1", slug: "lampara", name: "Lámpara" },
  { _id: "b2", slug: "puff", name: "Puff" },
  { _id: "c3", name: "Consola" },
  { id: "kit", slug: "kit-belleza", name: "Kit" },
];

describe("rankBySales", () => {
  it("ordena por ventas cruzando _id, id o slug y sin repetir", () => {
    const r = rankBySales(products, ["puff", "c3", "a1", "lampara", "kit-belleza"]);
    expect(r.map((p) => p.name)).toEqual(["Puff", "Consola", "Lámpara", "Kit"]);
  });

  it("ignora ids que no están en el catálogo (inactivos)", () => {
    expect(rankBySales(products, ["zzz", "a1", "b2", "c3"]).map((p) => p._id)).toEqual(["a1", "b2", "c3"]);
  });

  it("con menos de 3 coincidencias devuelve null (fallback a ofertas)", () => {
    expect(rankBySales(products, ["a1", "b2"])).toBeNull();
    expect(rankBySales(products, [])).toBeNull();
    expect(rankBySales(products, undefined)).toBeNull();
  });

  it("respeta el máximo", () => {
    expect(rankBySales(products, ["a1", "b2", "c3", "kit"], { max: 3 })).toHaveLength(3);
  });
});
