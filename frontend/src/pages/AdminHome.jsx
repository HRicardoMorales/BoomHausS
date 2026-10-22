import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getStoredAuth } from '../utils/auth';
import { LANDING_META } from '../landings/index.js';
import { useAdminMetrics, METRICS_ERROR } from '../hooks/admin/useAdminMetrics.js';
import { RANGES, kpiCards, statusCards } from '../components/admin/home/metrics.js';
import { Change, Sparkline, StatusBadge } from '../components/admin/home/DashboardParts.jsx';
import Skeleton, { SkeletonGroup } from '../components/ui/Skeleton.jsx';
import StatePanel from '../components/ui/StatePanel.jsx';
import './AdminHome.css';

const LP_STATUS = {
  active: { label: 'Activa', tone: 'active' },
  draft: { label: 'Borrador', tone: 'draft' },
  paused: { label: 'Pausada', tone: 'paused' },
};

const QUICK_ACCESS = [
  { title: 'Productos', desc: 'Precio, imágenes, stock y configuración de cada producto.', href: '/admin/products', cta: 'Editar productos', icon: '🛍️' },
  { title: 'Pedidos', desc: 'Gestión completa: estados de pago, envío y carritos abandonados.', href: '/admin/orders', cta: 'Ver pedidos', icon: '📦' },
  { title: 'Cupones', desc: 'Crear, activar y desactivar códigos de descuento.', href: '/admin/coupons', cta: 'Gestionar cupones', icon: '🏷️' },
];

function MetricsSkeleton() {
  return (
    <SkeletonGroup label="Cargando métricas…">
      <div className="adm-grid-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="adm-card adm-skel-card">
            <Skeleton width="55%" height="13px" />
            <Skeleton width="70%" height="28px" />
            <Skeleton width="45%" height="11px" />
          </div>
        ))}
      </div>
      <div className="adm-grid-4 adm-mt-sm">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="adm-card adm-skel-card adm-skel-card--center">
            <Skeleton width="32px" height="32px" radius="50%" />
            <Skeleton width="50%" height="26px" />
          </div>
        ))}
      </div>
      <div className="adm-grid-2 adm-mt">
        <div className="adm-card adm-skel-card">
          <Skeleton width="55%" height="16px" />
          <Skeleton height="96px" radius="10px" />
        </div>
        <div className="adm-card adm-skel-card">
          <Skeleton width="55%" height="16px" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height="36px" radius="6px" />)}
        </div>
      </div>
    </SkeletonGroup>
  );
}

