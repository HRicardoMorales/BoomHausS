import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM, filterProducts, findLandingForSlug, formFromProduct, isDirty, landingProducts,
  listPrice, missingLandingProducts, money, payloadFromForm, pct, sanitizeSlug, seedPayload, updateBundle,
} from "./productForm.js";

const configs = {
  "porta-cepillos": {
    productSlug: "porta-cepillos",
    checkoutName: "Porta cepillos",
    images: ["a.jpg"],
    bundles: [
      { qty: 1, price: 20000, compareAt: 30000, label: "1 unidad" },
      { qty: 2, price: 36000, compareAt: 60000, label: "2 unidades", popular: true, badge: "Ahorrás" },
    ],
  },
  "lampara-luna": {
    storyBlocks: [{ img: "s1.jpg" }, { img: "s2.jpg" }, {}],
    variants: [
      { name: "Blanca", productSlug: "lampara-blanca", bundles: [{ qty: 1, price: 15000 }] },
      { name: "Sin slug" },
    ],
  },
};
const meta = [{ slug: "lampara-luna", name: "Lámpara Luna" }];

describe("formato", () => {
  it("money y pct toleran basura", () => {
    expect(money("abc")).toBe(money(0));
    expect(money(59900)).toMatch(/59\.900/);
    expect(pct(70, 100)).toBe(30);
    expect(pct(100, 70)).toBe(0);
    expect(pct(0, 100)).toBe(0);
  });

  it("sanitizeSlug quita tildes en vez de partir la palabra", () => {
    expect(sanitizeSlug("  Lámpara Mágica 3 en 1! ")).toBe("lampara-magica-3-en-1");
    expect(sanitizeSlug("--ya--bien--")).toBe("ya-bien");
    expect(sanitizeSlug(null)).toBe("");
  });

  it("listPrice usa el pack más barato con precio y si no el precio base", () => {
    expect(listPrice({ price: 5, bundles: [{ price: 300 }, { price: 200 }, { price: 0 }] })).toEqual({ fromBundles: true, price: 200 });
    expect(listPrice({ price: 5, bundles: [{ price: 0 }] })).toEqual({ fromBundles: false, price: 5 });
    expect(listPrice({})).toEqual({ fromBundles: false, price: 0 });
  });

  it("filterProducts busca por nombre o slug, sin romper con campos faltantes", () => {
    const list = [{ name: "Lámpara", slug: "lampara" }, { slug: "porta-cepillos" }, { name: 42 }];
    expect(filterProducts(list, "  ")).toBe(list);
    expect(filterProducts(list, "PORTA")).toEqual([{ slug: "porta-cepillos" }]);
    expect(filterProducts(list, "42")).toEqual([{ name: 42 }]);
  });
});

describe("landings", () => {
  it("encuentra el config por slug de producto o de variante", () => {
    expect(findLandingForSlug("porta-cepillos", configs).landingSlug).toBe("porta-cepillos");
    const v = findLandingForSlug("lampara-blanca", configs);
    expect(v.variant.name).toBe("Blanca");
    expect(v.rootBundles).toEqual([{ qty: 1, price: 15000 }]);
    expect(findLandingForSlug("nada", configs)).toBeNull();
    expect(findLandingForSlug("", configs)).toBeNull();
  });

  it("lista una entrada por variante con slug, con nombre de meta e imágenes de historia", () => {
    const list = landingProducts(configs, meta);
    expect(list.map((p) => p.productSlug)).toEqual(["porta-cepillos", "lampara-blanca"]);
    expect(list[1]).toMatchObject({ name: "Lámpara Luna — Blanca", category: "hogar", images: ["s1.jpg", "s2.jpg"], price: 15000 });
    expect(list[0]).toMatchObject({ name: "Porta cepillos", category: "hogar", images: ["a.jpg"] });
  });

  it("missingLandingProducts excluye lo que ya está en la base", () => {
    expect(missingLandingProducts([{ slug: "porta-cepillos" }], configs, meta).map((p) => p.productSlug)).toEqual(["lampara-blanca"]);
  });

  it("seedPayload pone $1 si no hay precio y normaliza los packs", () => {
    const p = seedPayload({ name: "X", productSlug: "x", bundles: [{ price: "100", popular: 1 }] });
    expect(p.price).toBe(100);
    expect(p.bundles[0]).toEqual({ qty: 1, price: 100, compareAt: 0, label: "", badge: "", benefit: "", popular: true });
    expect(seedPayload({ name: "Y", productSlug: "y" }).price).toBe(1);
  });
});

