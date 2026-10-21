// frontend/src/hooks/admin/useAbandonedCarts.js
// Datos y acciones de "Carritos abandonados" del admin. Las confirmaciones son
// de la UI (el panel pregunta antes de llamar a recover/remove); acá solo red y estado.

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const noop = () => {};

/**
 * @param {{ enabled?: boolean, notify?: (msg: string, opts?: object) => void }} opts
 */
export function useAbandonedCarts({ enabled = true, notify = noop } = {}) {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false); // incluye los recuperados

  const lastRequest = useRef(0);
  useEffect(() => () => { lastRequest.current = -1; }, []);

  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; }, [notify]);

  const refresh = useCallback(async () => {
    const id = ++lastRequest.current;
    setLoading(true);
    try {
      const res = await api.get(`/abandoned-carts${showAll ? '?all=1' : ''}`);
      if (id !== lastRequest.current) return;
      setCarts(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {
      if (id === lastRequest.current) notifyRef.current('No se pudieron cargar los carritos.', { tone: 'error' });
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }, [showAll]);

  // Recarga al entrar a la pestaña y al cambiar "Mostrar recuperados"; si el
  // toggle cambia con una petición en vuelo, la vieja se descarta.
  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  const run = useCallback(async (request, { success, failure }) => {
    try {
      await request();
      refresh();
      if (success) notifyRef.current(success, { tone: 'success' });
      return true;
    } catch {
      notifyRef.current(failure, { tone: 'error' });
      return false;
    }
  }, [refresh]);

  const recover = useCallback((id) => run(() => api.post(`/abandoned-carts/${id}/recover`), {
    success: 'Carrito marcado como recuperado.', failure: 'No se pudo actualizar el carrito.',
  }), [run]);

  const reopen = useCallback((id) => run(() => api.post(`/abandoned-carts/${id}/reopen`), {
    failure: 'No se pudo reabrir el carrito.',
  }), [run]);

  const markContacted = useCallback((id) => run(() => api.post(`/abandoned-carts/${id}/contacted`), {
    failure: 'No se pudo marcar como contactado.',
  }), [run]);

  const remove = useCallback((id) => run(() => api.delete(`/abandoned-carts/${id}`), {
    success: 'Carrito eliminado.', failure: 'No se pudo eliminar el carrito.',
  }), [run]);

  return { carts, loading, showAll, setShowAll, refresh, recover, reopen, markContacted, remove };
}
