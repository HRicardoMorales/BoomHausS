// frontend/src/hooks/admin/useAdminProducts.js
// Datos y acciones del editor de productos del admin. La UI no habla con la API:
// recibe la lista, los flags de carga y acciones que devuelven { ok, data?, message? }.

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { seedPayload } from '../../components/admin/products/productForm.js';

const errorMessage = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

/** La API responde { ok, data }; algunas rutas viejas devolvían el array pelado. */
function listFrom(res) {
  const body = res?.data;
  const arr = Array.isArray(body?.data) ? body.data : body;
  return Array.isArray(arr) ? arr : [];
}

export function useAdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Qué acción está en curso: 'save' | 'delete' | 'seed-all' | `seed:<slug>` | null
  const [busy, setBusy] = useState(null);

  // Solo la última carga escribe el estado: un "Recargar" lento no pisa a uno
  // más nuevo (p. ej. el que dispara un guardado) y nada se escribe al desmontar.
  const lastRequest = useRef(0);
  useEffect(() => () => { lastRequest.current = -1; }, []);

  const refresh = useCallback(async () => {
    const id = ++lastRequest.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products/all');
      if (id !== lastRequest.current) return null;
      const list = listFrom(res);
      setProducts(list);
      return list;
    } catch (e) {
      if (id === lastRequest.current) setError(errorMessage(e, 'No se pudieron cargar los productos'));
      return null;
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const run = useCallback(async (key, fallback, fn) => {
    setBusy(key);
    try {
      return { ok: true, ...(await fn()) };
    } catch (e) {
      return { ok: false, message: errorMessage(e, fallback) };
    } finally {
      setBusy(null);
    }
  }, []);

  /** Crea (sin id) o actualiza. Devuelve el producto guardado para seleccionarlo. */
  const save = useCallback((id, payload) => run('save', 'Error al guardar', async () => {
    const res = id ? await api.patch(`/products/${id}`, payload) : await api.post('/products', payload);
    await refresh();
    return { data: res?.data?.data ?? null };
  }), [run, refresh]);

  const remove = useCallback((id) => run('delete', 'Error al eliminar', async () => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p._id !== id));
    refresh();
    return {};
  }), [run, refresh]);

  const seedOne = useCallback((lp) => run(`seed:${lp.productSlug}`, 'Error al crear', async () => {
    const res = await api.post('/products', seedPayload(lp));
    await refresh();
    return { data: res?.data?.data ?? null };
  }), [run, refresh]);

  /** Crea en serie los que faltan; un error no corta el resto. */
  const seedMany = useCallback(async (missing) => {
    setBusy('seed-all');
    let created = 0;
    const errors = [];
    try {
      for (const lp of missing) {
        try {
          await api.post('/products', seedPayload(lp));
          created++;
        } catch (e) {
          errors.push(`"${lp.name}": ${errorMessage(e, 'Error desconocido')}`);
        }
      }
      if (created) await refresh();
    } finally {
      setBusy(null);
    }
    return { created, errors };
  }, [refresh]);

  return { products, loading, error, busy, refresh, save, remove, seedOne, seedMany };
}
