import { describe, expect, it } from "vitest";
import { parseRichText } from "./richText";

describe("parseRichText", () => {
  it("texto plano y valores no-string", () => {
    expect(parseRichText("Hola")).toEqual(["Hola"]);
    expect(parseRichText("")).toEqual([]);
    expect(parseRichText(undefined)).toEqual([]);
    expect(parseRichText({ html: "<b>x</b>" })).toEqual([]);
  });

  it("strong, em y br de los configs reales", () => {
    expect(parseRichText("Probala <strong>30 días sin riesgo</strong>.<br>• Envío gratis")).toEqual([
      "Probala ",
      { type: "strong", children: ["30 días sin riesgo"] },
      ".",
      { type: "br" },
      "• Envío gratis",
    ]);
    expect(parseRichText('<em>"Relajada"</em> — compradora<br/>')).toEqual([
      { type: "em", children: ['"Relajada"'] },
      " — compradora",
      { type: "br" },
    ]);
  });

  it("<b>/<i> se normalizan y se respeta el anidado", () => {
    expect(parseRichText("<B>a <i>b</i></B>")).toEqual([
      { type: "strong", children: ["a ", { type: "em", children: ["b"] }] },
    ]);
  });

  it("los atributos de etiquetas permitidas se descartan", () => {
    expect(parseRichText('<strong onclick="alert(1)" style="color:red">x</strong>')).toEqual([
      { type: "strong", children: ["x"] },
    ]);
  });

  it("etiquetas fuera de la lista blanca: solo queda su texto", () => {
    expect(parseRichText('Hola <img src=x onerror="alert(1)">mundo')).toEqual(["Hola mundo"]);
    expect(parseRichText('<a href="javascript:alert(1)">link</a>')).toEqual(["link"]);
    expect(parseRichText("<script>alert(1)</script>")).toEqual(["alert(1)"]);
    expect(parseRichText("a<!-- <strong>no</strong> -->b")).toEqual(["ab"]);
  });

  it("cierres huérfanos, mal anidados, sin cerrar y vacíos", () => {
    expect(parseRichText("a</strong>b")).toEqual(["ab"]);
    expect(parseRichText("<strong>a<em>b</strong>c")).toEqual([
      { type: "strong", children: ["a", { type: "em", children: ["b"] }] },
      "c",
    ]);
    expect(parseRichText("<strong>sin cerrar")).toEqual([{ type: "strong", children: ["sin cerrar"] }]);
    expect(parseRichText("a<strong></strong>b")).toEqual(["ab"]);
  });

  it("entidades: se decodifican una vez y no vuelven a ser HTML", () => {
    expect(parseRichText("4 &amp; 5&nbsp;%")).toEqual(["4 & 5 %"]);
    expect(parseRichText("&lt;img src=x onerror=alert(1)&gt;")).toEqual(["<img src=x onerror=alert(1)>"]);
    expect(parseRichText("&#9733; &#x2B50; &bogus;")).toEqual(["★ ⭐ &bogus;"]);
  });
});
