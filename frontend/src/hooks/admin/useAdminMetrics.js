// frontend/src/hooks/admin/useAdminMetrics.js
// KPIs, serie y últimos pagos del dashboard para un rango. Las tres rutas se
// piden juntas; solo la última petición escribe el estado (cambiar de rango
// rápido o reintentar no deja que una respuesta vieja pise a la nueva).

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { normalizeMetrics } from '../../components/admin/home/metrics.js';

export const METRICS_ERROR = 'No se pudieron cargar las métricas.';

export function useAdminMetrics(range) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const lastRequest = useRef(0);
  useEffect(() => () => { lastRequest.current = -1; }, []);

  const load = useCallback(async () => {
    const id = ++lastRequest.current;
    setLoading(true);
    setError('');
    try {
      const q = `?range=${encodeURIComponent(range)}`;
      const [k, c, p] = await Promise.all([
        api.get(`/metrics/kpis${q}`),
        api.get(`/metrics/chart${q}`),
        api.get(`/metrics/payments${q}`),
      ]);
      if (id !== lastRequest.current) return;
      setData(normalizeMetrics(k?.data, c?.data, p?.data));
    } catch (e) {
      if (id !== lastRequest.current) return;
      setData(null);
      setError(e?.response?.data?.message || METRICS_ERROR);
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return { data, error, loading, reload: load };
}
