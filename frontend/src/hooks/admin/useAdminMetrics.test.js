import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));
const { default: api } = await import('../../services/api');
const { useAdminMetrics } = await import('./useAdminMetrics.js');

const byPath = (kpis) => (url) => Promise.resolve({
  data: url.includes('/kpis') ? kpis : url.includes('/chart') ? { labels: [], serie_completados: [] } : { payments: [] },
});

beforeEach(() => vi.resetAllMocks());

describe('useAdminMetrics', () => {
  it('pide las 3 rutas con el rango y normaliza', async () => {
    api.get.mockImplementation(byPath({ ventas: 10 }));
    const { result } = renderHook(() => useAdminMetrics('30d'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get.mock.calls.map((c) => c[0])).toEqual(['/metrics/kpis?range=30d', '/metrics/chart?range=30d', '/metrics/payments?range=30d']);
    expect(result.current.data.kpis.ventas).toBe(10);
  });

  it('error → mensaje y sin datos viejos; reintentar lo limpia', async () => {
    api.get.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useAdminMetrics('7d'));
    await waitFor(() => expect(result.current.error).toBe('No se pudieron cargar las métricas.'));
    expect(result.current.data).toBeNull();
    api.get.mockImplementation(byPath({ ventas: 5 }));
    await act(() => result.current.reload());
    expect(result.current.error).toBe('');
    expect(result.current.data.kpis.ventas).toBe(5);
  });

  it('cambiar de rango rápido: la respuesta vieja no pisa a la nueva', async () => {
    const pending = [];
    const releaseOld = () => pending.forEach((r) => r({ data: { ventas: 1 } }));
    api.get.mockImplementation((url) => {
      if (url.includes('range=7d')) return new Promise((r) => pending.push(r));
      return byPath({ ventas: 2 })(url);
    });
    const { result, rerender } = renderHook(({ r }) => useAdminMetrics(r), { initialProps: { r: '7d' } });
    rerender({ r: 'hoy' });
    await waitFor(() => expect(result.current.data?.kpis.ventas).toBe(2));
    await act(async () => { releaseOld(); await new Promise((r) => setTimeout(r, 0)); });
    expect(result.current.data.kpis.ventas).toBe(2);
  });
});
