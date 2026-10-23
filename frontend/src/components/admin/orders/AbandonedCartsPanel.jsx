// frontend/src/components/admin/orders/AbandonedCartsPanel.jsx
// Pestaña "Abandonados" del admin: estadísticas, búsqueda y tarjetas con acciones
// de recuperación. Recibe el estado de useAbandonedCarts; los estilos (ao-*) son
// los de AdminOrders.

import { useMemo, useState } from 'react';
import { useConfirm } from '../../ui/useConfirm.jsx';
import RowsSkeleton from './RowsSkeleton.jsx';
import {
  money, relativeTime, isHotCart, cartStepLabel, cartItemCount,
  cartWaLink, cartClipboardText, computeCartStats, filterCarts,
} from './format.js';

export default function AbandonedCartsPanel({ carts: cartsState, notify }) {
  const { carts, loading, showAll, setShowAll, refresh, recover, reopen, markContacted, remove } = cartsState;
  const { confirm, confirmDialog } = useConfirm();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  const stats = useMemo(() => computeCartStats(carts), [carts]);
  const filtered = useMemo(() => filterCarts(carts, search), [carts, search]);

  async function handleRecover(id) {
    const ok = await confirm({
      title: '¿Marcar el carrito como recuperado?',
      message: 'Sale de la lista de pendientes. Podés reabrirlo después.',
      confirmLabel: 'Marcar recuperado',
    });
    if (ok) recover(id);
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: '¿Eliminar este carrito abandonado?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (ok) remove(id);
  }

  function handleCopy(cart) {
    navigator.clipboard.writeText(cartClipboardText(cart)).then(
      () => { setCopied(cart._id); setTimeout(() => setCopied(null), 1500); },
      () => notify?.('No se pudo copiar al portapapeles.', { tone: 'error' }),
    );
  }

  return (
    <>
      <div className="ao-abandon-header">
        <div>
          <h2 className="ao-abandon-title">Recuperación de ventas</h2>
          <p className="ao-abandon-sub">Personas que dejaron datos pero no pagaron. Contactalos por WhatsApp para cerrar la venta.</p>
        </div>
        <button className="ao-btn ao-btn--ghost" onClick={refresh}>↻ Actualizar</button>
      </div>

      {/* Stats abandoned */}
      <div className="ao-stats">
        <div className="ao-stat ao-st--yellow">
          <div className="ao-stat-val">{stats.pendingCount}</div>
          <div className="ao-stat-lbl">Pendientes</div>
        </div>
        <div className="ao-stat ao-st--green">
          <div className="ao-stat-val">{money(stats.totalValue)}</div>
          <div className="ao-stat-lbl">Valor a recuperar</div>
        </div>
        <div className="ao-stat ao-st--red">
          <div className="ao-stat-val">{stats.hot}</div>
          <div className="ao-stat-lbl">🔥 Hot (&lt;1h)</div>
        </div>
        <div className="ao-stat ao-st--blue">
          <div className="ao-stat-val">{stats.withPhone}</div>
          <div className="ao-stat-lbl">Con teléfono</div>
        </div>
        <div className="ao-stat ao-st--muted">
          <div className="ao-stat-val">{stats.recovered}</div>
          <div className="ao-stat-lbl">Recuperados</div>
        </div>
      </div>

      {/* Search + toggle */}
      <div className="ao-bar">
        <input
          className="ao-search"
          type="text"
          placeholder="Buscar por nombre, tel, email, producto, landing..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="ao-cart-toggle">
          <input
            type="checkbox"
            checked={showAll}
            onChange={e => setShowAll(e.target.checked)}
          />
          Mostrar recuperados
        </label>
      </div>

      {loading ? (
        <RowsSkeleton label="Cargando carritos…" rows={4} />
      ) : !filtered.length ? (
        <div className="ao-empty" role="status">
          {search ? (
            <>
              <p>Sin resultados para la búsqueda.</p>
              <button type="button" className="ao-btn ao-btn--ghost" onClick={() => setSearch('')}>Limpiar búsqueda</button>
            </>
          ) : (
            <p>No hay carritos abandonados pendientes.</p>
          )}
        </div>
      ) : (
        <div className="ao-list">
          {filtered.map(cart => {
            const wa = cartWaLink(cart);
            const ago = relativeTime(cart.updatedAt || cart.createdAt);
            const hot = isHotCart(cart);
            const isOpen = expanded === cart._id;
            const totalItems = cartItemCount(cart);
            const stepLabel = cartStepLabel(cart.step);

            return (
              <article key={cart._id} className={`ao-cart-card ${cart.recovered ? 'ao-cart-card--done' : ''}`}>
                {/* Header row */}
                <div className="ao-cart-header">
                  <div className="ao-cart-head-left">
                    <div className="ao-cart-name-row">
                      <span className="ao-cart-name">{cart.name || 'Sin nombre'}</span>
                      {hot && <span className="ao-cart-badge ao-cart-badge--hot">🔥 HOT</span>}
                      {cart.recovered && <span className="ao-cart-badge ao-cart-badge--done">✓ Recuperado</span>}
                      {cart.contactedAt && !cart.recovered && <span className="ao-cart-badge ao-cart-badge--contact">📞 Contactado</span>}
                    </div>
                    <div className="ao-cart-meta">
                      <span className={`ao-cart-ago ${hot ? 'ao-cart-ago--hot' : ''}`}>{ago || '—'}</span>
                      <span className="ao-cart-sep">•</span>
                      <span>Paso: <strong>{stepLabel}</strong></span>
                      {cart.landingSource && (
                        <>
                          <span className="ao-cart-sep">•</span>
                          <span>Landing: <strong>{cart.landingSource}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ao-cart-head-right">
                    <div className="ao-cart-total">{money(cart.totalAmount)}</div>
                    <div className="ao-cart-items-count">{totalItems} ítem{totalItems !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Contact row */}
                <div className="ao-cart-contact">
                  {cart.phone && (
                    <span className="ao-cart-chip">📱 <a href={`tel:${cart.phone}`}>{cart.phone}</a></span>
                  )}
                  {cart.email && (
                    <span className="ao-cart-chip">✉️ <a href={`mailto:${cart.email}`}>{cart.email}</a></span>
                  )}
                  {cart.address && (
                    <span className="ao-cart-chip">📍 {cart.address}{cart.city ? `, ${cart.city}` : ''}</span>
                  )}
                  {cart.paymentMethod && (
                    <span className="ao-cart-chip">💳 {cart.paymentMethod}</span>
                  )}
                </div>

                {/* Items (toggle) */}
                <button className="ao-cart-expand" onClick={() => setExpanded(isOpen ? null : cart._id)}>
                  {isOpen ? '▲ Ocultar productos' : `▼ Ver productos (${(cart.items || []).length})`}
                </button>
                {isOpen && (
                  <div className="ao-cart-items-box">
                    {(cart.items || []).map((it, i) => (
                      <div key={i} className="ao-item-row">
                        <div className="ao-item-left">
                          <span className="ao-item-name">{it.name}</span>
                          <span className="ao-item-qty"> × {it.quantity}</span>
                        </div>
                        <span className="ao-item-total">{money((it.price || 0) * (it.quantity || 0))}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="ao-cart-actions">
                  {wa ? (
                    <a href={wa} target="_blank" rel="noreferrer" className="ao-btn ao-btn--wa">💬 WhatsApp</a>
                  ) : (
                    <span className="ao-muted">Sin teléfono</span>
                  )}
                  <button className="ao-btn ao-btn--ghost" onClick={() => handleCopy(cart)}>
                    {copied === cart._id ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                  {!cart.contactedAt && !cart.recovered && (
                    <button className="ao-btn ao-btn--ghost" onClick={() => markContacted(cart._id)}>📞 Contactado</button>
                  )}
                  {!cart.recovered ? (
                    <button className="ao-btn ao-btn--primary" onClick={() => handleRecover(cart._id)}>✓ Recuperado</button>
                  ) : (
                    <button className="ao-btn ao-btn--ghost" onClick={() => reopen(cart._id)}>↺ Reabrir</button>
                  )}
                  <button className="ao-btn ao-btn--danger" onClick={() => handleDelete(cart._id)}>🗑</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {confirmDialog}
    </>
  );
}
