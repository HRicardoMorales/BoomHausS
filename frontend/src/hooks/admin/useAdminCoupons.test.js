import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const { default: api } = await import('../../services/api');
const { useAdminCoupons } = await import('./useAdminCoupons.js');

const ok = (data) => ({ data: { ok: true, data } });
const fail = (message) => Object.assign(new Error('http'), { response: { data: { message } } });
function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

beforeEach(() => vi.resetAllMocks());

async function mounted(list = [{ _id: 'a', code: 'A10', isActive: true }]) {
  api.get.mockResolvedValue(ok(list));
  const hook = renderHook(() => useAdminCoupons());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useAdminCoupons', () => {
  it('carga /coupons', async () => {
    const { result } = await mounted();
    expect(api.get).toHaveBeenCalledWith('/coupons');
    expect(result.current.coupons).toHaveLength(1);
  });

  it('el error de carga trae el mensaje del servidor y se limpia al reintentar', async () => {
    api.get.mockRejectedValueOnce(fail('Sin permiso')).mockResolvedValueOnce(ok([]));
    const { result } = renderHook(() => useAdminCoupons());
    await waitFor(() => expect(result.current.error).toBe('Sin permiso'));
    await act(() => result.current.refresh());
    expect(result.current.error).toBe('');
  });

  it('una carga vieja no pisa a una más nueva', async () => {
    const slow = deferred();
    api.get.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(ok([{ _id: 'nuevo' }]));
    const { result } = renderHook(() => useAdminCoupons());
    await act(() => result.current.refresh());
    await act(async () => { slow.resolve(ok([{ _id: 'viejo' }])); await slow.promise; });
    expect(result.current.coupons).toEqual([{ _id: 'nuevo' }]);
  });

  it('crear suma el cupón arriba; el error del servidor (código repetido) vuelve como mensaje', async () => {
    const { result } = await mounted();
    api.post.mockResolvedValueOnce(ok({ _id: 'b', code: 'B20' }));
    let r;
    await act(async () => { r = await result.current.create({ code: 'B20' }); });
    expect(r.ok).toBe(true);
    expect(result.current.coupons.map((c) => c._id)).toEqual(['b', 'a']);

    api.post.mockRejectedValueOnce(fail('Ya existe un cupón con ese código.'));
    await act(async () => { r = await result.current.create({ code: 'B20' }); });
    expect(r).toEqual({ ok: false, message: 'Ya existe un cupón con ese código.' });
    expect(result.current.creating).toBe(false);
  });

  it('activar/desactivar bloquea solo esa fila mientras dura', async () => {
    const { result } = await mounted([{ _id: 'a', isActive: true }, { _id: 'b', isActive: true }]);
    const slow = deferred();
    api.patch.mockReturnValueOnce(slow.promise);
    let p;
    act(() => { p = result.current.toggle(result.current.coupons[0]); });
    expect([...result.current.pending]).toEqual(['a']);
    await act(async () => { slow.resolve(ok({ _id: 'a', isActive: false })); await p; });
    expect(api.patch).toHaveBeenCalledWith('/coupons/a', { isActive: false });
    expect(result.current.pending.size).toBe(0);
    expect(result.current.coupons[0].isActive).toBe(false);
  });

  it('eliminar saca el cupón; si falla, queda y devuelve el error', async () => {
    const { result } = await mounted([{ _id: 'a' }, { _id: 'b' }]);
    api.delete.mockRejectedValueOnce(fail('No encontrado'));
    let r;
    await act(async () => { r = await result.current.remove('a'); });
    expect(r).toEqual({ ok: false, message: 'No encontrado' });
    expect(result.current.coupons).toHaveLength(2);

    api.delete.mockResolvedValueOnce(ok(null));
    await act(async () => { r = await result.current.remove('a'); });
    expect(result.current.coupons).toEqual([{ _id: 'b' }]);
  });

  it('no escribe estado después de desmontar', async () => {
    const { result, unmount } = await mounted();
    const slow = deferred();
    api.delete.mockReturnValueOnce(slow.promise);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    let p;
    act(() => { p = result.current.remove('a'); });
    unmount();
    slow.resolve(ok(null));
    await p;
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
