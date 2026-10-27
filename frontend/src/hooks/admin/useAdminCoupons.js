// frontend/src/hooks/admin/useAdminCoupons.js
// Datos y acciones del admin de cupones. La UI no habla con la API: recibe la
// lista, los flags de carga y acciones que devuelven { ok, data?, message? }.

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const errorMessage = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

function listFrom(res) {
  const body = res?.data;
  const arr = Array.isArray(body?.data) ? body.data : body;
  return Array.isArray(arr) ? arr : [];
}

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  // ids con una acción en curso (activar/desactivar o eliminar): cada fila se
  // bloquea sola y se pueden tocar dos cupones distintos a la vez.
  const [pending, setPending] = useState(() => new Set());

  // Solo la última carga escribe el estado y nada se escribe al desmontar.
  const lastRequest = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; lastRequest.current = -1; };
  }, []);

  const refresh = useCallback(async () => {
    const id = ++lastRequest.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/coupons');
      if (id !== lastRequest.current) return null;
      const list = listFrom(res);
      setCoupons(list);
      return list;
    } catch (e) {
      if (id === lastRequest.current) setError(errorMessage(e, 'No se pudieron cargar los cupones.'));
      return null;
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const mark = useCallback((id, on) => {
    if (!alive.current) return;
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  /** Recibe el payload ya validado por `validateCouponForm`. */
  const create = useCallback(async (payload) => {
    setCreating(true);
    try {
      const res = await api.post('/coupons', payload);
      const created = res?.data?.data ?? null;
      if (created && alive.current) setCoupons((prev) => [created, ...prev.filter((c) => c._id !== created._id)]);
      return { ok: true, data: created };
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'No se pudo crear el cupón.') };
    } finally {
      if (alive.current) setCreating(false);
    }
  }, []);

  const toggle = useCallback(async (coupon) => {
    const id = coupon._id;
    mark(id, true);
    try {
      const res = await api.patch(`/coupons/${id}`, { isActive: !coupon.isActive });
      const updated = res?.data?.data;
      if (alive.current) {
        setCoupons((prev) => prev.map((c) => (c._id === id ? (updated ?? { ...c, isActive: !coupon.isActive }) : c)));
      }
      return { ok: true, data: updated };
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'No se pudo actualizar el cupón.') };
    } finally {
      mark(id, false);
    }
  }, [mark]);

  const remove = useCallback(async (id) => {
    mark(id, true);
    try {
      await api.delete(`/coupons/${id}`);
      if (alive.current) setCoupons((prev) => prev.filter((c) => c._id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'No se pudo eliminar el cupón.') };
    } finally {
      mark(id, false);
    }
  }, [mark]);

  return { coupons, loading, error, creating, pending, refresh, create, toggle, remove };
}
