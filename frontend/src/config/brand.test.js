import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_NAME, resolveStoreName } from "./brand.js";
import { SITE_NAME } from "../seo/routeSeo.js";

describe("resolveStoreName", () => {
  it("usa el valor de entorno recortado", () => {
    expect(resolveStoreName("  Mi Tienda ")).toBe("Mi Tienda");
  });

  it.each([undefined, null, "", "   ", 42, {}])("cae a la marca por defecto con %p", (raw) => {
    expect(resolveStoreName(raw)).toBe(DEFAULT_STORE_NAME);
  });

  it("el default coincide con la marca de los títulos SEO", () => {
    expect(SITE_NAME).toBe(DEFAULT_STORE_NAME);
  });
});
