import { describe, it, expect } from "vitest";
import { applyProductCopy, resolveLandingConfig, MAX_HIGHLIGHTS } from "./landingConfig";
import genericProductConfig, { GENERIC_TRUST_BULLETS } from "../../landings/generic.js";

const landing = { heroSubtitle: "Subtítulo de la landing", trustBullets: ["A", "B"] };

describe("applyProductCopy", () => {
  it("sin textos en el producto devuelve el mismo config", () => {
    expect(applyProductCopy(landing, null)).toBe(landing);
    expect(applyProductCopy(landing, { subtitle: "  ", highlights: ["", " "] })).toBe(landing);
  });

  it("subtitle y highlights del producto pisan los del config", () => {
    const out = applyProductCopy(landing, { subtitle: " Nuevo ", highlights: [" Uno ", "Dos"] });
    expect(out.heroSubtitle).toBe("Nuevo");
    expect(out.trustBullets).toEqual(["Uno", "Dos"]);
  });

  it("solo pisa lo que viene: highlights sin subtitle conserva el subtítulo", () => {
    const out = applyProductCopy(landing, { highlights: ["X"] });
    expect(out.heroSubtitle).toBe(landing.heroSubtitle);
    expect(out.trustBullets).toEqual(["X"]);
  });

  it("ignora no-strings y topea la cantidad", () => {
    const out = applyProductCopy(landing, { highlights: [1, null, ...Array.from({ length: 9 }, (_, i) => `h${i}`)] });
    expect(out.trustBullets).toHaveLength(MAX_HIGHLIGHTS);
    expect(out.trustBullets[0]).toBe("h0");
  });
});

describe("ficha genérica (/products/:id)", () => {
  it("no arrastra contenido de ninguna landing", () => {
    const mc = resolveLandingConfig(genericProductConfig, null, { name: "Sérum" });
    expect(mc.heroSubtitle).toBeUndefined();
    expect(mc.trustBullets).toEqual(GENERIC_TRUST_BULLETS);
    for (const key of ["storyBlocks", "reviewsCarousel", "faq", "upsell", "bundles", "soldCount", "howTo"]) {
      expect(mc[key]).toBeUndefined();
    }
  });

  it("usa los textos cargados en el producto", () => {
    const mc = resolveLandingConfig(genericProductConfig, null, {
      subtitle: "Piel luminosa en 2 semanas",
      highlights: ["💧 Ácido hialurónico"],
    });
    expect(mc.heroSubtitle).toBe("Piel luminosa en 2 semanas");
    expect(mc.trustBullets).toEqual(["💧 Ácido hialurónico"]);
  });

  it("en una landing con variante, el producto sigue ganando", () => {
    const cfg = { ...landing, sharedBenefits: ["S"] };
    const mc = resolveLandingConfig(cfg, { kitBullets: ["K"] }, { highlights: ["P"] });
    expect(mc.trustBullets).toEqual(["P"]);
  });
});

describe("applyProductCopy — descripción", () => {
  const product = { description: "  Texto largo  " };

  it("la ficha genérica la toma como productDescription", () => {
    expect(applyProductCopy(genericProductConfig, product).productDescription).toBe("Texto largo");
  });

  it("las landings propias no la muestran", () => {
    expect(applyProductCopy(landing, product)).toBe(landing);
  });

  it("descripción vacía o no-string no agrega nada", () => {
    expect(applyProductCopy(genericProductConfig, { description: "  " })).toBe(genericProductConfig);
    expect(applyProductCopy(genericProductConfig, { description: 5 })).toBe(genericProductConfig);
  });
});
