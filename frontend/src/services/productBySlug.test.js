import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api", () => ({ default: { get: vi.fn() } }));

import api from "./api";
import { prefetchProductBySlug, fetchProductBySlug } from "./productBySlug";
import { LANDING_PRODUCT_SLUGS } from "../routes/landingProducts.js";
import { PRODUCT_SLUG as luxSlug } from "../landings/LuxCoveLED/data.js";
import { PRODUCT_SLUG as iplSlug } from "../landings/DepiladoraIPL/data.js";
import { PRODUCT_SLUG as pdxSlug } from "../landings/ParchesDetox/data.js";
import { PRODUCT_SLUG as ampSlug } from "../landings/AntimohoPisos/data.js";

let n = 0;
beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation((url) => Promise.resolve({ data: { url, n: ++n } }));
});

// Cada test usa un slug propio: el módulo guarda estado entre tests.
describe("productBySlug", () => {
  it("la landing reutiliza el GET adelantado por la ruta (un solo pedido)", async () => {
    const pre = prefetchProductBySlug("a", 1000);
    const got = fetchProductBySlug("a", 1500);
    expect(got).toBe(pre);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/products/slug/a");
  });

  it("prefetch es idempotente mientras está fresco", () => {
    prefetchProductBySlug("b", 0);
    prefetchProductBySlug("b", 10);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("la promesa adelantada se consume una vez: la próxima visita pide de nuevo", () => {
    prefetchProductBySlug("c", 0);
    fetchProductBySlug("c", 1);
    fetchProductBySlug("c", 2);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("una promesa adelantada vieja (>30 s) no se usa", () => {
    const pre = prefetchProductBySlug("d", 0);
    const got = fetchProductBySlug("d", 31_000);
    expect(got).not.toBe(pre);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("sin prefetch hace el GET normal", async () => {
    await expect(fetchProductBySlug("e")).resolves.toMatchObject({ data: { url: "/products/slug/e" } });
  });

  it("si el GET adelantado falla, la landing recibe el error (y no hay unhandled rejection)", async () => {
    api.get.mockImplementationOnce(() => Promise.reject(new Error("503")));
    prefetchProductBySlug("f", 0);
    await expect(fetchProductBySlug("f", 1)).rejects.toThrow("503");
  });

  it("los slugs que adelanta App.jsx son los mismos que piden las landings", () => {
    expect([luxSlug, iplSlug, pdxSlug, ampSlug]).toEqual([
      LANDING_PRODUCT_SLUGS.luxCoveLED,
      LANDING_PRODUCT_SLUGS.depiladoraIPL,
      LANDING_PRODUCT_SLUGS.parchesDetox,
      LANDING_PRODUCT_SLUGS.antimohoPisos,
    ]);
    expect(luxSlug).toBe("escultor-led");
  });
});