describe("formulario", () => {
  const saved = {
    _id: "p1", slug: "porta-cepillos", name: "Porta", price: 20000, compareAtPrice: 30000,
    images: ["a.jpg", "b.jpg"], highlights: ["Uno"], isActive: false,
    bundles: [{ _id: "b1", qty: 1, price: 20000, compareAt: 30000, label: "1 unidad" }],
  };

  it("formFromProduct sin producto da un formulario vacío nuevo (no el objeto congelado)", () => {
    const f = formFromProduct(null);
    expect(f).toEqual(EMPTY_FORM);
    expect(f).not.toBe(EMPTY_FORM);
  });

  it("formFromProduct prefiere los packs de la base y si no hay, precarga los del config", () => {
    expect(formFromProduct(saved, configs).bundles).toBe(saved.bundles);
    const f = formFromProduct({ ...saved, bundles: [] }, configs);
    expect(f.bundles).toHaveLength(2);
    expect(f.bundles[1]).toMatchObject({ popular: true, badge: "Ahorrás", price: 36000 });
    expect(f.imagesText).toBe("a.jpg\nb.jpg");
    expect(f.isActive).toBe(false);
  });

  it("updateBundle no muta y castea solo los numéricos", () => {
    const bundles = [{ price: 1, label: "a" }, { price: 2, label: "b" }];
    const next = updateBundle(bundles, 1, "price", "350");
    expect(next[1].price).toBe(350);
    expect(bundles[1].price).toBe(2);
    expect(next[0]).toBe(bundles[0]);
    expect(updateBundle(bundles, 0, "label", "007")[0].label).toBe("007");
    expect(updateBundle(bundles, 0, "compareAt", "x")[0].compareAt).toBe(0);
  });

  it("payloadFromForm limpia y valida en orden", () => {
    const base = { ...EMPTY_FORM, slug: " Mi Prod ", name: " Nombre ", price: "100", imagesText: "a\n\n b ", highlightsText: " x \n" };
    const { payload, error } = payloadFromForm(base);
    expect(error).toBe("");
    expect(payload).toMatchObject({ slug: "mi-prod", name: "Nombre", price: 100, images: ["a", "b"], highlights: ["x"] });
    expect(payloadFromForm({ ...base, slug: "!!" }).error).toBe("Falta el slug");
    expect(payloadFromForm({ ...base, name: " " }).error).toBe("Falta el nombre");
    expect(payloadFromForm({ ...base, price: "" }).error).toBe("Falta el precio");
    expect(payloadFromForm({ ...base, price: "", bundles: [{ qty: 1, price: 50 }] }).error).toBe("");
    expect(payloadFromForm({ ...base, bundles: [{ qty: 1, price: 0 }] }).error).toBe("Hay paquetes sin precio");
  });

  it("isDirty: recién hidratado no hay cambios; strings vs números tampoco", () => {
    const f = formFromProduct(saved, configs);
    expect(isDirty(f, saved, configs)).toBe(false);
    expect(isDirty({ ...f, price: "20000", name: "Porta " }, saved, configs)).toBe(false);
  });

  it("isDirty detecta cambios en cualquier campo de un pack (antes se ignoraban badge/popular)", () => {
    const f = formFromProduct(saved, configs);
    expect(isDirty({ ...f, bundles: updateBundle(f.bundles, 0, "popular", true) }, saved, configs)).toBe(true);
    expect(isDirty({ ...f, bundles: updateBundle(f.bundles, 0, "badge", "Oferta") }, saved, configs)).toBe(true);
    expect(isDirty({ ...f, isActive: true }, saved, configs)).toBe(true);
  });

  it("isDirty: producto nuevo o packs precargados del config cuentan como sin guardar", () => {
    expect(isDirty(EMPTY_FORM, null, configs)).toBe(true);
    const noBundles = { ...saved, bundles: [] };
    expect(isDirty(formFromProduct(noBundles, configs), noBundles, configs)).toBe(true);
  });
});
