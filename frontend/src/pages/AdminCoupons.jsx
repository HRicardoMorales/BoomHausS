// frontend/src/pages/AdminCoupons.jsx
// Admin de cupones. Esta página solo orquesta: datos y llamadas a la API en
// `useAdminCoupons`; validación, payload y estado de cada cupón en
// `couponForm.js`; la vista en `components/admin/coupons/`.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminCoupons.css';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import { useNotice } from '../components/ui/useNotice.jsx';
import StatePanel from '../components/ui/StatePanel.jsx';
import { useAdminCoupons } from '../hooks/admin/useAdminCoupons.js';
import CouponForm from '../components/admin/coupons/CouponForm.jsx';
import CouponTicket from '../components/admin/coupons/CouponTicket.jsx';
import { couponSummary } from '../components/admin/coupons/couponForm.js';

export default function AdminCoupons() {
  const { confirm, confirmDialog } = useConfirm();
  const { notify, notice } = useNotice({ duration: 3200 });
  const { coupons, loading, error, creating, pending, refresh, create, toggle, remove } = useAdminCoupons();
  const [showForm, setShowForm] = useState(false);
  const openerRef = useRef(null);

  // Una sola "hora actual" para toda la lista (render puro, todas las filas
  // evalúan el vencimiento igual). Basta con la de apertura de la página.
  const [now] = useState(() => new Date());
  const { total, live } = couponSummary(coupons, now);

  function closeForm() {
    setShowForm(false);
    openerRef.current?.focus();
  }

  async function handleCreate(payload) {
    const r = await create(payload);
    if (r.ok) {
      notify(`Cupón ${r.data?.code || payload.code} creado.`, { tone: 'success' });
      closeForm();
    }
    return r;
  }

  async function handleToggle(c) {
    const r = await toggle(c);
    if (!r.ok) notify(r.message, { tone: 'error' });
    else notify(c.isActive ? `${c.code} quedó apagado.` : `${c.code} quedó activado.`);
  }

  async function handleDelete(c) {
    const ok = await confirm({
      title: `¿Eliminar el cupón ${c.code}?`,
      message: 'Deja de funcionar en el checkout al instante. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar cupón',
      tone: 'danger',
    });
    if (!ok) return;
    const r = await remove(c._id);
    notify(r.ok ? `Cupón ${c.code} eliminado.` : r.message, { tone: r.ok ? 'info' : 'error' });
  }

  return (
    <main className="section ac-page">
      <div className="container ac-wrap">
        <header className="ac-header">
          <div>
            <Link className="ac-back" to="/admin">← Panel</Link>
            <h1 className="ac-title">Cupones</h1>
            {!loading && !error && (
              <p className="ac-count">
                <strong>{live}</strong> funcionando · {total} en total
              </p>
            )}
          </div>
          {!showForm && (
            <button ref={openerRef} type="button" className="ac-new" onClick={() => setShowForm(true)} aria-expanded="false">
              <span aria-hidden="true">+</span> Nuevo cupón
            </button>
          )}
        </header>

        {showForm && <CouponForm onCreate={handleCreate} creating={creating} onCancel={closeForm} />}

        {loading && !coupons.length ? (
          <ul className="ac-list" aria-busy="true" aria-label="Cargando cupones">
            {[0, 1, 2].map((i) => <li key={i} className="ac-ticket ac-ticket--skeleton" />)}
          </ul>
        ) : error ? (
          <StatePanel tone="error" size="inline" title="No se pudieron cargar los cupones" actions={
            <button type="button" className="ac-new" onClick={refresh}>Reintentar</button>
          }>
            {error}
          </StatePanel>
        ) : coupons.length === 0 ? (
          <StatePanel icon="bag" size="inline" title="Todavía no hay cupones">
            Creá el primero con “Nuevo cupón”: el cliente lo escribe en el checkout y el descuento se valida en el servidor.
          </StatePanel>
        ) : (
          <ul className="ac-list">
            {coupons.map((c) => (
              <CouponTicket
                key={c._id}
                coupon={c}
                now={now}
                busy={pending.has(c._id)}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
      {confirmDialog}
      {notice}
    </main>
  );
}
