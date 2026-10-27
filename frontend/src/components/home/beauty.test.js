import { describe, expect, it } from "vitest";
import { beautyFirst, concernsWithProducts, isBeauty, landingOf } from "./beauty.js";

const p = (id, href, price = 1000) => ({ _id: id, href, price });

describe("beauty", () => {
  it("lee el slug de landing del href", () => {
    expect(landingOf(p("a", "/lp/escultor-led"))).toBe("escultor-led");
    expect(landingOf(p("b", "/products/123"))).toBeNull();
  });

  it("detecta productos de belleza", () => {
    expect(isBeauty(p("a", "/lp/depiladora-ipl"))).toBe(true);
    expect(isBeauty(p("b", "/lp/sillon-puff-inflable"))).toBe(false);
  });

  it("pone belleza primero sin desordenar el resto", () => {
    const list = [
      p("puff", "/lp/sillon-puff-inflable"),
      p("led", "/lp/escultor-led"),
      p("lampara", "/lp/lampara-magnetica"),
      p("ipl", "/lp/depiladora-ipl"),
    ];
    expect(beautyFirst(list).map((x) => x._id)).toEqual(["ipl", "led", "puff", "lampara"]);
  });

  it("asocia cada necesidad con su producto y deja null si falta", () => {
    const items = concernsWithProducts([p("ipl", "/lp/depiladora-ipl", 39900)]);
    const depi = items.find((c) => c.id === "depilacion");
    const ojos = items.find((c) => c.id === "ojos");
    expect(depi.product.price).toBe(39900);
    expect(ojos.product).toBeNull();
  });
});
