import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoredAuth } from '../utils/auth';
import { LANDING_META } from '../landings/index.js';
import api from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function money(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#6366f1', fill = 'rgba(99,102,241,.1)', height = 68 }) {
  if (!values || values.length < 2) return <div style={{ height }} />;
  const W = 280, H = height, pad = 4;
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: +(pad + (i / (n - 1)) * (W - pad * 2)).toFixed(2),
    y: +(H - pad - (v / max) * (H - pad * 2)).toFixed(2),
  }));
  const lineStr = pts.map(p => `L${p.x},${p.y}`).join(' ');
  const areaPath = `M${pts[0].x},${H - pad} ${lineStr} L${pts[n - 1].x},${H - pad} Z`;
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <path d={areaPath} fill={fill} />
      <polyline points={polyPts} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n - 1].x} cy={pts[n - 1].y} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Status badge for payments list ──────────────────────────────────────────
const STATUS_BADGE_STYLES = {
  success: { bg: '#dcfce7', color: '#166534' },
  pending: { bg: '#fef3c7', color: '#92400e' },
  failed:  { bg: '#fee2e2', color: '#991b1b' },
};
function StatusBadge({ status, label }) {
  const s = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── % change badge ───────────────────────────────────────────────────────────
function Change({ pct }) {
  if (pct === 0 || pct == null) return null;
  const up = pct > 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#16a34a' : '#dc2626', background: up ? '#f0fdf4' : '#fef2f2', borderRadius: 6, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

// ─── Landing status styles ────────────────────────────────────────────────────
const LP_STATUS = {
  active: { label: 'Activa',   bg: 'rgba(16,185,129,.10)', border: 'rgba(16,185,129,.25)', color: '#065f46' },
  draft:  { label: 'Borrador', bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)',  color: '#78350f' },
  paused: { label: 'Pausada',  bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.25)', color: '#475569' },
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 22, r = 8, mb = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite', marginBottom: mb }} />;
}

const RANGES = [
  { key: 'hoy',  label: 'Hoy' },
  { key: '7d',   label: '7 días' },
  { key: '30d',  label: '30 días' },
  { key: 'mes',  label: 'Este mes' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminHome() {
  const { user } = getStoredAuth();
  const [range, setRange]   = useState('7d');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/metrics/kpis?range=${range}`),
      api.get(`/metrics/chart?range=${range}`),
      api.get(`/metrics/payments?range=${range}`),
    ]).then(([kRes, cRes, pRes]) => {
      if (!cancelled) {
        setData({
          kpis:     kRes.data,
          chart:    cRes.data,
          payments: pRes.data.payments || [],
        });
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setError('No se pudieron cargar las métricas.');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [range]);

  const kpis     = data?.kpis;
  const chart    = data?.chart;
  const payments = data?.payments || [];

  const todayStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="adm-page">

      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <div className="adm-brand">Amelor</div>
          <div className="adm-date">{todayStr}</div>
        </div>
        <div className="adm-header-right">
          <span className="adm-user-tag">{user?.email}</span>
          <div className="adm-header-btns">
            <Link className="adm-btn adm-btn--ghost" to="/public">Ver tienda</Link>
            <Link className="adm-btn adm-btn--dark" to="/admin/orders">Gestión de ventas →</Link>
          </div>
        </div>
      </div>

      {/* ── Range selector ── */}
      <div className="adm-range-bar">
        {RANGES.map(r => (
          <button
            key={r.key}
            className={`adm-range-btn${range === r.key ? ' adm-range-btn--active' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <div className="adm-error-bar">{error}</div>}

      {/* ── KPI cards ── */}
      <div className="adm-grid-4" style={{ marginTop: 14 }}>
        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w="55%" h={13} />
              <Skel w="70%" h={28} r={6} />
              <Skel w="45%" h={11} />
            </div>
          ))
        ) : [
          { label: 'Ventas',      value: money(kpis?.ventas),          change: kpis?.ventas_change,            icon: '💰', accent: '#16a34a', sub: 'Pagos aprobados' },
          { label: 'Iniciados',   value: kpis?.pagos_iniciados ?? 0,   change: kpis?.pagos_iniciados_change,   icon: '🛒', accent: '#2563eb', sub: 'Pedidos abiertos' },
          { label: 'Completados', value: kpis?.pagos_completados ?? 0, change: kpis?.pagos_completados_change, icon: '✅', accent: '#7c3aed', sub: 'Pagos confirmados' },
          { label: 'Conversión',  value: `${kpis?.conversion ?? 0}%`,  change: null,                           icon: '📊', accent: '#111827', sub: 'Iniciados → pagados' },
        ].map(c => (
          <div key={c.label} className="adm-card adm-metric-card">
            <div className="adm-metric-top">
              <span className="adm-metric-icon">{c.icon}</span>
              <span className="adm-metric-lbl">{c.label}</span>
            </div>
            <div className="adm-metric-val" style={{ color: c.accent }}>{c.value}</div>
            <div className="adm-metric-sub">
              <span>{c.sub}</span>
              {c.change != null && <Change pct={c.change} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Status pills ── */}
      <div className="adm-grid-4" style={{ marginTop: 10 }}>
        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="adm-card adm-status-card">
              <Skel w={32} h={32} r={16} mb={8} />
              <Skel w="50%" h={26} r={6} mb={4} />
              <Skel w="65%" h={12} r={4} />
            </div>
          ))
        ) : [
          { label: 'Aprobados',  value: kpis?.pagos_completados ?? 0, accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
          { label: 'A revisar',  value: kpis?.review_count ?? 0,      accent: '#92400e', bg: '#fffbeb', border: '#fde68a', icon: '⚠️' },
          { label: 'Pendientes', value: kpis?.pending_count ?? 0,     accent: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: '⏳' },
          { label: 'En camino',  value: kpis?.shipped_count ?? 0,     accent: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', icon: '🚚' },
        ].map(c => (
          <div key={c.label} className="adm-card adm-status-card" style={{ background: c.bg, borderColor: c.border }}>
            <span className="adm-status-icon">{c.icon}</span>
            <span className="adm-status-val" style={{ color: c.accent }}>{c.value}</span>
            <span className="adm-status-lbl">{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Chart + Recent payments ── */}
      <div className="adm-grid-2" style={{ marginTop: 14 }}>

        {/* Chart */}
        <div className="adm-card">
          {loading ? (
            <>
              <Skel w="55%" h={16} mb={14} />
              <Skel h={96} r={10} mb={10} />
              <Skel w="70%" h={11} />
            </>
          ) : (
            <>
              <div className="adm-card-hdr">
                <span className="adm-card-title">Pedidos completados</span>
                <span className="adm-card-sub">{kpis?.pagos_completados ?? 0} en el período</span>
              </div>
              <div style={{ margin: '14px 0 6px' }}>
                <Sparkline values={chart?.serie_completados || []} color="#6366f1" fill="rgba(99,102,241,.08)" height={72} />
              </div>
              <div className="adm-spark-axis">
                {(chart?.labels || []).length > 0 && (() => {
                  const lbls = chart.labels;
                  return (
                    <>
                      <span>{lbls[0]}</span>
                      {lbls.length > 4 && <span>{lbls[Math.floor(lbls.length / 2)]}</span>}
                      <span>{lbls[lbls.length - 1]}</span>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* Recent payments */}
        <div className="adm-card">
          {loading ? (
            <>
              <Skel w="55%" h={16} mb={14} />
              {[0,1,2,3,4].map(i => <Skel key={i} h={36} r={6} mb={8} />)}
            </>
          ) : (
            <>
              <div className="adm-card-hdr">
                <span className="adm-card-title">Últimos pagos</span>
                <Link to="/admin/orders" className="adm-card-link">Ver todos →</Link>
              </div>
              <div className="adm-recent-list">
                {payments.length === 0 && <div className="adm-empty-hint">Sin pedidos en el período</div>}
                {payments.map(p => (
                  <div key={p.id} className="adm-recent-row">
                    <div className="adm-recent-info">
                      <span className="adm-recent-name">{p.name}</span>
                      <span className="adm-recent-meta">{p.meta}</span>
                    </div>
                    <div className="adm-recent-right">
                      <span className="adm-recent-amount">{p.amount}</span>
                      <StatusBadge status={p.status} label={p.label} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Landing pages ── */}
      <div className="adm-section">
        <div className="adm-section-hdr">
          <span className="adm-section-title">Landing Pages</span>
          <span className="adm-section-hint">Para agregar → <code>src/landings/index.js</code></span>
        </div>
        <div className="adm-grid-3">
          {LANDING_META.map(lp => {
            const st = LP_STATUS[lp.status] || LP_STATUS.draft;
            return (
              <div key={lp.slug} className="adm-card adm-lp-card">
                <div className="adm-lp-top">
                  <div className="adm-lp-info">
                    <span className="adm-lp-emoji">{lp.emoji}</span>
                    <div>
                      <div className="adm-lp-name">{lp.name}</div>
                      <code className="adm-lp-slug">/lp/{lp.slug}</code>
                    </div>
                  </div>
                  <span className="adm-lp-badge" style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>{st.label}</span>
                </div>
                <p className="adm-lp-desc">{lp.desc}</p>
                <div className="adm-lp-actions">
                  <Link to={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--dark adm-btn--sm">Abrir →</Link>
                  <Link to="/admin/products" className="adm-btn adm-btn--ghost adm-btn--sm">Editar producto</Link>
                </div>
              </div>
            );
          })}
          <div className="adm-card adm-lp-card adm-lp-new">
            <div className="adm-lp-new-title">➕ Nueva landing</div>
            <ol className="adm-lp-new-steps">
              <li>Copiá <code>src/landings/porta-cepillos.js</code></li>
              <li>Renombralo con el slug nuevo</li>
              <li>Editá textos e imágenes</li>
              <li>Registralo en <code>src/landings/index.js</code></li>
              <li>Creá el producto en admin con ese slug</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── Quick access ── */}
      <div className="adm-section">
        <div className="adm-section-title" style={{ marginBottom: 12 }}>Administración</div>
        <div className="adm-grid-3">
          {[
            { title: 'Productos', desc: 'Precio, imágenes, stock y configuración de cada producto.', href: '/admin/products', cta: 'Editar productos →', icon: '🛍️' },
            { title: 'Pedidos',   desc: 'Gestión completa: estados de pago, envío y carritos abandonados.', href: '/admin/orders', cta: 'Ver pedidos →', icon: '📦' },
            { title: 'Cupones',   desc: 'Crear, activar y desactivar códigos de descuento.', href: '/admin/coupons', cta: 'Gestionar cupones →', icon: '🏷️' },
          ].map(c => (
            <Link key={c.href} to={c.href} className="adm-card adm-qa-card">
              <span className="adm-qa-icon">{c.icon}</span>
              <span className="adm-qa-title">{c.title}</span>
              <span className="adm-qa-desc">{c.desc}</span>
              <span className="adm-qa-cta">{c.cta}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes adm-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .adm-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 28px 24px 72px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #111827;
          max-width: 1120px;
          margin: 0 auto;
        }

        /* header */
        .adm-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .adm-brand { font-size: 1.45rem; font-weight: 900; letter-spacing: -.04em; color: #111827; margin-bottom: 3px; }
        .adm-date { font-size: 0.82rem; color: #9ca3af; font-weight: 500; text-transform: capitalize; }
        .adm-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .adm-user-tag { font-size: 0.78rem; color: #9ca3af; font-weight: 600; }
        .adm-header-btns { display: flex; gap: 8px; flex-wrap: wrap; }

        /* buttons */
        .adm-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 8px; font-size: .86rem; font-weight: 700; text-decoration: none; cursor: pointer; border: none; transition: all .15s; font-family: inherit; }
        .adm-btn--dark  { background: #111827; color: #fff; }
        .adm-btn--dark:hover { background: #1f2937; }
        .adm-btn--ghost { background: #fff; color: #374151; border: 1px solid #e5e7eb; }
        .adm-btn--ghost:hover { background: #f9fafb; }
        .adm-btn--sm    { padding: 6px 12px; font-size: .8rem; }

        /* range selector */
        .adm-range-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0; }
        .adm-range-btn { padding: 7px 16px; border-radius: 8px; font-size: .84rem; font-weight: 700; border: 1px solid #e5e7eb; background: #fff; color: #6b7280; cursor: pointer; transition: all .15s; font-family: inherit; }
        .adm-range-btn:hover { background: #f9fafb; color: #374151; }
        .adm-range-btn--active { background: #111827; color: #fff; border-color: #111827; }

        /* error */
        .adm-error-bar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 18px; margin-top: 14px; color: #dc2626; font-weight: 700; font-size: .84rem; }

        /* grids */
        .adm-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .adm-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* card */
        .adm-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; }

        /* metric card */
        .adm-metric-card { display: flex; flex-direction: column; gap: 3px; }
        .adm-metric-top  { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
        .adm-metric-icon { font-size: 1rem; line-height: 1; }
        .adm-metric-lbl  { font-size: .72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
        .adm-metric-val  { font-size: 1.55rem; font-weight: 900; letter-spacing: -.035em; line-height: 1; }
        .adm-metric-sub  { font-size: .72rem; color: #9ca3af; font-weight: 600; margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

        /* status card */
        .adm-status-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 12px; text-align: center; border: 1px solid #e5e7eb; gap: 4px; }
        .adm-status-icon { font-size: 1.35rem; line-height: 1; margin-bottom: 4px; }
        .adm-status-val  { font-size: 1.65rem; font-weight: 900; letter-spacing: -.04em; }
        .adm-status-lbl  { font-size: .7rem; color: #6b7280; font-weight: 700; margin-top: 1px; }

        /* chart */
        .adm-card-hdr   { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .adm-card-title { font-size: .92rem; font-weight: 800; color: #111827; }
        .adm-card-sub   { font-size: .78rem; color: #6b7280; font-weight: 600; }
        .adm-card-link  { font-size: .78rem; color: #6366f1; font-weight: 700; text-decoration: none; }
        .adm-card-link:hover { text-decoration: underline; }
        .adm-spark-axis { display: flex; justify-content: space-between; margin-top: 6px; }
        .adm-spark-axis span { font-size: 10px; color: #9ca3af; font-weight: 600; }

        /* recent orders */
        .adm-recent-list   { display: flex; flex-direction: column; margin-top: 14px; }
        .adm-recent-row    { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #f3f4f6; }
        .adm-recent-row:last-child { border-bottom: none; padding-bottom: 0; }
        .adm-recent-info   { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .adm-recent-name   { font-size: .86rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .adm-recent-meta   { font-size: .72rem; color: #9ca3af; font-weight: 600; }
        .adm-recent-right  { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .adm-recent-amount { font-size: .86rem; font-weight: 800; color: #111827; }
        .adm-empty-hint    { font-size: .84rem; color: #9ca3af; font-weight: 600; padding: 16px 0; text-align: center; }

        /* sections */
        .adm-section     { margin-top: 28px; }
        .adm-section-hdr { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
        .adm-section-title { font-size: 1rem; font-weight: 800; color: #111827; letter-spacing: -.02em; }
        .adm-section-hint  { font-size: .78rem; color: #9ca3af; font-weight: 600; }
        .adm-section-hint code { background: rgba(99,102,241,.08); padding: 1px 6px; border-radius: 5px; font-size: .74rem; color: #6366f1; }

        /* landing card */
        .adm-lp-card   { display: flex; flex-direction: column; gap: 8px; }
        .adm-lp-top    { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .adm-lp-info   { display: flex; gap: 10px; align-items: center; }
        .adm-lp-emoji  { font-size: 1.4rem; line-height: 1; }
        .adm-lp-name   { font-size: .92rem; font-weight: 800; color: #111827; }
        .adm-lp-slug   { font-size: .7rem; color: #9ca3af; font-weight: 700; display: block; }
        .adm-lp-badge  { font-size: .68rem; font-weight: 800; padding: 3px 9px; border-radius: 999px; flex-shrink: 0; }
        .adm-lp-desc   { font-size: .8rem; color: #6b7280; font-weight: 600; line-height: 1.45; margin: 0; }
        .adm-lp-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .adm-lp-new    { border: 2px dashed rgba(99,102,241,.2); background: rgba(99,102,241,.02); justify-content: center; }
        .adm-lp-new-title { font-size: .92rem; font-weight: 800; color: #374151; }
        .adm-lp-new-steps { font-size: .8rem; color: #6b7280; font-weight: 600; line-height: 1.75; padding-left: 18px; margin: 8px 0 0; }
        .adm-lp-new-steps code { background: rgba(99,102,241,.08); padding: 1px 5px; border-radius: 4px; font-size: .72rem; color: #6366f1; }

        /* quick access */
        .adm-qa-card { text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 5px; transition: box-shadow .15s, transform .15s; }
        .adm-qa-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.08); transform: translateY(-2px); }
        .adm-qa-icon  { font-size: 1.5rem; margin-bottom: 4px; }
        .adm-qa-title { font-size: .95rem; font-weight: 800; color: #111827; }
        .adm-qa-desc  { font-size: .8rem; color: #6b7280; font-weight: 600; line-height: 1.45; }
        .adm-qa-cta   { font-size: .82rem; font-weight: 800; color: #6366f1; margin-top: 6px; }

        /* responsive */
        @media (max-width: 960px) {
          .adm-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .adm-grid-3 { grid-template-columns: repeat(2, 1fr); }
          .adm-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 580px) {
          .adm-page { padding: 18px 14px 56px; }
          .adm-brand { font-size: 1.2rem; }
          .adm-header-right { align-items: flex-start; }
          .adm-grid-4 { grid-template-columns: repeat(2, 1fr); gap: 9px; }
          .adm-grid-3 { grid-template-columns: 1fr; }
          .adm-metric-val { font-size: 1.3rem; }
          .adm-status-val { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
}
