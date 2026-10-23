// frontend/src/hooks/admin/useAdminOrders.js
// Datos y acciones de la pestaña "Pedidos" del admin. La UI no habla con la API:
// recibe una página de pedidos, las tarjetas de stats, los flags de carga y
// acciones que ya avisan si algo falla.
//
// El listado se pide de a páginas (`GET /orders?limit=&cursor=`) y la búsqueda
// corre en el servidor (`?q=&status=`): con miles de pedidos ya no se baja
// todo al navegador. Las stats salen de `GET /orders/stats` con el mismo
// filtro, así "Recaudado" cuenta todos los pedidos y no solo los cargados.

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useDebouncedValue } from '../useDebouncedValue.js';

const noop = () => {};
export const PAGE_SIZE = 50;

/** Agrega una página a la lista sin duplicar pedidos (p. ej. si entró uno nuevo entre página y página). */
export function appendPage(prev, page) {
  const seen = new Set(prev.map((o) => o._id));
  return prev.concat(page.filter((o) => o && !seen.has(o._id) && seen.add(o._id)));
}

/** Query string del listado/stats: solo los filtros que filtran algo. */
export function orderParams({ query = '', status = 'todos', cursor, limit } = {}) {
  const params = {};
  if (limit) params.limit = limit;
  if (cursor) params.cursor = cursor;
  const q = query.trim();
  if (q) params.q = q;
  if (status && status !== 'todos') params.status = status;
  return params;
}

/**
 * @param {{
 *   enabled?: boolean, notify?: (msg: string, opts?: object) => void,
 *   query?: string, status?: string, debounceMs?: number, pageSize?: number,
 * }} opts
 *   enabled: carga (y recarga) cuando pasa a true, p. ej. al volver a la pestaña.
 *   query/status: filtros del servidor; la búsqueda espera `debounceMs` sin teclear.
 */
export function useAdminOrders({
  enabled = true, notify = noop, query = '', status = 'todos', debounceMs = 300, pageSize = PAGE_SIZE,
} = {}) {
  const [orders, setOrders] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const q = useDebouncedValue(query.trim(), debounceMs);

  // Cada carga desde la página 1 abre una "generación": una respuesta de una
  // generación vieja (filtro anterior, "Recargar" lento, "Cargar más" que
  // llegó tarde) no escribe nada, y tampoco después de desmontar.
  const generation = useRef(0);
  const statsRequest = useRef(0);
  const loadingMoreRef = useRef(false);
  useEffect(() => () => { generation.current = -1; statsRequest.current = -1; }, []);

  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; }, [notify]);

  const fetchStats = useCallback(async () => {
    const id = ++statsRequest.current;
    try {
      const res = await api.get('/orders/stats', { params: orderParams({ query: q, status }) });
      if (id === statsRequest.current && res.data?.ok) setStats(res.data.data);
    } catch {
      // Sin stats la lista sigue sirviendo: las tarjetas simplemente no se muestran.
      if (id === statsRequest.current) setStats(null);
    }
  }, [q, status]);

  const refresh = useCallback(async () => {
    const id = ++generation.current;
    loadingMoreRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setError('');
    fetchStats();
    try {
      const res = await api.get('/orders', { params: orderParams({ query: q, status, limit: pageSize }) });
      if (id !== generation.current) return;
      if (res.data?.ok) {
        setOrders(appendPage([], res.data.data || []));
        setNextCursor(res.data.nextCursor || null);
      } else {
        setError('Error al cargar pedidos');
      }
    } catch {
      if (id === generation.current) setError('Error al cargar pedidos');
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }, [q, status, pageSize, fetchStats]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  /** Trae la página siguiente. Ignora clics repetidos mientras hay una en vuelo. */
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    const id = generation.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await api.get('/orders', {
        params: orderParams({ query: q, status, limit: pageSize, cursor: nextCursor }),
      });
      if (id !== generation.current) return;
      if (res.data?.ok) {
        setOrders((prev) => appendPage(prev, res.data.data || []));
        setNextCursor(res.data.nextCursor || null);
      } else {
        notifyRef.current('No se pudieron cargar más pedidos.', { tone: 'error' });
      }
    } catch {
      if (id === generation.current) notifyRef.current('No se pudieron cargar más pedidos.', { tone: 'error' });
    } finally {
      if (id === generation.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [nextCursor, q, status, pageSize]);

  const replaceOrder = useCallback((updated) => {
    if (!updated?._id) return false;
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    fetchStats(); // un cambio de estado mueve las tarjetas ("A revisar" → "Aprobados")
    return true;
  }, [fetchStats]);

  /** PATCH de estados/seguimiento. Devuelve true si el servidor confirmó el cambio. */
  const updateOrder = useCallback(async (id, changes) => {
    setUpdating(id);
    try {
      const res = await api.patch(`/orders/${id}`, changes);
      return res.data?.ok ? replaceOrder(res.data.data) : false;
    } catch {
      notifyRef.current('No se pudo actualizar el pedido.', { tone: 'error' });
      return false;
    } finally {
      setUpdating(null);
    }
  }, [replaceOrder]);

  /** Aprueba el pago (con o sin comprobante). Si la respuesta no trae el pedido, recarga la lista. */
  const verifyOrder = useCallback(async (order) => {
    setUpdating(order._id);
    try {
      const res = await api.patch(`/orders/${order._id}/verify`);
      if (!(res.data?.ok && replaceOrder(res.data.data))) refresh();
      return true;
    } catch {
      notifyRef.current('No se pudo verificar el pago.', { tone: 'error' });
      return false;
    } finally {
      setUpdating(null);
    }
  }, [replaceOrder, refresh]);

  return {
    orders, stats, loading, loadingMore, error, updating,
    hasMore: Boolean(nextCursor),
    // true mientras la búsqueda tipeada todavía no se mandó (debounce)
    searching: query.trim() !== q,
    refresh, loadMore, updateOrder, verifyOrder,
  };
}
