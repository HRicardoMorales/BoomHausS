import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Terms from "../../pages/Terms.jsx";
import Privacy from "../../pages/Privacy.jsx";
import Returns from "../../pages/Returns.jsx";

const renderPage = (Page, path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>
  );

describe.each([
  [Terms, "/terms", "Términos y condiciones", 8],
  [Privacy, "/privacy", "Política de privacidad", 6],
  [Returns, "/returns", "Cambios y devoluciones", 5],
])("página legal %#", (Page, path, title, sectionCount) => {
  it("un h1 y un h2 por sección (contacto incluido)", () => {
    renderPage(Page, path);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(sectionCount);
  });

  it("el índice apunta a anclas que existen", () => {
    const { container } = renderPage(Page, path);
    const toc = screen.getByRole("navigation", { name: "En esta página" });
    const links = within(toc).getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(sectionCount);
    for (const a of links) {
      const id = a.getAttribute("href").slice(1);
      expect(container.querySelector(`section[id="${id}"]`)).not.toBeNull();
    }
  });

  it("muestra la fecha de actualización y enlaza solo a las otras políticas", () => {
    renderPage(Page, path);
    expect(screen.getByText(/de octubre de 2026/).tagName).toBe("TIME");
    const others = within(screen.getByRole("navigation", { name: "Otras políticas" })).getAllByRole("link");
    expect(others).toHaveLength(2);
    expect(others.map((a) => a.getAttribute("href"))).not.toContain(path);
  });

  it("sin estilos en línea", () => {
    const { container } = renderPage(Page, path);
    expect(container.querySelectorAll("[style]")).toHaveLength(0);
  });
});

it("en mobile el índice se pliega al elegir una sección", () => {
  renderPage(Terms, "/terms");
  const details = screen.getByRole("navigation", { name: "En esta página" }).querySelector("details");
  details.open = true;
  fireEvent(details, new Event("toggle"));
  const link = within(details).getByRole("link", { name: /Envíos/ });
  fireEvent.click(link);
  expect(link.getAttribute("aria-current")).toBe("location");
  expect(details.open).toBe(false);
});
