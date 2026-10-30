import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import RichText from "./RichText";

describe("<RichText>", () => {
  it("renderiza strong/em/br como elementos y pasa las props al contenedor", () => {
    const { container } = render(
      <RichText as="div" className="x" html="Probala <strong>30 días</strong><br><em>sin riesgo</em>" />
    );
    expect(container.innerHTML).toBe('<div class="x">Probala <strong>30 días</strong><br><em>sin riesgo</em></div>');
  });

  it("un <img onerror> en el config no crea ningún elemento ni ejecuta nada", () => {
    window.__pwned = false;
    const { container } = render(<RichText html={'Hola <img src="x" onerror="window.__pwned = true">mundo'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("Hola mundo");
    expect(window.__pwned).toBe(false);
  });

  it("las entidades escapadas salen como texto visible, no como HTML", () => {
    const { container } = render(<RichText html={"&lt;b&gt;hola&lt;/b&gt;"} />);
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toBe("<b>hola</b>");
  });
});
