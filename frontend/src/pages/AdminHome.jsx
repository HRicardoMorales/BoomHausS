// frontend/src/pages/AdminHome.jsx
import { Link } from 'react-router-dom';
import { getStoredAuth } from '../utils/auth';

// ✅ Las landings se leen del registro central — no hay que tocar este archivo
// para agregar/quitar landings, solo editás src/landings/index.js
import { LANDING_META } from '../landings/index.js';

const STATUS_STYLES = {
  active:  { label: 'Activa',  bg: 'rgba(16,185,129,.10)', border: 'rgba(16,185,129,.25)', color: '#065f46' },
  draft:   { label: 'Borrador', bg: 'rgba(245,158,11,.10)', border: 'rgba(245,158,11,.25)', color: '#78350f' },
  paused:  { label: 'Pausada', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.25)', color: '#475569' },
};

const ADMIN_LINKS = [
  {
    title: 'Productos',
    desc: 'Precio, imágenes, título, stock y slug de cada producto.',
    href: '/admin/products',
    cta: 'Editar productos',
    emoji: '🛍️',
  },
  {
    title: 'Pedidos',
    desc: 'Ver pedidos, estados (MP / contra entrega) y gestión.',
    href: '/admin/orders',
    cta: 'Ver pedidos',
    emoji: '📦',
  },
];

export default function AdminHome() {
  const { user } = getStoredAuth();

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1050 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <h1 style={{ margin: 0, letterSpacing: '-0.05em' }}>Panel BoomHausS</h1>
            <div className="muted" style={{ marginTop: 6, fontWeight: 900 }}>
              Logueado como: <span style={{ color: 'rgba(11,18,32,.9)' }}>{user?.email}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost" to="/public">Ver home público</Link>
            <Link className="btn btn-primary" to="/admin/orders">Ir a pedidos</Link>
          </div>
        </div>

        {/* ── Landing Pages ───────────────────────────────────── */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
              Landing Pages
            </h2>
            <div className="muted" style={{ fontSize: '.88rem', fontWeight: 900 }}>
              Para agregar una nueva → <code style={{ background: 'rgba(11,92,255,.08)', padding: '2px 6px', borderRadius: 6 }}>src/landings/index.js</code>
            </div>
          </div>

          <div className="adminHomeGrid">
            {LANDING_META.map((lp) => {
              const st = STATUS_STYLES[lp.status] || STATUS_STYLES.draft;
              return (
                <div key={lp.slug} className="card" style={{ padding: '1.15rem', borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>{lp.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 1100, fontSize: '1.02rem', letterSpacing: '-0.02em' }}>{lp.name}</div>
                        <code style={{ fontSize: '.78rem', color: 'rgba(11,18,32,.52)', fontWeight: 900 }}>/lp/{lp.slug}</code>
                      </div>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      fontSize: '.75rem', fontWeight: 1100, padding: '4px 10px', borderRadius: 999,
                      background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div className="muted" style={{ fontWeight: 850, lineHeight: 1.45, fontSize: '.9rem' }}>{lp.desc}</div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <Link
                      to={`/lp/${lp.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 14px', borderRadius: 10, fontWeight: 1100, fontSize: '.88rem',
                        background: 'var(--primary)', color: '#fff', textDecoration: 'none',
                      }}
                    >
                      Abrir landing →
                    </Link>
                    <Link
                      to="/admin/products"
                      style={{
                        padding: '8px 14px', borderRadius: 10, fontWeight: 900, fontSize: '.88rem',
                        background: 'rgba(11,18,32,.06)', color: 'rgba(11,18,32,.78)', textDecoration: 'none',
                      }}
                    >
                      Editar producto
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Card: cómo agregar una nueva landing */}
            <div className="card" style={{
              padding: '1.15rem', borderRadius: 18,
              border: '2px dashed rgba(11,92,255,.18)',
              background: 'rgba(11,92,255,.03)',
              display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center',
            }}>
              <div style={{ fontWeight: 1100, fontSize: '1.02rem' }}>➕ Nueva landing</div>
              <div className="muted" style={{ fontWeight: 850, lineHeight: 1.5, fontSize: '.9rem' }}>
                <ol style={{ margin: '6px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Copiá <code>src/landings/porta-cepillos.js</code></li>
                  <li>Renombralo con el slug nuevo (ej: <code>consola-retro.js</code>)</li>
                  <li>Editá los textos, imágenes y bullets</li>
                  <li>Registralo en <code>src/landings/index.js</code></li>
                  <li>Creá el producto en el admin con el mismo slug</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ── Admin Links ─────────────────────────────────────── */}
        <section style={{ marginTop: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', letterSpacing: '-0.03em' }}>Administración</h2>
          <div className="adminHomeGrid">
            {ADMIN_LINKS.map((c) => (
              <Link
                key={c.href}
                to={c.href}
                className="card"
                style={{ padding: '1.15rem', textDecoration: 'none', borderRadius: 18, transition: 'transform .15s ease, box-shadow .15s ease' }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.4rem' }}>{c.emoji}</span>
                  <div style={{ fontWeight: 1100, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{c.title}</div>
                </div>
                <div className="muted" style={{ fontWeight: 850, lineHeight: 1.45 }}>{c.desc}</div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <span className="badge">Acceso rápido</span>
                  <span style={{ fontWeight: 1100, color: 'var(--primary)' }}>{c.cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <style>{`
          .adminHomeGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media (max-width: 900px) {
            .adminHomeGrid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </main>
  );
}