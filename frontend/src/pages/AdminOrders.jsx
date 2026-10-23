// frontend/src/pages/AdminOrders.jsx

import { useMemo, useRef, useState } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';
import './AdminOrders.css';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import { useNotice } from '../components/ui/useNotice.jsx';
import { useAdminOrders } from '../hooks/admin/useAdminOrders.js';
import { useAbandonedCarts } from '../hooks/admin/useAbandonedCarts.js';
import RowsSkeleton from '../components/admin/orders/RowsSkeleton.jsx';
import AbandonedCartsPanel from '../components/admin/orders/AbandonedCartsPanel.jsx';
import OrderCard from '../components/admin/orders/OrderCard.jsx';
import { money, PAYMENT_LABELS, PAYMENT_OPTS, computeOrderStats, filterOrders } from '../components/admin/orders/format.js';

export default function AdminOrders() {
  const { confirm, confirmDialog } = useConfirm();
  const { notify, notice } = useNotice();
  const [tab, setTab] = useState('orders');

  // Pedidos: datos y acciones en el hook; acá solo estado de la vista.
  const { orders, loading, error, updating, refresh: fetchOrders, updateOrder, verifyOrder } =
    useAdminOrders({ enabled: tab === 'orders', notify });
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const carts = useAbandonedCarts({ enabled: tab === 'abandoned', notify });

  const stats = useMemo(() => computeOrderStats(orders), [orders]);
  const filtered = useMemo(() => filterOrders(orders, { status: filter, query: search }), [orders, filter, search]);

  return (
    <>
      <main className="ao-page">
        <div className="ao-wrap">

          {/* Header */}
          <header className="ao-header">
            <div>
              <span className="ao-badge">Admin Panel</span>
              <h1 className="ao-title">Gestión de Ventas</h1>
            </div>
            <div className="ao-tabs" role="group" aria-label="Sección">
              <button type="button" aria-pressed={tab === 'orders'} className={`ao-tab ${tab === 'orders' ? 'ao-tab--on' : ''}`} onClick={() => setTab('orders')}>
                Pedidos <span className="ao-tab-count">{orders.length}</span>
              </button>
              <button type="button" aria-pressed={tab === 'abandoned'} className={`ao-tab ${tab === 'abandoned' ? 'ao-tab--on ao-tab--warn' : ''}`} onClick={() => setTab('abandoned')}>
                Abandonados {carts.carts.length > 0 && <span className="ao-tab-count ao-tab-count--warn">{carts.carts.length}</span>}
              </button>
            </div>
          </header>

          {/* ====== ORDERS TAB ====== */}
          {tab === 'orders' && (
            <>
              {/* Stats */}
              {!loading && orders.length > 0 && (
                <div className="ao-stats">
                  {[
                    { label: 'Recaudado',  value: money(stats.total),   cls: 'ao-st--green',  icon: '💰', bar: '#16a34a' },
                    { label: 'Aprobados',  value: stats.approved,        cls: 'ao-st--green',  icon: '✅', bar: '#16a34a' },
                    { label: 'A revisar',  value: stats.review,          cls: 'ao-st--yellow', icon: '⚠️', bar: '#ca8a04' },
                    { label: 'Pendientes', value: stats.pending,         cls: 'ao-st--muted',  icon: '⏳', bar: '#94a3b8' },
                    { label: 'En camino',  value: stats.shipped,         cls: 'ao-st--blue',   icon: '🚚', bar: '#2563eb' },
                    { label: 'Entregados', value: stats.delivered,       cls: 'ao-st--green',  icon: '📦', bar: '#16a34a' },
                  ].map(s => (
                    <div key={s.label} className={`ao-stat ${s.cls}`} style={{ '--ao-stat-bar': s.bar }}>
                      <div className="ao-stat-icon">{s.icon}</div>
                      <div className="ao-stat-val">{s.value}</div>
                      <div className="ao-stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search + Filter */}
              <div className="ao-bar">
                <input
                  className="ao-search"
                  type="text"
                  placeholder="Buscar nombre, email, tel, DNI, producto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="ao-filter" value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="todos">Todos</option>
                  {PAYMENT_OPTS.map(s => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
                </select>
                <button className="ao-btn ao-btn--ghost" onClick={fetchOrders} title="Recargar" aria-label="Recargar pedidos">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                </button>
              </div>

              {/* Order list */}
              {loading ? (
                <RowsSkeleton label="Cargando pedidos…" />
              ) : error ? (
                <div className="ao-empty ao-empty--err" role="alert">
                  <p>{error}</p>
                  <button type="button" className="ao-btn ao-btn--ghost" onClick={fetchOrders}>Reintentar</button>
                </div>
              ) : !filtered.length ? (
                <div className="ao-empty" role="status">
                  {search || filter !== 'todos' ? (
                    <>
                      <p>Ningún pedido coincide con la búsqueda o el filtro.</p>
                      <button type="button" className="ao-btn ao-btn--ghost" onClick={() => { setSearch(''); setFilter('todos'); }}>Limpiar filtros</button>
                    </>
                  ) : (
                    <p>Todavía no hay pedidos.</p>
                  )}
                </div>
              ) : (
                <div className="ao-list">
                  {filtered.map(order => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      open={expanded === order._id}
                      onToggle={() => setExpanded(expanded === order._id ? null : order._id)}
                      busy={updating === order._id}
                      onUpdate={updateOrder}
                      onVerify={verifyOrder}
                      onViewProof={setLightbox}
                      confirm={confirm}
                      notify={notify}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ====== ABANDONED TAB ====== */}
          {tab === 'abandoned' && <AbandonedCartsPanel carts={carts} notify={notify} />}

        </div>
      </main>
      {confirmDialog}
      {notice}

      {/* Lightbox */}
      {lightbox && (
        <ProofLightbox src={lightbox} onClose={() => setLightbox(null)} />
      )}

    </>
  );
}

/** Visor del comprobante: diálogo modal con foco atrapado y Escape para cerrar. */
function ProofLightbox({ src, onClose }) {
  const ref = useRef(null);
  useDialogA11y(ref, onClose);
  return (
    <div className="ao-lb" role="presentation" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        className="ao-lb-inner"
        role="dialog"
        aria-modal="true"
        aria-label="Comprobante de pago"
      >
        <img src={src} alt="Comprobante de pago" className="ao-lb-img" />
        <div className="ao-lb-actions">
          <button type="button" className="ao-btn ao-btn--dark" onClick={onClose}>Cerrar</button>
          <a href={src} target="_blank" rel="noreferrer" className="ao-btn ao-btn--primary">Abrir original</a>
        </div>
      </div>
    </div>
  );
}
