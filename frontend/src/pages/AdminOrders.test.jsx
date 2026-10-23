import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const { default: api } = await import("../services/api");
const { default: AdminOrders } = await import("./AdminOrders.jsx");

const recent = new Date(Date.now() - 5 * 60000).toISOString();

beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockImplementation((url) => Promise.resolve(url.startsWith("/orders")
    ? { data: { ok: true, data: [{ _id: "o1", customerName: "Ana Gómez", paymentStatus: "pending", shippingStatus: "pending", totalAmount: 1000, createdAt: recent, items: [] }] } }
    : { data: { ok: true, data: [{ _id: "c1", name: "Leo Paz", phone: "1155551234", totalAmount: 5000, updatedAt: recent, step: "payment", items: [{ name: "Lámpara", quantity: 1, price: 5000 }] }] } }));
  api.post.mockResolvedValue({ data: { ok: true } });
});

describe("AdminOrders (integración con hooks y panel)", () => {
  it("lista los pedidos y pasa a abandonados, donde recuperar pide confirmación", async () => {
    render(<AdminOrders />);
    expect(await screen.findByText("Ana Gómez")).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/orders");

    fireEvent.click(screen.getByRole("button", { name: /Abandonados/ }));
    const card = (await screen.findByText("Leo Paz")).closest("article");
    expect(within(card).getByText("🔥 HOT")).toBeTruthy();
    expect(within(card).getByText("Pago")).toBeTruthy();
    expect(within(card).getByRole("link", { name: /WhatsApp/ }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5491155551234\?text=Hola%20Leo/);

    fireEvent.click(within(card).getByRole("button", { name: "✓ Recuperado" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Marcar el carrito como recuperado?" });
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Marcar recuperado" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/abandoned-carts/c1/recover"));
    expect(await screen.findByText("Carrito marcado como recuperado.")).toBeTruthy();
  });

  it("el detalle del pedido: tracking con Enter y aprobación manual con confirmación", async () => {
    api.patch.mockImplementation((url, body) => Promise.resolve({ data: { ok: true, data: { _id: "o1", customerName: "Ana Gómez", paymentStatus: "pending", shippingStatus: "pending", totalAmount: 1000, createdAt: recent, items: [], ...body } } }));
    render(<AdminOrders />);
    const row = await screen.findByRole("button", { name: /Ana Gómez/ });
    expect(row.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");

    const input = screen.getByLabelText("N° seguimiento");
    fireEvent.change(input, { target: { value: "  AR123  " } });
    fireEvent.submit(input.closest("form"));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/orders/o1", { trackingNumber: "AR123" }));

    fireEvent.click(screen.getByRole("button", { name: "Aprobar manual" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Aprobar el pago manualmente?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Aprobar pago" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/orders/o1", { paymentStatus: "approved" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Aprobar manual" })).toBeNull());
  });
});
