// frontend/src/pages/AdminOrders.jsx

import { useMemo, useRef, useState } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import { useNotice } from '../components/ui/useNotice.jsx';
import { useAdminOrders } from '../hooks/admin/useAdminOrders.js';
import { useAbandonedCarts } from '../hooks/admin/useAbandonedCarts.js';
import RowsSkeleton from '../components/admin/orders/RowsSkeleton.jsx';
import AbandonedCartsPanel from '../components/admin/orders/AbandonedCartsPanel.jsx';
import {
  money, formatDate, relativeTime, PAYMENT_LABELS, SHIPPING_LABELS, PAYMENT_OPTS, SHIPPING_OPTS,
  METHOD_MAP, SHIP_METHOD_MAP, orderWaLink, orderClipboardText, computeOrderStats, filterOrders,
} from '../components/admin/orders/format.js';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${BASE_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
};


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
  const [copied, setCopied] = useState(null);
  const [trackInputs, setTrackInputs] = useState({});

  const carts = useAbandonedCarts({ enabled: tab === 'abandoned', notify });

  function copyOrder(order) {
    navigator.clipboard.writeText(orderClipboardText(order)).then(
      () => { setCopied(order._id); setTimeout(() => setCopied(null), 1500); },
      () => notify('No se pudo copiar al portapapeles.', { tone: 'error' }),
    );
  }

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
            <div className="ao-tabs">
              <button className={`ao-tab ${tab === 'orders' ? 'ao-tab--on' : ''}`} onClick={() => setTab('orders')}>
                Pedidos <span className="ao-tab-count">{orders.length}</span>
              </button>
              <button className={`ao-tab ${tab === 'abandoned' ? 'ao-tab--on ao-tab--warn' : ''}`} onClick={() => setTab('abandoned')}>
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
                  {filtered.map(order => {
                    const open = expanded === order._id;
                    const proofUrl = getImageUrl(order.paymentProofUrl);
                    const isApproved = ['approved', 'confirmed'].includes(order.paymentStatus);
                    const met = METHOD_MAP[order.paymentMethod] || { label: order.paymentMethod || 'Otro', ico: '' };
                    const wa = orderWaLink(order);

                    return (
                      <article key={order._id} className={`ao-card ${open ? 'ao-card--open' : ''}`}>

                        {/* Row header */}
                        <button
                          type="button"
                          className="ao-row"
                          aria-expanded={open}
                          aria-controls={`ao-detail-${order._id}`}
                          onClick={() => setExpanded(open ? null : order._id)}
                        >
                          <div className="ao-row-left">
                            <div className="ao-row-top">
                              <span className="ao-name">{order.customerName || 'Sin nombre'}</span>
                              <span className={`ao-met ${met.ico}`}>{met.label}</span>
                              {(order.items?.length || 0) > 1 && <span className="ao-extra">+extras</span>}
                            </div>
                            <div className="ao-row-mid">
                              <span className="ao-price">{money(order.totalAmount)}</span>
                              <span className="ao-sep">·</span>
                              <span className="ao-items">{order.items?.reduce((a, i) => a + i.quantity, 0) || 0} ud</span>
                              <span className="ao-sep">·</span>
                              <span className="ao-date">{relativeTime(order.createdAt)}</span>
                            </div>
                          </div>
                          <div className="ao-row-right">
                            <span className={`ao-status ao-ps--${order.paymentStatus}`}>{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</span>
                            <span className={`ao-ship ao-ss--${order.shippingStatus}`}>{SHIPPING_LABELS[order.shippingStatus] || order.shippingStatus || 'Pendiente'}</span>
                            <span className="ao-arrow" aria-hidden="true">{open ? '\u25B2' : '\u25BC'}</span>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {open && (
                          <div className="ao-detail" id={`ao-detail-${order._id}`}>

                            {/* Quick actions */}
                            <div className="ao-actions">
                              {proofUrl && (
                                <button className="ao-btn ao-btn--dark" onClick={() => setLightbox(proofUrl)}>Ver comprobante</button>
                              )}
                              {!isApproved && (
                                <button
                                  className="ao-btn ao-btn--primary"
                                  disabled={updating === order._id}
                                  onClick={async () => {
                                    if (proofUrl) { verifyOrder(order); return; }
                                    const ok = await confirm({
                                      title: '¿Aprobar el pago manualmente?',
                                      message: 'El pedido no tiene comprobante adjunto. Confirmá solo si ya verificaste el cobro.',
                                      confirmLabel: 'Aprobar pago',
                                    });
                                    if (ok) updateOrder(order._id, { paymentStatus: 'approved' });
                                  }}
                                >
                                  {updating === order._id ? 'Procesando...' : (proofUrl ? 'Aprobar pago' : 'Aprobar manual')}
                                </button>
                              )}
                              {wa && (
                                <a href={wa} target="_blank" rel="noreferrer" className="ao-btn ao-btn--wa">WhatsApp</a>
                              )}
                              <button className="ao-btn ao-btn--ghost" onClick={() => copyOrder(order)}>
                                {copied === order._id ? 'Copiado!' : 'Copiar datos'}
                              </button>
                            </div>

                            {/* Status selectors */}
                            <div className="ao-selectors">
                              <div className="ao-sel-group">
                                <label className="ao-sel-lbl" htmlFor={`ao-pay-${order._id}`}>Estado pago</label>
                                <select
                                  id={`ao-pay-${order._id}`}
                                  className="ao-sel"
                                  value={order.paymentStatus || 'pending'}
                                  onChange={e => updateOrder(order._id, { paymentStatus: e.target.value })}
                                >
                                  {PAYMENT_OPTS.map(s => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
                                </select>
                              </div>
                              <div className="ao-sel-group">
                                <label className="ao-sel-lbl" htmlFor={`ao-ship-${order._id}`}>Estado envío</label>
                                <select
                                  id={`ao-ship-${order._id}`}
                                  className="ao-sel"
                                  value={order.shippingStatus || 'pending'}
                                  onChange={e => updateOrder(order._id, { shippingStatus: e.target.value })}
                                >
                                  {SHIPPING_OPTS.map(s => <option key={s} value={s}>{SHIPPING_LABELS[s]}</option>)}
                                </select>
                              </div>
                              <div className="ao-sel-group ao-sel-group--track">
                                <label className="ao-sel-lbl" htmlFor={`ao-track-${order._id}`}>N° seguimiento</label>
                                <div className="ao-track-row">
                                  <input
                                    id={`ao-track-${order._id}`}
                                    className="ao-sel ao-track-inp"
                                    type="text"
                                    placeholder="Código de tracking"
                                    value={trackInputs[order._id] ?? (order.trackingNumber || '')}
                                    onChange={e => setTrackInputs(p => ({ ...p, [order._id]: e.target.value }))}
                                  />
                                  <button
                                    className="ao-btn ao-btn--sm"
                                    onClick={() => {
                                      const val = (trackInputs[order._id] ?? '').trim();
                                      if (val) updateOrder(order._id, { trackingNumber: val });
                                    }}
                                  >OK</button>
                                </div>
                              </div>
                            </div>

                            {/* Customer info */}
                            <div className="ao-info">
                              {order.customerDni && <div className="ao-info-item"><span className="ao-info-k">DNI</span><span className="ao-info-v">{order.customerDni}</span></div>}
                              {order.customerEmail && <div className="ao-info-item"><span className="ao-info-k">Email</span><span className="ao-info-v">{order.customerEmail}</span></div>}
                              {order.customerPhone && <div className="ao-info-item"><span className="ao-info-k">Tel</span><span className="ao-info-v">{order.customerPhone}</span></div>}
                              <div className="ao-info-item"><span className="ao-info-k">Dirección</span><span className="ao-info-v">{order.shippingAddress || '—'}</span></div>
                              <div className="ao-info-item"><span className="ao-info-k">Envío</span><span className="ao-info-v">{SHIP_METHOD_MAP[order.shippingMethod] || order.shippingMethod || '—'}</span></div>
                              {order.notes && <div className="ao-info-item ao-info-item--note"><span className="ao-info-k">Notas</span><span className="ao-info-v">{order.notes}</span></div>}
                              <div className="ao-info-item"><span className="ao-info-k">Fecha</span><span className="ao-info-v">{formatDate(order.createdAt)}</span></div>
                              <div className="ao-info-item"><span className="ao-info-k">ID</span><span className="ao-info-v ao-info-mono">{order._id}</span></div>
                            </div>

                            {/* Items */}
                            <div className="ao-items-section">
                              <div className="ao-items-head">Productos del pedido</div>
                              <div className="ao-items-list">
                                {(order.items || []).map((it, i) => {
                                  const itemTotal = it.bundleTotal
                                    ? Number(it.bundleTotal)
                                    : (Number(it.price) || 0) * (Number(it.quantity) || 1);
                                  const hasDiscount = it.compareAtPrice && Number(it.compareAtPrice) > itemTotal;
                                  const saving = hasDiscount ? Number(it.compareAtPrice) - itemTotal : 0;
                                  return (
                                    <div key={i} className="ao-item-card">
                                      {it.imageUrl && (
                                        <img src={it.imageUrl} alt={it.name} className="ao-item-img" />
                                      )}
                                      <div className="ao-item-body">
                                        <div className="ao-item-name">{it.name || '—'}</div>
                                        {it.gifts?.length > 0 && (
                                          <div className="ao-item-gifts">
                                            🎁 <span>{it.gifts.join(' + ')}</span>
                                          </div>
                                        )}
                                        <div className="ao-item-meta">
                                          <span className="ao-item-pill">x{it.quantity} ud</span>
                                          <span className="ao-item-uprice">{money(it.price)} c/u</span>
                                          {hasDiscount && (
                                            <span className="ao-item-pill ao-item-pill--save">Ahorrás {money(saving)}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="ao-item-prices">
                                        {hasDiscount && (
                                          <span className="ao-item-was">{money(it.compareAtPrice)}</span>
                                        )}
                                        <span className="ao-item-total">{money(itemTotal)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="ao-item-footer">
                                <span>Total del pedido</span>
                                <span className="ao-item-grand">{money(order.totalAmount)}</span>
                              </div>
                            </div>

                          </div>
                        )}
                      </article>
                    );
                  })}
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

      <style>{`
/* ======= ADMIN ORDERS — LIGHT THEME ======= */
.ao-page{padding:24px 0 80px;color:#1e293b;background:#f8fafc;min-height:100vh}
.ao-wrap{max-width:960px;margin:0 auto;padding:0 16px}

/* Header */
.ao-header{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-bottom:24px}
.ao-badge{display:inline-block;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe}
.ao-title{margin:6px 0 0;font-size:1.6rem;font-weight:900;letter-spacing:-.03em;color:#0f172a}

/* Tabs */
.ao-tabs{display:flex;gap:6px}
.ao-tab{padding:8px 16px;border-radius:10px;font-size:.85rem;font-weight:700;border:1px solid #e2e8f0;background:transparent;color:#64748b;cursor:pointer;transition:all .15s}
.ao-tab:hover{background:#f1f5f9}
.ao-tab--on{background:#fff;color:#0f172a;border-color:#cbd5e1;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.ao-tab--warn.ao-tab--on{background:#fefce8;color:#a16207;border-color:#fde047}
.ao-tab-count{font-size:.72rem;padding:1px 6px;border-radius:999px;background:#e2e8f0;color:#475569;margin-left:4px}
.ao-tab-count--warn{background:#fef08a;color:#a16207}

/* Stats */
.ao-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:20px}
.ao-stat{padding:14px 12px 12px;border-radius:12px;text-align:center;border:1px solid #e2e8f0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);position:relative;overflow:hidden}
.ao-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--ao-stat-bar,#94a3b8);border-radius:12px 12px 0 0}
.ao-stat-icon{font-size:1.15rem;margin-bottom:6px;line-height:1}
.ao-stat-val{font-size:1.2rem;font-weight:900}
.ao-stat-lbl{font-size:.68rem;font-weight:700;color:#64748b;margin-top:3px;text-transform:uppercase;letter-spacing:.04em}
.ao-st--green .ao-stat-val{color:#16a34a}
.ao-st--yellow .ao-stat-val{color:#ca8a04}
.ao-st--muted .ao-stat-val{color:#64748b}
.ao-st--blue .ao-stat-val{color:#2563eb}
.ao-st--red .ao-stat-val{color:#dc2626}
.ao-btn--danger{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.ao-btn--danger:hover{background:#fee2e2}

/* Search bar */
.ao-bar{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.ao-search:focus-visible{border-color:#0f172a;box-shadow:0 0 0 3px rgba(15,23,42,.12)}
.ao-search{flex:1 1 220px;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:.88rem;font-weight:600;outline:none;transition:border .15s;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.ao-search:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}
.ao-search::placeholder{color:#94a3b8;font-weight:500}
.ao-filter{flex:0 1 170px;padding:10px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:.85rem;font-weight:600}

/* Buttons */
.ao-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:all .15s;text-decoration:none;white-space:nowrap}
.ao-btn--primary{background:#6366f1;color:#fff}
.ao-btn--primary:hover{background:#4f46e5}
.ao-btn--dark{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0}
.ao-btn--dark:hover{background:#e2e8f0}
.ao-btn--ghost{background:transparent;color:#475569;border:1px solid #e2e8f0}
.ao-btn--ghost:hover{background:#f1f5f9;color:#1e293b}
.ao-btn--wa{background:#25D366;color:#fff}
.ao-btn--wa:hover{background:#1fb855}
.ao-btn--sm{padding:6px 10px;font-size:.78rem}

/* Order list */
.ao-list{display:flex;flex-direction:column;gap:10px}
.ao-empty{text-align:center;padding:40px 20px;color:#64748b;font-weight:600;font-size:.9rem}
.ao-empty--err{color:#b91c1c}
.ao-empty p{margin:0 0 12px}
.ao-empty p:last-child{margin:0}
.ao-empty .ao-btn{display:inline-flex}

/* Order card */
.ao-card{border-radius:14px;border:1px solid #e2e8f0;background:#fff;overflow:hidden;transition:border-color .15s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.ao-card--open{border-color:#a5b4fc}

/* Row header */
.ao-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;cursor:pointer;gap:12px;transition:background .1s;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:left}
.ao-row:focus-visible{outline:2px solid #0f172a;outline-offset:-2px}
.ao-row:hover{background:#f8fafc}
.ao-row-left{flex:1;min-width:0}
.ao-row-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ao-name{font-weight:800;font-size:.95rem;color:#0f172a}
.ao-met{font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:6px;background:#f1f5f9;color:#475569}
.ao-met--mp{background:#e0f2fe;color:#0369a1}
.ao-met--cod{background:#dcfce7;color:#15803d}
.ao-met--tf{background:#f1f5f9;color:#475569}
.ao-extra{font-size:.62rem;font-weight:800;padding:2px 6px;border-radius:999px;background:#ede9fe;color:#7c3aed}
.ao-row-mid{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.ao-price{font-weight:900;font-size:.95rem;color:#0f172a}
.ao-sep{color:#cbd5e1;font-size:.7rem}
.ao-items{color:#475569;font-size:.78rem;font-weight:600}
.ao-date{color:#64748b;font-size:.75rem}

/* Status badges */
.ao-row-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
.ao-status,.ao-ship{font-size:.68rem;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.03em}
.ao-ps--pending{background:#fefce8;color:#a16207}
.ao-ps--proof_uploaded{background:#dbeafe;color:#1d4ed8}
.ao-ps--approved,.ao-ps--confirmed{background:#dcfce7;color:#15803d}
.ao-ps--rejected,.ao-ps--cancelled{background:#fef2f2;color:#dc2626}
.ao-ss--pending{background:#f1f5f9;color:#475569}
.ao-ss--shipped{background:#dbeafe;color:#1d4ed8}
.ao-ss--delivered{background:#dcfce7;color:#15803d}
.ao-ss--cancelled{background:#fef2f2;color:#dc2626}
.ao-arrow{font-size:.65rem;color:#94a3b8}

/* Detail panel */
.ao-detail{border-top:1px solid #e2e8f0;padding:16px;background:#f8fafc}

/* Actions row */
.ao-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}

/* Status selectors */
.ao-selectors{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;padding:12px;border-radius:10px;background:#fff;border:1px solid #e2e8f0}
.ao-sel-group{flex:1 1 140px;min-width:0}
.ao-sel-group--track{flex:1 1 200px}
.ao-sel-lbl{display:block;font-size:.68rem;font-weight:700;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
.ao-sel{width:100%;padding:8px 10px;border-radius:8px;background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;font-size:.82rem;font-weight:600}
.ao-track-row{display:flex;gap:6px}
.ao-track-inp{flex:1}

/* Info grid */
.ao-info{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:16px;padding:12px;border-radius:10px;background:#fff;border:1px solid #e2e8f0}
.ao-info-item{display:flex;gap:8px;font-size:.82rem;align-items:baseline}
.ao-info-item--note{grid-column:1/-1}
.ao-info-k{color:#64748b;font-weight:700;white-space:nowrap;min-width:55px}
.ao-info-v{color:#1e293b;font-weight:600;word-break:break-word}
.ao-info-mono{font-family:monospace;font-size:.75rem;color:#64748b}

/* Items section */
.ao-items-section{border-top:1px solid #e2e8f0;padding-top:12px}
.ao-items-head{font-size:.68rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.ao-items-list{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}
.ao-item-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.ao-item-img{width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;flex-shrink:0}
.ao-item-body{flex:1;min-width:0}
.ao-item-name{font-weight:700;font-size:.88rem;color:#1e293b;line-height:1.3;margin-bottom:5px}
.ao-item-gifts{font-size:.75rem;color:#059669;font-weight:600;margin-bottom:5px}
.ao-item-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.ao-item-pill{font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:999px;background:#f1f5f9;color:#475569}
.ao-item-pill--save{background:#dcfce7;color:#15803d}
.ao-item-uprice{font-size:.73rem;color:#64748b;font-weight:600}
.ao-item-prices{text-align:right;flex-shrink:0}
.ao-item-was{display:block;font-size:.7rem;font-weight:700;color:#94a3b8;text-decoration:line-through}
.ao-item-total{display:block;font-weight:900;font-size:.95rem;color:#16a34a}
.ao-item-footer{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:.88rem;color:#475569;font-weight:600}
.ao-item-grand{font-weight:900;font-size:1.1rem;color:#0f172a}

/* ====== Abandoned carts ====== */
.ao-abandon-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;padding:20px;border-radius:14px;border:1px solid #fde68a;background:#fefce8}
.ao-abandon-title{margin:0;font-size:1.15rem;font-weight:900;color:#92400e}
.ao-abandon-sub{margin:4px 0 0;font-size:.82rem;color:#78716c}

.ao-cart-toggle{display:flex;align-items:center;gap:8px;font-size:.82rem;color:#475569;cursor:pointer;white-space:nowrap;padding:0 10px}
.ao-cart-toggle input{accent-color:#6366f1;width:16px;height:16px;cursor:pointer}

.ao-cart-card{display:flex;flex-direction:column;gap:12px;padding:16px 18px;border-radius:14px;border:1px solid #e2e8f0;background:#fff;transition:border-color .15s,box-shadow .15s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.ao-cart-card:hover{border-color:#cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,.08)}
.ao-cart-card--done{opacity:.55}

.ao-cart-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.ao-cart-head-left{flex:1;min-width:0}
.ao-cart-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
.ao-cart-name{font-weight:900;font-size:1rem;color:#0f172a}
.ao-cart-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:.65rem;font-weight:800;letter-spacing:.03em;text-transform:uppercase}
.ao-cart-badge--hot{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.ao-cart-badge--done{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.ao-cart-badge--contact{background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe}
.ao-cart-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:.75rem;color:#64748b}
.ao-cart-meta strong{color:#1e293b;font-weight:700}
.ao-cart-sep{color:#cbd5e1}
.ao-cart-ago{font-weight:700;color:#64748b}
.ao-cart-ago--hot{color:#dc2626}
.ao-cart-head-right{text-align:right;flex-shrink:0}
.ao-cart-total{font-weight:900;font-size:1.15rem;color:#16a34a;line-height:1.1}
.ao-cart-items-count{font-size:.72rem;color:#64748b;margin-top:2px}

.ao-cart-contact{display:flex;flex-wrap:wrap;gap:8px}
.ao-cart-chip{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:.78rem;color:#334155}
.ao-cart-chip a{color:#2563eb;text-decoration:none}
.ao-cart-chip a:hover{text-decoration:underline}

.ao-cart-expand{align-self:flex-start;background:none;border:none;color:#6366f1;font-size:.78rem;font-weight:700;cursor:pointer;padding:4px 0}
.ao-cart-expand:hover{color:#4f46e5}
.ao-cart-items-box{padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0}

.ao-cart-actions{display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid #e2e8f0}
.ao-muted{color:#94a3b8;font-size:.8rem;padding:8px 10px}

/* Lightbox */
.ao-lb{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}
.ao-lb-inner{max-width:800px;width:100%;text-align:center}
.ao-lb-img{max-width:100%;max-height:82vh;border-radius:10px;box-shadow:0 0 40px rgba(0,0,0,.4)}
.ao-lb-actions{display:flex;gap:10px;justify-content:center;margin-top:14px}

/* Mobile */
@media(max-width:768px){
  .ao-wrap{padding:0 12px}
  .ao-page{padding:16px 0 60px}
  .ao-tabs{width:100%}
  .ao-tab{flex:1;text-align:center;padding:8px 10px;font-size:.8rem}
}
@media(max-width:640px){
  .ao-header{flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:16px}
  .ao-title{font-size:1.3rem}
  .ao-stats{grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:14px}
  .ao-stat{padding:10px 8px}
  .ao-stat-val{font-size:1rem}
  .ao-stat-lbl{font-size:.6rem}
  .ao-bar{flex-direction:column;gap:6px;margin-bottom:14px}
  .ao-filter{flex:0 0 auto;width:100%}
  .ao-search{flex:0 0 auto;width:100%} /* en columna, flex-basis 220px se volvía alto */
  .ao-selectors{flex-direction:column;gap:8px;padding:10px}
  .ao-info{grid-template-columns:1fr;padding:10px}
  .ao-row{flex-direction:column;align-items:flex-start;gap:8px;padding:12px}
  .ao-row-right{flex-direction:row;flex-wrap:wrap;align-self:stretch;align-items:center;justify-content:flex-start}
  .ao-actions{gap:6px}
  .ao-actions .ao-btn{flex:1 1 calc(50% - 4px);justify-content:center;font-size:.78rem;padding:8px 10px}
  .ao-abandon-header{flex-direction:column;padding:14px;gap:10px}
  .ao-abandon-title{font-size:1rem}
  .ao-cart-card{padding:12px}
  .ao-cart-header{flex-direction:column;gap:8px}
  .ao-cart-head-right{text-align:left;align-self:stretch;display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px dashed #e2e8f0}
  .ao-cart-actions{gap:6px}
  .ao-cart-actions .ao-btn{flex:1 1 calc(50% - 4px);justify-content:center;font-size:.75rem;padding:7px 8px}
  .ao-cart-toggle{padding:8px 0}
  .ao-detail{padding:12px}
}
@media(max-width:420px){
  .ao-stats{grid-template-columns:repeat(2,1fr)}
  .ao-name{font-size:.88rem}
  .ao-price{font-size:.88rem}
  .ao-cart-name{font-size:.9rem}
  .ao-cart-total{font-size:1rem}
}
      `}</style>
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
