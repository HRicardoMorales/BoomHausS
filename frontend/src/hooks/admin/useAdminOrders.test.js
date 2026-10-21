import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const { default: api } = await import("../../services/api");
const { useAdminOrders } = await import("./useAdminOrders.js");
const { useAbandonedCarts } = await import("./useAbandonedCarts.js");

const order = (id, createdAt, extra = {}) => ({ _id: id, createdAt, paymentStatus: "pending", ...extra });
const ok = (data) => ({ data: { ok: true, data } });

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

beforeEach(() => vi.resetAllMocks());

describe("useAdminOrders", () => {
  it("carga al habilitarse y ordena del más nuevo al más viejo", async () => {
    api.get.mockResolvedValue(ok([order("a", "2026-10-01"), order("b", "2026-10-20")]));
    const { result } = renderHook(() => useAdminOrders());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledWith("/orders");
    expect(result.current.orders.map((o) => o._id)).toEqual(["b", "a"]);
  });

  it("no pide nada mientras está deshabilitado y carga al habilitarse", async () => {
    api.get.mockResolvedValue(ok([]));
    const { rerender } = renderHook(({ enabled }) => useAdminOrders({ enabled }), { initialProps: { enabled: false } });
    expect(api.get).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });

  it("muestra el error y lo limpia al reintentar con éxito", async () => {
    api.get.mockRejectedValueOnce(new Error("red")).mockResolvedValueOnce(ok([order("a", "2026-10-01")]));
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.error).toBe("Error al cargar pedidos"));
    await act(() => result.current.refresh());
    expect(result.current.error).toBe("");
    expect(result.current.orders).toHaveLength(1);
  });

  it("una respuesta vieja no pisa a una recarga más nueva", async () => {
    const slow = deferred();
    api.get.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(ok([order("nuevo", "2026-10-20")]));
    const { result } = renderHook(() => useAdminOrders());
    await act(() => result.current.refresh());
    await act(async () => { slow.resolve(ok([order("viejo", "2026-10-01")])); });
    expect(result.current.orders.map((o) => o._id)).toEqual(["nuevo"]);
    expect(result.current.loading).toBe(false);
  });

  it("updateOrder reemplaza solo el pedido actualizado y marca 'updating' mientras tanto", async () => {
    api.get.mockResolvedValue(ok([order("a", "2026-10-02"), order("b", "2026-10-01")]));
    const patch = deferred();
    api.patch.mockReturnValue(patch.promise);
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.orders).toHaveLength(2));

    let done;
    act(() => { done = result.current.updateOrder("b", { shippingStatus: "shipped" }); });
    expect(result.current.updating).toBe("b");
    await act(async () => { patch.resolve(ok(order("b", "2026-10-01", { shippingStatus: "shipped" }))); });
    expect(await done).toBe(true);
    expect(api.patch).toHaveBeenCalledWith("/orders/b", { shippingStatus: "shipped" });
    expect(result.current.orders.find((o) => o._id === "b").shippingStatus).toBe("shipped");
    expect(result.current.orders.find((o) => o._id === "a").shippingStatus).toBeUndefined();
    expect(result.current.updating).toBeNull();
  });

  it("avisa si falla una acción y no toca la lista", async () => {
    const notify = vi.fn();
    api.get.mockResolvedValue(ok([order("a", "2026-10-02")]));
    api.patch.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useAdminOrders({ notify }));
    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    let res;
    await act(async () => { res = await result.current.verifyOrder({ _id: "a" }); });
    expect(res).toBe(false);
    expect(notify).toHaveBeenCalledWith("No se pudo verificar el pago.", { tone: "error" });
    expect(result.current.orders[0].paymentStatus).toBe("pending");
  });

  it("verifyOrder recarga la lista si la respuesta no trae el pedido", async () => {
    api.get.mockResolvedValue(ok([order("a", "2026-10-02")]));
    api.patch.mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    await act(() => result.current.verifyOrder({ _id: "a" }));
    expect(api.patch).toHaveBeenCalledWith("/orders/a/verify");
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});

describe("useAbandonedCarts", () => {
  it("acepta la respuesta como array o como {ok,data} y 'mostrar recuperados' recarga con ?all=1", async () => {
    api.get.mockResolvedValueOnce({ data: [{ _id: "c1" }] }).mockResolvedValueOnce(ok([{ _id: "c1" }, { _id: "c2", recovered: true }]));
    const { result } = renderHook(() => useAbandonedCarts());
    await waitFor(() => expect(result.current.carts).toHaveLength(1));
    expect(api.get).toHaveBeenLastCalledWith("/abandoned-carts");
    act(() => result.current.setShowAll(true));
    await waitFor(() => expect(result.current.carts).toHaveLength(2));
    expect(api.get).toHaveBeenLastCalledWith("/abandoned-carts?all=1");
  });

  it("acciones: llaman al endpoint, recargan y avisan; si fallan devuelven false con el mensaje", async () => {
    const notify = vi.fn();
    api.get.mockResolvedValue(ok([{ _id: "c1" }]));
    api.post.mockResolvedValue({ data: { ok: true } });
    api.delete.mockRejectedValue(new Error("403"));
    const { result } = renderHook(() => useAbandonedCarts({ notify }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    await act(() => result.current.recover("c1"));
    expect(api.post).toHaveBeenCalledWith("/abandoned-carts/c1/recover");
    expect(notify).toHaveBeenCalledWith("Carrito marcado como recuperado.", { tone: "success" });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    await act(() => result.current.markContacted("c1"));
    expect(api.post).toHaveBeenLastCalledWith("/abandoned-carts/c1/contacted");

    let res;
    await act(async () => { res = await result.current.remove("c1"); });
    expect(res).toBe(false);
    expect(notify).toHaveBeenLastCalledWith("No se pudo eliminar el carrito.", { tone: "error" });
  });

  it("si falla la carga avisa en vez de quedar en silencio", async () => {
    const notify = vi.fn();
    api.get.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useAbandonedCarts({ notify }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudieron cargar los carritos.", { tone: "error" }));
    expect(result.current.loading).toBe(false);
    expect(result.current.carts).toEqual([]);
  });
});
