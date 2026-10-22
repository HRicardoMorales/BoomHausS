import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const { default: api } = await import("../../services/api");
const { useAdminProducts } = await import("./useAdminProducts.js");

const ok = (data) => ({ data: { ok: true, data } });
const fail = (message) => Object.assign(new Error("http"), { response: { data: { message } } });
function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

beforeEach(() => vi.resetAllMocks());

async function mounted(list = [{ _id: "a", slug: "a" }]) {
  api.get.mockResolvedValue(ok(list));
  const hook = renderHook(() => useAdminProducts());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useAdminProducts", () => {
  it("carga /products/all y acepta también un array pelado", async () => {
    const { result } = await mounted([{ _id: "a" }]);
    expect(api.get).toHaveBeenCalledWith("/products/all");
    expect(result.current.products).toEqual([{ _id: "a" }]);

    api.get.mockResolvedValueOnce({ data: [{ _id: "b" }] });
    await act(() => result.current.refresh());
    expect(result.current.products).toEqual([{ _id: "b" }]);
  });

  it("error de carga con el mensaje del servidor, que se limpia al reintentar", async () => {
    api.get.mockRejectedValueOnce(fail("Sin permiso")).mockResolvedValueOnce(ok([]));
    const { result } = renderHook(() => useAdminProducts());
    await waitFor(() => expect(result.current.error).toBe("Sin permiso"));
    await act(() => result.current.refresh());
    expect(result.current.error).toBe("");
  });

  it("una carga vieja no pisa a una más nueva", async () => {
    const slow = deferred();
    api.get.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(ok([{ _id: "nuevo" }]));
    const { result } = renderHook(() => useAdminProducts());
    await act(() => result.current.refresh());
    await act(async () => { slow.resolve(ok([{ _id: "viejo" }])); });
    expect(result.current.products).toEqual([{ _id: "nuevo" }]);
    expect(result.current.loading).toBe(false);
  });

  it("save: POST sin id, PATCH con id, devuelve el producto y marca busy", async () => {
    const { result } = await mounted();
    const post = deferred();
    api.post.mockReturnValueOnce(post.promise);
    let pending;
    act(() => { pending = result.current.save("", { name: "N" }); });
    expect(result.current.busy).toBe("save");
    await act(async () => { post.resolve(ok({ _id: "n1" })); await pending; });
    expect(await pending).toEqual({ ok: true, data: { _id: "n1" } });
    expect(result.current.busy).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(2);

    api.patch.mockResolvedValueOnce(ok({ _id: "a" }));
    await act(() => result.current.save("a", { name: "M" }));
    expect(api.patch).toHaveBeenCalledWith("/products/a", { name: "M" });
  });

  it("save fallido devuelve el mensaje y no recarga", async () => {
    const { result } = await mounted();
    api.patch.mockRejectedValueOnce(fail("Slug duplicado"));
    let res;
    await act(async () => { res = await result.current.save("a", {}); });
    expect(res).toEqual({ ok: false, message: "Slug duplicado" });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("remove saca el producto de la lista sin esperar la recarga", async () => {
    const { result } = await mounted([{ _id: "a" }, { _id: "b" }]);
    api.delete.mockResolvedValueOnce(ok(null));
    api.get.mockReturnValueOnce(new Promise(() => {}));
    await act(() => result.current.remove("a"));
    expect(api.delete).toHaveBeenCalledWith("/products/a");
    expect(result.current.products).toEqual([{ _id: "b" }]);
  });

  it("seedMany sigue ante errores y cuenta creados", async () => {
    const { result } = await mounted([]);
    api.post.mockResolvedValueOnce(ok({})).mockRejectedValueOnce(fail("duplicado")).mockResolvedValueOnce(ok({}));
    const lps = ["x", "y", "z"].map((s) => ({ name: s.toUpperCase(), productSlug: s }));
    let res;
    await act(async () => { res = await result.current.seedMany(lps); });
    expect(res).toEqual({ created: 2, errors: ['"Y": duplicado'] });
    expect(api.post).toHaveBeenCalledTimes(3);
    expect(api.post.mock.calls[0][1]).toMatchObject({ slug: "x", price: 1, isActive: true });
    expect(result.current.busy).toBeNull();
  });
});
