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

const { appendPage, orderParams } = await import("./useAdminOrders.js");

const STATS = { count: 3, total: 1000, approved: 1, review: 0, pending: 2, shipped: 0, delivered: 0 };
const page = (data, nextCursor = null) => ({ data: { ok: true, data, nextCursor } });

/** Rutea el mock de api.get: `/orders/stats` siempre responde STATS; el listado, lo que diga `list`. */
function routeGet(list) {
  api.get.mockImplementation((url, cfg) => {
    if (url === "/orders/stats") return Promise.resolve(ok(STATS));
    return list(cfg?.params || {});
  });
}
const listCalls = () => api.get.mock.calls.filter(([url]) => url === "/orders");

describe("useAdminOrders", () => {
  it("carga la página 1 con limit y las stats del servidor", async () => {
    routeGet(() => Promise.resolve(page([order("b", "2026-10-20"), order("a", "2026-10-01")], "c1")));
    const { result } = renderHook(() => useAdminOrders());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledWith("/orders", { params: { limit: 50 } });
    expect(api.get).toHaveBeenCalledWith("/orders/stats", { params: {} });
    expect(result.current.orders.map((o) => o._id)).toEqual(["b", "a"]);
    expect(result.current.hasMore).toBe(true);
    await waitFor(() => expect(result.current.stats).toEqual(STATS));
  });

  it("no pide nada mientras está deshabilitado y carga al habilitarse", async () => {
    routeGet(() => Promise.resolve(page([])));
    const { rerender } = renderHook(({ enabled }) => useAdminOrders({ enabled }), { initialProps: { enabled: false } });
    expect(api.get).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(listCalls()).toHaveLength(1));
  });

  it("loadMore pide con el cursor, agrega sin duplicar y se apaga en la última página", async () => {
    routeGet((params) => Promise.resolve(params.cursor
      ? page([order("b", "2026-10-02"), order("c", "2026-10-01")], null)
      : page([order("a", "2026-10-03"), order("b", "2026-10-02")], "cur-1")));
    const { result } = renderHook(() => useAdminOrders({ pageSize: 2 }));
    await waitFor(() => expect(result.current.orders).toHaveLength(2));
    await act(() => result.current.loadMore());
    expect(api.get).toHaveBeenLastCalledWith("/orders", { params: { limit: 2, cursor: "cur-1" } });
    expect(result.current.orders.map((o) => o._id)).toEqual(["a", "b", "c"]);
    expect(result.current.hasMore).toBe(false);
    await act(() => result.current.loadMore()); // sin cursor no pide nada
    expect(listCalls()).toHaveLength(2);
  });

  it("dos clics seguidos en 'Cargar más' hacen una sola petición", async () => {
    const more = deferred();
    routeGet((params) => (params.cursor ? more.promise : Promise.resolve(page([order("a", "2026-10-03")], "cur-1"))));
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => { result.current.loadMore(); result.current.loadMore(); });
    expect(result.current.loadingMore).toBe(true);
    await act(async () => { more.resolve(page([order("z", "2026-09-01")])); });
    expect(listCalls()).toHaveLength(2);
    expect(result.current.loadingMore).toBe(false);
  });

  it("búsqueda y estado van al servidor después del debounce y vuelven a la página 1", async () => {
    routeGet((params) => Promise.resolve(page(params.q ? [order("hit", "2026-10-01")] : [order("a", "2026-10-02")], params.q ? null : "cur-1")));
    const { result, rerender } = renderHook(({ query, status }) => useAdminOrders({ query, status, debounceMs: 20 }), {
      initialProps: { query: "", status: "todos" },
    });
    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    rerender({ query: "  ana ", status: "pending" });
    expect(result.current.searching).toBe(true);
    await waitFor(() => expect(result.current.orders.map((o) => o._id)).toEqual(["hit"]));
    expect(api.get).toHaveBeenCalledWith("/orders", { params: { limit: 50, q: "ana", status: "pending" } });
    expect(api.get).toHaveBeenCalledWith("/orders/stats", { params: { q: "ana", status: "pending" } });
    expect(result.current.searching).toBe(false);
    expect(result.current.hasMore).toBe(false);
  });

  it("un 'Cargar más' que llega después de cambiar el filtro se descarta", async () => {
    const more = deferred();
    routeGet((params) => {
      if (params.cursor) return more.promise;
      return Promise.resolve(page([order(params.status === "approved" ? "ok" : "a", "2026-10-02")], "cur-1"));
    });
    const { result, rerender } = renderHook(({ status }) => useAdminOrders({ status }), { initialProps: { status: "todos" } });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => { result.current.loadMore(); });
    rerender({ status: "approved" });
    await waitFor(() => expect(result.current.orders.map((o) => o._id)).toEqual(["ok"]));
    await act(async () => { more.resolve(page([order("viejo", "2026-09-01")])); });
    expect(result.current.orders.map((o) => o._id)).toEqual(["ok"]);
  });

  it("muestra el error y lo limpia al reintentar con éxito", async () => {
    let fail = true;
    routeGet(() => (fail ? Promise.reject(new Error("red")) : Promise.resolve(page([order("a", "2026-10-01")]))));
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.error).toBe("Error al cargar pedidos"));
    fail = false;
    await act(() => result.current.refresh());
    expect(result.current.error).toBe("");
    expect(result.current.orders).toHaveLength(1);
  });

  it("una respuesta vieja no pisa a una recarga más nueva", async () => {
    const slow = deferred();
    let n = 0;
    routeGet(() => (++n === 1 ? slow.promise : Promise.resolve(page([order("nuevo", "2026-10-20")]))));
    const { result } = renderHook(() => useAdminOrders());
    await act(() => result.current.refresh());
    await act(async () => { slow.resolve(page([order("viejo", "2026-10-01")])); });
    expect(result.current.orders.map((o) => o._id)).toEqual(["nuevo"]);
    expect(result.current.loading).toBe(false);
  });

  it("si fallan las stats la lista se muestra igual", async () => {
    api.get.mockImplementation((url) => (url === "/orders/stats"
      ? Promise.reject(new Error("500"))
      : Promise.resolve(page([order("a", "2026-10-01")]))));
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    expect(result.current.error).toBe("");
    expect(result.current.stats).toBeNull();
  });

  it("updateOrder reemplaza solo el pedido actualizado, marca 'updating' y refresca las stats", async () => {
    routeGet(() => Promise.resolve(page([order("a", "2026-10-02"), order("b", "2026-10-01")])));
    const patch = deferred();
    api.patch.mockReturnValue(patch.promise);
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.orders).toHaveLength(2));
    const statsBefore = api.get.mock.calls.filter(([u]) => u === "/orders/stats").length;

    let done;
    act(() => { done = result.current.updateOrder("b", { shippingStatus: "shipped" }); });
    expect(result.current.updating).toBe("b");
    await act(async () => { patch.resolve(ok(order("b", "2026-10-01", { shippingStatus: "shipped" }))); });
    expect(await done).toBe(true);
    expect(api.patch).toHaveBeenCalledWith("/orders/b", { shippingStatus: "shipped" });
    expect(result.current.orders.find((o) => o._id === "b").shippingStatus).toBe("shipped");
    expect(result.current.orders.find((o) => o._id === "a").shippingStatus).toBeUndefined();
    expect(result.current.updating).toBeNull();
    expect(api.get.mock.calls.filter(([u]) => u === "/orders/stats").length).toBe(statsBefore + 1);
  });

  it("avisa si falla una acción y no toca la lista", async () => {
    const notify = vi.fn();
    routeGet(() => Promise.resolve(page([order("a", "2026-10-02")])));
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
    routeGet(() => Promise.resolve(page([order("a", "2026-10-02")])));
    api.patch.mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(listCalls()).toHaveLength(1));
    await act(() => result.current.verifyOrder({ _id: "a" }));
    expect(api.patch).toHaveBeenCalledWith("/orders/a/verify");
    await waitFor(() => expect(listCalls()).toHaveLength(2));
  });
});

describe("helpers de paginación", () => {
  it("appendPage no duplica por _id (ni dentro de la misma página) y conserva el orden", () => {
    const prev = [{ _id: "a" }, { _id: "b" }];
    expect(appendPage(prev, [{ _id: "b" }, { _id: "c" }, { _id: "c" }, null]).map((o) => o._id)).toEqual(["a", "b", "c"]);
    expect(appendPage(prev, [])).toEqual(prev);
  });

  it("orderParams solo manda los filtros que filtran algo", () => {
    expect(orderParams()).toEqual({});
    expect(orderParams({ query: "   ", status: "todos", limit: 50 })).toEqual({ limit: 50 });
    expect(orderParams({ query: " ana ", status: "approved", cursor: "x" })).toEqual({ cursor: "x", q: "ana", status: "approved" });
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