function Metrics({ data }) {
  const { kpis, chart, payments } = data;
  return (
    <>
      <ul className="adm-grid-4 adm-plain" aria-label="Indicadores del período">
        {kpiCards(kpis).map((c) => (
          <li key={c.key} className="adm-card adm-metric-card">
            <span className="adm-metric-lbl">{c.label}</span>
            <span className={`adm-metric-val adm-tone--${c.tone}`}>{c.value}</span>
            <span className="adm-metric-sub">
              <span>{c.sub}</span>
              <Change value={c.change} />
            </span>
          </li>
        ))}
      </ul>

      <ul className="adm-grid-4 adm-plain adm-mt-sm" aria-label="Pedidos por estado">
        {statusCards(kpis).map((c) => (
          <li key={c.key} className={`adm-card adm-status-card adm-status-card--${c.tone}`}>
            <span className="adm-status-val">{c.value}</span>
            <span className="adm-status-lbl">{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="adm-grid-2 adm-mt">
        <section className="adm-card" aria-labelledby="adm-chart-title">
          <div className="adm-card-hdr">
            <h2 id="adm-chart-title" className="adm-card-title">Pedidos completados</h2>
            <span className="adm-card-sub">{kpis.completados} en el período</span>
          </div>
          <Sparkline labels={chart.labels} values={chart.serie} />
        </section>

        <section className="adm-card" aria-labelledby="adm-payments-title">
          <div className="adm-card-hdr">
            <h2 id="adm-payments-title" className="adm-card-title">Últimos pagos</h2>
            <Link to="/admin/orders" className="adm-card-link">Ver todos <span aria-hidden="true">→</span></Link>
          </div>
          {payments.length === 0 ? (
            <p className="adm-empty-hint">Sin pedidos en el período.</p>
          ) : (
            <ul className="adm-recent-list adm-plain">
              {payments.map((p) => (
                <li key={p.id} className="adm-recent-row">
                  <span className="adm-recent-info">
                    <span className="adm-recent-name" title={p.name}>{p.name}</span>
                    {p.meta && <span className="adm-recent-meta">{p.meta}</span>}
                  </span>
                  <span className="adm-recent-right">
                    <span className="adm-recent-amount">{p.amount}</span>
                    <StatusBadge status={p.status} label={p.label} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function AdminHome() {
  const { user } = getStoredAuth();
  const [range, setRange] = useState('7d');
  const { data, error, loading, reload } = useAdminMetrics(range);
  const todayStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="adm-page">
      <header className="adm-header">
        <div>
          <h1 className="adm-brand"><span className="sr-only">Panel de </span>Amelor</h1>
          <p className="adm-date">{todayStr}</p>
        </div>
        <div className="adm-header-right">
          {user?.email && <span className="adm-user-tag">{user.email}</span>}
          <nav className="adm-header-btns" aria-label="Accesos del panel">
            <Link className="adm-btn adm-btn--ghost" to="/public">Ver tienda</Link>
            <Link className="adm-btn adm-btn--dark" to="/admin/orders">Gestión de ventas <span aria-hidden="true">→</span></Link>
          </nav>
        </div>
      </header>

      <section aria-labelledby="adm-metrics-title">
        <div className="adm-metrics-hdr">
          <h2 id="adm-metrics-title" className="adm-section-title">Resumen</h2>
          <div className="adm-range-bar" role="group" aria-label="Período de las métricas">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className="adm-range-btn"
                aria-pressed={range === r.key}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-mt-sm">
          {loading ? (
            <MetricsSkeleton />
          ) : error ? (
            <StatePanel
              tone="error"
              size="inline"
              as="h3"
              title="No pudimos cargar las métricas"
              actions={<button type="button" className="adm-btn adm-btn--dark" onClick={reload}>Reintentar</button>}
            >
              {error !== METRICS_ERROR && `${error} `}Los pedidos siguen disponibles en Gestión de ventas.
            </StatePanel>
          ) : data ? (
            <Metrics data={data} />
          ) : null}
        </div>
      </section>

      <section className="adm-section" aria-labelledby="adm-lp-title">
        <div className="adm-section-hdr">
          <h2 id="adm-lp-title" className="adm-section-title">Landing pages</h2>
          <span className="adm-section-hint">Para agregar → <code>src/landings/index.js</code></span>
        </div>
        <ul className="adm-grid-3 adm-plain">
          {LANDING_META.map((lp) => {
            const st = LP_STATUS[lp.status] || LP_STATUS.draft;
            return (
              <li key={lp.slug} className="adm-card adm-lp-card">
                <div className="adm-lp-top">
                  <div className="adm-lp-info">
                    <span className="adm-lp-emoji" aria-hidden="true">{lp.emoji}</span>
                    <div>
                      <h3 className="adm-lp-name">{lp.name}</h3>
                      <code className="adm-lp-slug">/lp/{lp.slug}</code>
                    </div>
                  </div>
                  <span className={`adm-lp-badge adm-lp-badge--${st.tone}`}>{st.label}</span>
                </div>
                <p className="adm-lp-desc">{lp.desc}</p>
                <div className="adm-lp-actions">
                  <Link to={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--dark adm-btn--sm">
                    Abrir <span className="sr-only">{lp.name} (pestaña nueva)</span><span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/admin/products" className="adm-btn adm-btn--ghost adm-btn--sm">
                    Editar producto<span className="sr-only">: {lp.name}</span>
                  </Link>
                </div>
              </li>
            );
          })}
          <li className="adm-card adm-lp-card adm-lp-new">
            <h3 className="adm-lp-new-title">Nueva landing</h3>
            <ol className="adm-lp-new-steps">
              <li>Copiá <code>src/landings/porta-cepillos.js</code></li>
              <li>Renombralo con el slug nuevo</li>
              <li>Editá textos e imágenes</li>
              <li>Registralo en <code>src/landings/index.js</code></li>
              <li>Creá el producto en admin con ese slug</li>
            </ol>
          </li>
        </ul>
      </section>

      <section className="adm-section" aria-labelledby="adm-qa-title">
        <h2 id="adm-qa-title" className="adm-section-title adm-section-title--spaced">Administración</h2>
        <ul className="adm-grid-3 adm-plain">
          {QUICK_ACCESS.map((c) => (
            <li key={c.href}>
              <Link to={c.href} className="adm-card adm-qa-card">
                <span className="adm-qa-icon" aria-hidden="true">{c.icon}</span>
                <span className="adm-qa-title">{c.title}</span>
                <span className="adm-qa-desc">{c.desc}</span>
                <span className="adm-qa-cta">{c.cta} <span aria-hidden="true">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
