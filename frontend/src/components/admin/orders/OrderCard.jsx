// frontend/src/components/admin/orders/OrderCard.jsx
// Un pedido del listado del admin: fila resumen (botón que expande) y detalle con
// acciones, estados, datos del cliente y productos. Sin red: las acciones llegan
// por props desde useAdminOrders.

import { useState } from 'react';
import { baseURL as API_BASE_URL } from '../../../services/api';
import {
  money, formatDate, relativeTime, PAYMENT_LABELS, SHIPPING_LABELS, PAYMENT_OPTS, SHIPPING_OPTS,
  METHOD_MAP, SHIP_METHOD_MAP, orderWaLink, orderClipboardText, orderItemTotal,
} from './format.js';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // /uploads lo sirve el backend en la raíz (no bajo /api): origen del backend.
  const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${BASE_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
};

function OrderItem({ it }) {
  const itemTotal = orderItemTotal(it);
  const hasDiscount = it.compareAtPrice && Number(it.compareAtPrice) > itemTotal;
  const saving = hasDiscount ? Number(it.compareAtPrice) - itemTotal : 0;
  return (
    <div className="ao-item-card">
      {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="ao-item-img" loading="lazy" />}
      <div className="ao-item-body">
        <div className="ao-item-name">{it.name || '—'}</div>
        {it.gifts?.length > 0 && (
          <div className="ao-item-gifts">🎁 <span>{it.gifts.join(' + ')}</span></div>
        )}
        <div className="ao-item-meta">
          <span className="ao-item-pill">x{it.quantity} ud</span>
          <span className="ao-item-uprice">{money(it.price)} c/u</span>
          {hasDiscount && <span className="ao-item-pill ao-item-pill--save">Ahorrás {money(saving)}</span>}
        </div>
      </div>
      <div className="ao-item-prices">
        {hasDiscount && <span className="ao-item-was">{money(it.compareAtPrice)}</span>}
        <span className="ao-item-total">{money(itemTotal)}</span>
      </div>
    </div>
  );
}

function InfoItem({ k, children, className = '', mono = false }) {
  return (
    <div className={`ao-info-item ${className}`}>
      <span className="ao-info-k">{k}</span>
      <span className={`ao-info-v ${mono ? 'ao-info-mono' : ''}`}>{children}</span>
    </div>
  );
}

