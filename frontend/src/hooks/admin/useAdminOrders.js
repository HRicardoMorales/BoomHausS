// frontend/src/hooks/admin/useAdminOrders.js
// Datos y acciones de la pestaña "Pedidos" del admin. La UI no habla con la API:
// recibe la lista, los flags de carga y acciones que ya avisan si algo falla.

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { sortNewestFirst } from '../../components/admin/orders/format.js';

const noop = () => {};

/**
 * @param {{ enabled?: boolean, notify?: (msg: string, opts?: object) => void }} opts
 *   enabled: carga (y recarga) cuando pasa a true, p. ej. al volver a la pestaña.
 */
export function useAdminOrders({ enabled = true, notify = noop } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  // Solo la última petición puede escribir el estado: un "Recargar" lento no
  // pisa a uno más nuevo, y nada se escribe después de desmontar.
  const lastRequest = useRef(0);
  useEffect(() => () => { lastRequest.current = -1; }, []);

  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; }, [notify]);

  const refresh = useCallback(async () => {
    const id = ++lastRequest.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      if (id !== lastRequest.current) return;
      if (res.data?.ok) setOrders(sortNewestFirst(res.data.data));
      else setError('Error al cargar pedidos');
    } catch {
      if (id === lastRequest.current) setError('Error al cargar pedidos');
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  const replaceOrder = useCallback((updated) => {
    if (!updated?._id) return false;
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    return true;
  }, []);

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

  return { orders, loading, error, updating, refresh, updateOrder, verifyOrder };
}
