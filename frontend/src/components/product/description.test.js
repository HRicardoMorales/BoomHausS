import { describe, it, expect } from "vitest";
import { parseDescription, MAX_DESCRIPTION_CHARS } from "./description";

describe("parseDescription", () => {
  it("vacío o no-string → sin bloques", () => {
    expect(parseDescription(undefined)).toEqual([]);
    expect(parseDescription({ $ne: null })).toEqual([]);
    expect(parseDescription("   \n\n  ")).toEqual([]);
  });

  it("línea en blanco separa párrafos; salto simple se conserva", () => {
    expect(parseDescription("Uno\r\ndos\n\n\nTres")).toEqual([
      { type: "p", text: "Uno\ndos" },
      { type: "p", text: "Tres" },
    ]);
  });

  it("viñetas -, *, •, ✓ y numeradas forman una lista", () => {
    expect(parseDescription("Incluye:\n- Cable\n* Funda\n• Manual\n✓ Garantía\n2) Extra")).toEqual([
      { type: "p", text: "Incluye:" },
      { type: "ul", items: ["Cable", "Funda", "Manual", "Garantía", "Extra"] },
    ]);
  });

  it("texto después de la lista abre un párrafo nuevo", () => {
    expect(parseDescription("- A\n- B\nCierre")).toEqual([
      { type: "ul", items: ["A", "B"] },
      { type: "p", text: "Cierre" },
    ]);
  });

  it("un guion sin espacio no es viñeta y el HTML queda como texto", () => {
    expect(parseDescription("-20% hoy <b>x</b>")).toEqual([{ type: "p", text: "-20% hoy <b>x</b>" }]);
  });

  it("topea el largo", () => {
    const out = parseDescription("a".repeat(MAX_DESCRIPTION_CHARS + 500));
    expect(out[0].text).toHaveLength(MAX_DESCRIPTION_CHARS);
  });
});