function OrderDetail({ order, busy, onUpdate, onVerify, onViewProof, confirm, notify }) {
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [copied, setCopied] = useState(false);
  const id = order._id;
  const proofUrl = getImageUrl(order.paymentProofUrl);
  const isApproved = order.paymentStatus === 'approved' || order.paymentStatus === 'confirmed';
  const wa = orderWaLink(order);

  async function approve() {
    if (proofUrl) { onVerify(order); return; }
    const ok = await confirm({
      title: '¿Aprobar el pago manualmente?',
      message: 'El pedido no tiene comprobante adjunto. Confirmá solo si ya verificaste el cobro.',
      confirmLabel: 'Aprobar pago',
    });
    if (ok) onUpdate(id, { paymentStatus: 'approved' });
  }

  function copy() {
    navigator.clipboard.writeText(orderClipboardText(order)).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
      () => notify?.('No se pudo copiar al portapapeles.', { tone: 'error' }),
    );
  }

  function saveTracking(e) {
    e.preventDefault();
    const val = tracking.trim();
    if (val && val !== order.trackingNumber) onUpdate(id, { trackingNumber: val });
  }

  return (
    <div className="ao-detail" id={`ao-detail-${id}`}>
      <div className="ao-actions">
        {proofUrl && <button type="button" className="ao-btn ao-btn--dark" onClick={() => onViewProof(proofUrl)}>Ver comprobante</button>}
        {!isApproved && (
          <button type="button" className="ao-btn ao-btn--primary" disabled={busy} onClick={approve}>
            {busy ? 'Procesando...' : (proofUrl ? 'Aprobar pago' : 'Aprobar manual')}
          </button>
        )}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="ao-btn ao-btn--wa">WhatsApp</a>}
        <button type="button" className="ao-btn ao-btn--ghost" onClick={copy}>{copied ? 'Copiado!' : 'Copiar datos'}</button>
      </div>

      <div className="ao-selectors">
        <div className="ao-sel-group">
          <label className="ao-sel-lbl" htmlFor={`ao-pay-${id}`}>Estado pago</label>
          <select id={`ao-pay-${id}`} className="ao-sel" disabled={busy} value={order.paymentStatus || 'pending'}
            onChange={(e) => onUpdate(id, { paymentStatus: e.target.value })}>
            {PAYMENT_OPTS.map((s) => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="ao-sel-group">
          <label className="ao-sel-lbl" htmlFor={`ao-ship-${id}`}>Estado envío</label>
          <select id={`ao-ship-${id}`} className="ao-sel" disabled={busy} value={order.shippingStatus || 'pending'}
            onChange={(e) => onUpdate(id, { shippingStatus: e.target.value })}>
            {SHIPPING_OPTS.map((s) => <option key={s} value={s}>{SHIPPING_LABELS[s]}</option>)}
          </select>
        </div>
        <form className="ao-sel-group ao-sel-group--track" onSubmit={saveTracking}>
          <label className="ao-sel-lbl" htmlFor={`ao-track-${id}`}>N° seguimiento</label>
          <div className="ao-track-row">
            <input id={`ao-track-${id}`} className="ao-sel ao-track-inp" type="text" placeholder="Código de tracking"
              value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <button type="submit" className="ao-btn ao-btn--sm" disabled={busy} aria-label="Guardar número de seguimiento">OK</button>
          </div>
        </form>
      </div>

      <div className="ao-info">
        {order.customerDni && <InfoItem k="DNI">{order.customerDni}</InfoItem>}
        {order.customerEmail && <InfoItem k="Email">{order.customerEmail}</InfoItem>}
        {order.customerPhone && <InfoItem k="Tel">{order.customerPhone}</InfoItem>}
        <InfoItem k="Dirección">{order.shippingAddress || '—'}</InfoItem>
        <InfoItem k="Envío">{SHIP_METHOD_MAP[order.shippingMethod] || order.shippingMethod || '—'}</InfoItem>
        {order.notes && <InfoItem k="Notas" className="ao-info-item--note">{order.notes}</InfoItem>}
        <InfoItem k="Fecha">{formatDate(order.createdAt)}</InfoItem>
        <InfoItem k="ID" mono>{id}</InfoItem>
      </div>

      <div className="ao-items-section">
        <div className="ao-items-head">Productos del pedido</div>
        <div className="ao-items-list">
          {(order.items || []).map((it, i) => <OrderItem key={i} it={it} />)}
        </div>
        <div className="ao-item-footer">
          <span>Total del pedido</span>
          <span className="ao-item-grand">{money(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderCard({ order, open, onToggle, busy, ...actions }) {
  const met = METHOD_MAP[order.paymentMethod] || { label: order.paymentMethod || 'Otro', ico: '' };
  const units = (order.items || []).reduce((a, i) => a + (Number(i.quantity) || 0), 0);

  return (
    <article className={`ao-card ${open ? 'ao-card--open' : ''}`}>
      <button type="button" className="ao-row" aria-expanded={open} aria-controls={`ao-detail-${order._id}`} onClick={onToggle}>
        <div className="ao-row-left">
          <div className="ao-row-top">
            <span className="ao-name">{order.customerName || 'Sin nombre'}</span>
            <span className={`ao-met ${met.ico}`}>{met.label}</span>
            {(order.items?.length || 0) > 1 && <span className="ao-extra">+extras</span>}
          </div>
          <div className="ao-row-mid">
            <span className="ao-price">{money(order.totalAmount)}</span>
            <span className="ao-sep">·</span>
            <span className="ao-items">{units} ud</span>
            <span className="ao-sep">·</span>
            <span className="ao-date">{relativeTime(order.createdAt)}</span>
          </div>
        </div>
        <div className="ao-row-right">
          <span className={`ao-status ao-ps--${order.paymentStatus}`}>{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</span>
          <span className={`ao-ship ao-ss--${order.shippingStatus}`}>{SHIPPING_LABELS[order.shippingStatus] || order.shippingStatus || 'Pendiente'}</span>
          <span className="ao-arrow" aria-hidden="true">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <OrderDetail order={order} busy={busy} {...actions} />}
    </article>
  );
}
