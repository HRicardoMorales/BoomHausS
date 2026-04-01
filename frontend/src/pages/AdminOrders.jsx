// frontend/src/pages/AdminOrders.jsx

import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return '—'; }
}

function relativeTime(d) {
  if (!d) return '';
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (isNaN(mins) || mins < 0) return '';
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.round(mins / 60)}h`;
  return `hace ${Math.round(mins / 1440)}d`;
}

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${BASE_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
};

const PAYMENT_LABELS = { pending: 'Pendiente', proof_uploaded: 'Comprobante', approved: 'Aprobado', confirmed: 'Confirmado', rejected: 'Rechazado', cancelled: 'Cancelado' };
const SHIPPING_LABELS = { pending: 'Pendiente', shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado' };
const PAYMENT_OPTS = Object.keys(PAYMENT_LABELS);
const SHIPPING_OPTS = Object.keys(SHIPPING_LABELS);

const METHOD_MAP = {
  mercadopago: { label: 'Mercado Pago', ico: 'ao-met--mp' },
  cod: { label: 'Contra entrega', ico: 'ao-met--cod' },
  transfer: { label: 'Transferencia', ico: 'ao-met--tf' },
};

const SHIP_METHOD_MAP = {
  caba_cod: 'CABA · pago al recibir',
  correo_argentino: 'Correo Argentino',
  retiro_oficina: 'Retiro en oficina',
};

export default function AdminOrders() {
  const [tab, setTab] = useState('orders');

  // Orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [copied, setCopied] = useState(null);
  const [trackInputs, setTrackInputs] = useState({});

  // Abandoned
  const [carts, setCarts] = useState([]);
  const [loadingCarts, setLoadingCarts] = useState(false);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'abandoned') fetchCarts();
  }, [tab]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.data?.ok) setOrders((res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { setError('Error al cargar pedidos'); }
    finally { setLoading(false); }
  }

  async function fetchCarts() {
    try {
      setLoadingCarts(true);
      const res = await api.get('/abandoned-carts');
      setCarts(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch { /* silent */ }
    finally { setLoadingCarts(false); }
  }

  async function updateOrder(id, changes) {
    try {
      setUpdating(id);
      const res = await api.patch(`/orders/${id}`, changes);
      if (res.data?.ok) {
        const u = res.data.data;
        setOrders(prev => prev.map(o => o._id === u._id ? u : o));
      }
    } catch { alert('Error al actualizar'); }
    finally { setUpdating(null); }
  }

  async function verifyOrder(order) {
    try {
      setUpdating(order._id);
      const res = await api.patch(`/orders/${order._id}/verify`);
      if (res.data?.ok && res.data.data) setOrders(prev => prev.map(o => o._id === res.data.data._id ? res.data.data : o));
      else fetchOrders();
    } catch { alert('Error verificando'); }
    finally { setUpdating(null); }
  }

  async function recoverCart(id) {
    if (!window.confirm('¿Marcar como recuperado/descartado?')) return;
    try { await api.post(`/abandoned-carts/${id}/recover`); fetchCarts(); }
    catch { alert('Error al actualizar'); }
  }

  function copyOrder(order) {
    const lines = [
      `Pedido: ${order._id}`,
      `Cliente: ${order.customerName || '—'}`,
      order.customerPhone ? `Tel: ${order.customerPhone}` : '',
      order.customerEmail ? `Email: ${order.customerEmail}` : '',
      order.customerDni ? `DNI: ${order.customerDni}` : '',
      `Dirección: ${order.shippingAddress || '—'}`,
      `Envío: ${SHIP_METHOD_MAP[order.shippingMethod] || order.shippingMethod || '—'}`,
      `Método pago: ${METHOD_MAP[order.paymentMethod]?.label || order.paymentMethod || '—'}`,
      '',
      ...(order.items || []).map(it => `  ${it.quantity}x ${it.name} — ${money(it.price * it.quantity)}`),
      '',
      `Total: ${money(order.totalAmount)}`,
      order.notes ? `Notas: ${order.notes}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => { setCopied(order._id); setTimeout(() => setCopied(null), 1500); });
  }

  function waLink(order) {
    if (!order.customerPhone) return null;
    let ph = order.customerPhone.replace(/\D/g, '');
    if (!ph.startsWith('54')) ph = '549' + ph.replace(/^549/, '');
    const msg = `Hola ${order.customerName || ''}! Te escribo de BoomHausS sobre tu pedido del ${formatDate(order.createdAt)}. ${(order.items || []).map(it => `${it.quantity}x ${it.name}`).join(', ')}. Total: ${money(order.totalAmount)}`;
    return `https://wa.me/${ph}?text=${encodeURIComponent(msg)}`;
  }

  function cartWaLink(cart) {
    if (!cart.phone) return null;
    let ph = cart.phone.replace(/\D/g, '');
    if (!ph.startsWith('54')) ph = '549' + ph;
    const msg = `Hola ${cart.name || ''}! Te escribo de BoomHausS. Vi que estabas por comprar ${cart.items?.[0]?.name || 'el producto'} pero no finalizaste. ¿Tuviste algún problema? Avisame y te ayudo.`;
    return `https://wa.me/${ph}?text=${encodeURIComponent(msg)}`;
  }

  // Computed
  const stats = useMemo(() => {
    const total = orders.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);
    const approved = orders.filter(o => ['approved', 'confirmed'].includes(o.paymentStatus)).length;
    const review = orders.filter(o => o.paymentStatus === 'proof_uploaded').length;
    const pending = orders.filter(o => o.paymentStatus === 'pending').length;
    const shipped = orders.filter(o => o.shippingStatus === 'shipped').length;
    const delivered = orders.filter(o => o.shippingStatus === 'delivered').length;
    return { total, approved, review, pending, shipped, delivered };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filter !== 'todos' && o.paymentStatus !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [o._id, o.customerName, o.customerEmail, o.customerPhone, o.customerDni, ...(o.items || []).map(i => i.name)]
        .some(f => (f || '').toLowerCase().includes(q));
    });
  }, [orders, filter, search]);

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
                Abandonados {carts.length > 0 && <span className="ao-tab-count ao-tab-count--warn">{carts.length}</span>}
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
                    { label: 'Recaudado', value: money(stats.total), cls: 'ao-st--green' },
                    { label: 'Aprobados', value: stats.approved, cls: 'ao-st--green' },
                    { label: 'A revisar', value: stats.review, cls: 'ao-st--yellow' },
                    { label: 'Pendientes', value: stats.pending, cls: 'ao-st--muted' },
                    { label: 'En camino', value: stats.shipped, cls: 'ao-st--blue' },
                    { label: 'Entregados', value: stats.delivered, cls: 'ao-st--green' },
                  ].map(s => (
                    <div key={s.label} className={`ao-stat ${s.cls}`}>
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
                <button className="ao-btn ao-btn--ghost" onClick={fetchOrders} title="Recargar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                </button>
              </div>

              {/* Order list */}
              {loading ? (
                <div className="ao-empty">Cargando pedidos...</div>
              ) : error ? (
                <div className="ao-empty ao-empty--err">{error}</div>
              ) : !filtered.length ? (
                <div className="ao-empty">No se encontraron pedidos</div>
              ) : (
                <div className="ao-list">
                  {filtered.map(order => {
                    const open = expanded === order._id;
                    const proofUrl = getImageUrl(order.paymentProofUrl);
                    const isApproved = ['approved', 'confirmed'].includes(order.paymentStatus);
                    const met = METHOD_MAP[order.paymentMethod] || { label: order.paymentMethod || 'Otro', ico: '' };
                    const wa = waLink(order);

                    return (
                      <article key={order._id} className={`ao-card ${open ? 'ao-card--open' : ''}`}>

                        {/* Row header */}
                        <div className="ao-row" onClick={() => setExpanded(open ? null : order._id)}>
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
                            <span className="ao-arrow">{open ? '\u25B2' : '\u25BC'}</span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {open && (
                          <div className="ao-detail">

                            {/* Quick actions */}
                            <div className="ao-actions">
                              {proofUrl && (
                                <button className="ao-btn ao-btn--dark" onClick={() => setLightbox(proofUrl)}>Ver comprobante</button>
                              )}
                              {!isApproved && (
                                <button
                                  className="ao-btn ao-btn--primary"
                                  disabled={updating === order._id}
                                  onClick={() => {
                                    if (proofUrl) verifyOrder(order);
                                    else if (window.confirm('¿Aprobar pago manualmente?')) updateOrder(order._id, { paymentStatus: 'approved' });
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
                                <label className="ao-sel-lbl">Estado pago</label>
                                <select
                                  className="ao-sel"
                                  value={order.paymentStatus || 'pending'}
                                  onChange={e => updateOrder(order._id, { paymentStatus: e.target.value })}
                                >
                                  {PAYMENT_OPTS.map(s => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
                                </select>
                              </div>
                              <div className="ao-sel-group">
                                <label className="ao-sel-lbl">Estado envío</label>
                                <select
                                  className="ao-sel"
                                  value={order.shippingStatus || 'pending'}
                                  onChange={e => updateOrder(order._id, { shippingStatus: e.target.value })}
                                >
                                  {SHIPPING_OPTS.map(s => <option key={s} value={s}>{SHIPPING_LABELS[s]}</option>)}
                                </select>
                              </div>
                              <div className="ao-sel-group ao-sel-group--track">
                                <label className="ao-sel-lbl">N° seguimiento</label>
                                <div className="ao-track-row">
                                  <input
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
                              <div className="ao-items-head">Productos</div>
                              {(order.items || []).map((it, i) => (
                                <div key={i} className="ao-item-row">
                                  <div className="ao-item-left">
                                    <span className="ao-item-name">{it.name || '—'}</span>
                                    <span className="ao-item-qty">x{it.quantity} · {money(it.price)} c/u</span>
                                  </div>
                                  <span className="ao-item-total">{money(it.price * it.quantity)}</span>
                                </div>
                              ))}
                              <div className="ao-item-footer">
                                <span>Total</span>
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
          {tab === 'abandoned' && (
            <>
              <div className="ao-abandon-header">
                <div>
                  <h2 className="ao-abandon-title">Recuperación de ventas</h2>
                  <p className="ao-abandon-sub">Personas que dejaron datos pero no pagaron. Contactalos por WhatsApp.</p>
                </div>
                <button className="ao-btn ao-btn--ghost" onClick={fetchCarts}>Actualizar</button>
              </div>

              {loadingCarts ? (
                <div className="ao-empty">Cargando...</div>
              ) : !carts.length ? (
                <div className="ao-empty">Sin carritos abandonados pendientes</div>
              ) : (
                <div className="ao-list">
                  {carts.map(cart => {
                    const wa = cartWaLink(cart);
                    const dateSource = cart.updatedAt || cart.createdAt || new Date();
                    const ago = relativeTime(dateSource);
                    const mins = Math.round((Date.now() - new Date(dateSource).getTime()) / 60000);
                    const hot = !isNaN(mins) && mins < 60;

                    return (
                      <div key={cart._id} className="ao-cart-card">
                        <div className="ao-cart-left">
                          <div className="ao-cart-top">
                            <span className="ao-cart-name">{cart.name || 'Sin nombre'}</span>
                            <span className={`ao-cart-ago ${hot ? 'ao-cart-ago--hot' : ''}`}>{ago || '—'}</span>
                          </div>
                          <div className="ao-cart-items">{(cart.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || '—'}</div>
                          <div className="ao-cart-total">{money(cart.totalAmount)}</div>
                        </div>
                        <div className="ao-cart-actions">
                          {wa ? (
                            <a href={wa} target="_blank" rel="noreferrer" className="ao-btn ao-btn--wa">Rescatar</a>
                          ) : (
                            <span className="ao-muted">Sin tel</span>
                          )}
                          <button className="ao-btn ao-btn--ghost" onClick={() => recoverCart(cart._id)}>Listo</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div className="ao-lb" onClick={() => setLightbox(null)}>
          <div className="ao-lb-inner" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="Comprobante" className="ao-lb-img" />
            <div className="ao-lb-actions">
              <button className="ao-btn ao-btn--dark" onClick={() => setLightbox(null)}>Cerrar</button>
              <a href={lightbox} target="_blank" rel="noreferrer" className="ao-btn ao-btn--primary">Abrir original</a>
            </div>
          </div>
        </div>
      )}

      <style>{`
/* ======= ADMIN ORDERS ======= */
.ao-page{padding:24px 0 80px}
.ao-wrap{max-width:960px;margin:0 auto;padding:0 16px}

/* Header */
.ao-header{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-bottom:24px}
.ao-badge{display:inline-block;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2)}
.ao-title{margin:6px 0 0;font-size:1.6rem;font-weight:900;letter-spacing:-.03em}

/* Tabs */
.ao-tabs{display:flex;gap:6px}
.ao-tab{padding:8px 16px;border-radius:10px;font-size:.85rem;font-weight:700;border:1px solid rgba(255,255,255,.1);background:transparent;color:#888;cursor:pointer;transition:all .15s}
.ao-tab:hover{background:rgba(255,255,255,.05)}
.ao-tab--on{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.18)}
.ao-tab--warn.ao-tab--on{background:rgba(234,179,8,.12);color:#facc15;border-color:rgba(234,179,8,.25)}
.ao-tab-count{font-size:.72rem;padding:1px 6px;border-radius:999px;background:rgba(255,255,255,.1);margin-left:4px}
.ao-tab-count--warn{background:rgba(234,179,8,.2);color:#facc15}

/* Stats */
.ao-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:20px}
.ao-stat{padding:14px 12px;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
.ao-stat-val{font-size:1.2rem;font-weight:900}
.ao-stat-lbl{font-size:.68rem;font-weight:700;color:#666;margin-top:2px;text-transform:uppercase;letter-spacing:.04em}
.ao-st--green .ao-stat-val{color:#4ade80}
.ao-st--yellow .ao-stat-val{color:#facc15}
.ao-st--muted .ao-stat-val{color:#94a3b8}
.ao-st--blue .ao-stat-val{color:#60a5fa}

/* Search bar */
.ao-bar{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.ao-search{flex:1 1 220px;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:.88rem;font-weight:600;outline:none;transition:border .15s}
.ao-search:focus{border-color:rgba(255,255,255,.25)}
.ao-search::placeholder{color:#555;font-weight:500}
.ao-filter{flex:0 1 170px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-size:.85rem;font-weight:600}

/* Buttons */
.ao-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:all .15s;text-decoration:none;white-space:nowrap}
.ao-btn--primary{background:#6366f1;color:#fff}
.ao-btn--primary:hover{background:#4f46e5}
.ao-btn--dark{background:rgba(255,255,255,.08);color:#ccc;border:1px solid rgba(255,255,255,.1)}
.ao-btn--dark:hover{background:rgba(255,255,255,.12)}
.ao-btn--ghost{background:transparent;color:#888;border:1px solid rgba(255,255,255,.1)}
.ao-btn--ghost:hover{background:rgba(255,255,255,.05);color:#bbb}
.ao-btn--wa{background:#25D366;color:#fff}
.ao-btn--wa:hover{background:#1fb855}
.ao-btn--sm{padding:6px 10px;font-size:.78rem}

/* Order list */
.ao-list{display:flex;flex-direction:column;gap:10px}
.ao-empty{text-align:center;padding:40px 20px;color:#666;font-weight:600;font-size:.9rem}
.ao-empty--err{color:#f87171}

/* Order card */
.ao-card{border-radius:14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);overflow:hidden;transition:border-color .15s}
.ao-card--open{border-color:rgba(99,102,241,.3)}

/* Row header */
.ao-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;cursor:pointer;gap:12px;transition:background .1s}
.ao-row:hover{background:rgba(255,255,255,.02)}
.ao-row-left{flex:1;min-width:0}
.ao-row-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ao-name{font-weight:800;font-size:.95rem}
.ao-met{font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,.06);color:#999}
.ao-met--mp{background:rgba(0,158,227,.1);color:#38bdf8}
.ao-met--cod{background:rgba(16,185,129,.1);color:#34d399}
.ao-met--tf{background:rgba(148,163,184,.1);color:#94a3b8}
.ao-extra{font-size:.62rem;font-weight:800;padding:2px 6px;border-radius:999px;background:rgba(167,139,250,.1);color:#a78bfa}
.ao-row-mid{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.ao-price{font-weight:900;font-size:.95rem}
.ao-sep{color:#444;font-size:.7rem}
.ao-items{color:#777;font-size:.78rem;font-weight:600}
.ao-date{color:#555;font-size:.75rem}

/* Status badges */
.ao-row-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
.ao-status,.ao-ship{font-size:.68rem;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.03em}
.ao-ps--pending{background:rgba(250,204,21,.1);color:#facc15}
.ao-ps--proof_uploaded{background:rgba(96,165,250,.12);color:#60a5fa}
.ao-ps--approved,.ao-ps--confirmed{background:rgba(74,222,128,.1);color:#4ade80}
.ao-ps--rejected,.ao-ps--cancelled{background:rgba(248,113,113,.1);color:#f87171}
.ao-ss--pending{background:rgba(148,163,184,.08);color:#64748b}
.ao-ss--shipped{background:rgba(96,165,250,.1);color:#60a5fa}
.ao-ss--delivered{background:rgba(74,222,128,.1);color:#4ade80}
.ao-ss--cancelled{background:rgba(248,113,113,.08);color:#f87171}
.ao-arrow{font-size:.65rem;color:#555}

/* Detail panel */
.ao-detail{border-top:1px solid rgba(255,255,255,.06);padding:16px;background:rgba(0,0,0,.15)}

/* Actions row */
.ao-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}

/* Status selectors */
.ao-selectors{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;padding:12px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}
.ao-sel-group{flex:1 1 140px;min-width:0}
.ao-sel-group--track{flex:1 1 200px}
.ao-sel-lbl{display:block;font-size:.68rem;font-weight:700;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
.ao-sel{width:100%;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.08);font-size:.82rem;font-weight:600}
.ao-track-row{display:flex;gap:6px}
.ao-track-inp{flex:1}

/* Info grid */
.ao-info{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:16px;padding:12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ao-info-item{display:flex;gap:8px;font-size:.82rem;align-items:baseline}
.ao-info-item--note{grid-column:1/-1}
.ao-info-k{color:#666;font-weight:700;white-space:nowrap;min-width:55px}
.ao-info-v{color:#ccc;font-weight:600;word-break:break-word}
.ao-info-mono{font-family:monospace;font-size:.75rem;color:#888}

/* Items section */
.ao-items-section{border-top:1px solid rgba(255,255,255,.06);padding-top:12px}
.ao-items-head{font-size:.68rem;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.ao-item-row{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.04);margin-bottom:4px}
.ao-item-left{min-width:0}
.ao-item-name{font-weight:700;font-size:.85rem;display:block}
.ao-item-qty{font-size:.73rem;color:#777}
.ao-item-total{font-weight:800;font-size:.88rem;color:#4ade80;flex-shrink:0}
.ao-item-footer{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:.88rem;color:#999}
.ao-item-grand{font-weight:900;font-size:1.05rem;color:#fff}

/* ====== Abandoned carts ====== */
.ao-abandon-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;padding:20px;border-radius:14px;border:1px solid rgba(234,179,8,.15);background:rgba(234,179,8,.04)}
.ao-abandon-title{margin:0;font-size:1.15rem;font-weight:900}
.ao-abandon-sub{margin:4px 0 0;font-size:.82rem;color:#888}
.ao-cart-card{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);flex-wrap:wrap}
.ao-cart-left{flex:1;min-width:0}
.ao-cart-top{display:flex;align-items:center;gap:8px}
.ao-cart-name{font-weight:800;font-size:.95rem}
.ao-cart-ago{font-size:.75rem;font-weight:700;color:#666}
.ao-cart-ago--hot{color:#f87171}
.ao-cart-items{font-size:.82rem;color:#888;margin-top:2px}
.ao-cart-total{font-weight:900;font-size:.9rem;color:#4ade80;margin-top:4px}
.ao-cart-actions{display:flex;gap:8px;flex-shrink:0}
.ao-muted{color:#555;font-size:.8rem}

/* Lightbox */
.ao-lb{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}
.ao-lb-inner{max-width:800px;width:100%;text-align:center}
.ao-lb-img{max-width:100%;max-height:82vh;border-radius:10px;box-shadow:0 0 40px rgba(0,0,0,.6)}
.ao-lb-actions{display:flex;gap:10px;justify-content:center;margin-top:14px}

/* Mobile */
@media(max-width:640px){
  .ao-header{flex-direction:column;align-items:flex-start}
  .ao-stats{grid-template-columns:repeat(3,1fr)}
  .ao-bar{flex-direction:column}
  .ao-filter{flex:1}
  .ao-selectors{flex-direction:column}
  .ao-info{grid-template-columns:1fr}
  .ao-row{flex-direction:column;align-items:flex-start;gap:8px}
  .ao-row-right{flex-direction:row;flex-wrap:wrap}
}
      `}</style>
    </>
  );
}
