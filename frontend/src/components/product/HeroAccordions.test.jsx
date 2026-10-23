import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroAccordions from "./HeroAccordions";

const items = [
  { id: "descripcion", icon: "📝", title: "Descripción del producto", text: "Texto <img src=x onerror=alert(1)>" },
  { icon: "⭐", title: "Regalos", html: "<strong>Envío gratis</strong>" },
];

describe("HeroAccordions", () => {
  it("sin ítems no renderiza nada", () => {
    const { container } = render(<HeroAccordions />);
    expect(container.innerHTML).toBe("");
  });

  it("el texto plano se muestra como texto, nunca como HTML", () => {
    const { container } = render(<HeroAccordions items={items} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Texto <img src=x onerror=alert(1)>").tagName).toBe("P");
    expect(container.querySelector("strong").textContent).toBe("Envío gratis");
  });

  it("abre uno a la vez, con aria-expanded y aria-controls al panel", () => {
    render(<HeroAccordions items={items} />);
    const [desc, regalos] = screen.getAllByRole("button");
    const panel = document.getElementById(desc.getAttribute("aria-controls"));
    expect(panel).not.toBeNull();
    expect(panel.hasAttribute("inert")).toBe(true);

    fireEvent.click(desc);
    expect(desc.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hasAttribute("inert")).toBe(false);

    fireEvent.click(regalos);
    expect(desc.getAttribute("aria-expanded")).toBe("false");
    expect(regalos.getAttribute("aria-expanded")).toBe("true");
  });
});
