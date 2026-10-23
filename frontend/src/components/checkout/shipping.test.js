import { describe, expect, it } from "vitest";
import { SHIPPING_OPTIONS, isDeliveryUnlocked, shippingPrice } from "./shipping";

describe("shipping", () => {
  it("cada opción tiene su precio y lo desconocido es gratis", () => {
    for (const o of SHIPPING_OPTIONS) expect(shippingPrice(o.value)).toBe(o.price);
    expect(shippingPrice("teletransporte")).toBe(0);
    expect(shippingPrice(undefined)).toBe(0);
  });

  it("los precios tachados son mayores que los cobrados", () => {
    for (const o of SHIPPING_OPTIONS.filter((x) => x.was)) expect(o.was).toBeGreaterThan(o.price);
  });

  it("las opciones aparecen con algo de dirección cargado", () => {
    const empty = { direccion: "", ciudad: "", cp: "" };
    expect(isDeliveryUnlocked(empty)).toBe(false);
    expect(isDeliveryUnlocked({ ...empty, direccion: "   ab  " })).toBe(false);
    expect(isDeliveryUnlocked({ ...empty, direccion: "Av. 9" })).toBe(true);
    expect(isDeliveryUnlocked({ ...empty, ciudad: "CABA" })).toBe(true);
    expect(isDeliveryUnlocked({ ...empty, cp: "1425" })).toBe(true);
  });
});
