import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../services/api", () => ({ default: { post: vi.fn() } }));
import api from "../services/api";
import { CartContext } from "../context/cart.context";
import { CheckoutSheet } from "./CheckoutSheet.jsx";

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}|{String(loc.state?.skipCart)}</p>;
}

const cart = {
  items: [{ productId: "p1", name: "Lámpara", price: 10000, quantity: 2 }],
  totalPrice: 20000,
  calcItemTotal: (i) => i.price * i.quantity,
};

function renderSheet(value = cart, onClose = vi.fn()) {
  render(
    <CartContext.Provider value={value}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<CheckoutSheet onClose={onClose} />} />
          <Route path="/checkout" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </CartContext.Provider>
  );
  return onClose;
}

beforeEach(() => {
  api.post.mockReset();
  sessionStorage.clear();
});

describe("CheckoutSheet (carrito rápido)", () => {
  it("muestra el total y 'Finalizar compra' lleva a /checkout con skipCart", () => {
    const onClose = renderSheet();
    const cta = screen.getByRole("button", { name: /Finalizar compra/ });
    expect(cta.textContent).toMatch(/20\.000/);
    fireEvent.click(cta);
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByTestId("where").textContent).toBe("/checkout|true");
    expect(sessionStorage.getItem("pendingCoupon")).toBeNull();
  });

  it("con carrito vacío el CTA está deshabilitado", () => {
    renderSheet({ ...cart, items: [], totalPrice: 0 });
    expect(screen.getByRole("button", { name: /Finalizar compra/ })).toHaveProperty("disabled", true);
  });

  it("un cupón válido descuenta del total y viaja a /checkout en sessionStorage", async () => {
    api.post.mockResolvedValue({ data: { ok: true, data: { code: "HOLA10", type: "percent", value: 10 } } });
    renderSheet();
    fireEvent.click(screen.getByRole("button", { name: /código de descuento/ }));
    fireEvent.change(screen.getByLabelText("Código de cupón"), { target: { value: "hola10" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Finalizar compra/ }).textContent).toMatch(/18\.000/));
    expect(api.post).toHaveBeenCalledWith("/coupons/validate", { code: "HOLA10", cartTotal: 20000 });

    fireEvent.click(screen.getByRole("button", { name: /Finalizar compra/ }));
    expect(JSON.parse(sessionStorage.getItem("pendingCoupon"))).toEqual({ code: "HOLA10", type: "percent", value: 10 });
  });
});
