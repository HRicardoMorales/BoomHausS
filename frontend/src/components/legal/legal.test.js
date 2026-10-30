import { describe, it, expect } from "vitest";
import { whatsappLink, formatUpdated, sectionNumber, otherLegalPages } from "./legal.js";

describe("whatsappLink", () => {
  it("limpia el número y codifica el mensaje", () => {
    expect(whatsappLink("+54 9 11 2345-6789", "Hola! ¿Cambio?")).toBe(
      "https://wa.me/5491123456789?text=Hola!%20%C2%BFCambio%3F"
    );
  });
  it("sin mensaje no agrega ?text", () => {
    expect(whatsappLink("5491123456789")).toBe("https://wa.me/5491123456789");
  });
  it("vacío, null o demasiado corto → null", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("12-34")).toBeNull();
  });
});

describe("formatUpdated", () => {
  it("formatea en español sin correrse de día por zona horaria", () => {
    expect(formatUpdated("2026-10-22")).toEqual({ iso: "2026-10-22", label: "22 de octubre de 2026" });
    expect(formatUpdated("2026-01-01").label).toBe("1 de enero de 2026");
  });
  it("rechaza formatos y fechas imposibles", () => {
    expect(formatUpdated("22/10/2026")).toBeNull();
    expect(formatUpdated("2026-02-30")).toBeNull();
    expect(formatUpdated(undefined)).toBeNull();
  });
});

describe("sectionNumber / otherLegalPages", () => {
  it("numera con dos dígitos", () => {
    expect(sectionNumber(0)).toBe("01");
    expect(sectionNumber(9)).toBe("10");
  });
  it("excluye la página actual", () => {
    expect(otherLegalPages("/privacy").map((p) => p.to)).toEqual(["/terms", "/returns"]);
  });
});
