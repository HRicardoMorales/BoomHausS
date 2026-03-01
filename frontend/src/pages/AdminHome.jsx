import { Link } from 'react-router-dom';
import { getStoredAuth } from '../utils/auth';

export default function AdminHome() {
  const { user } = getStoredAuth();

  const cards = [
    {
      title: 'Landing: Porta Cepillos',
      desc: 'Abrir la landing pública (ads).',
      href: '/lp/porta-cepillos',
      cta: 'Abrir landing',
    },
    {
      title: 'Landing: Consola Retro',
      desc: 'Abrir la landing pública (ads).',
      href: '/lp/consola-retro',
      cta: 'Abrir landing',
    },
    {
      title: 'Editar productos (landing)',
      desc: 'Precio, imágenes, título, stock, etc.',
      href: '/admin/products',
      cta: 'Editar',
    },
    {
      title: 'Pedidos',
      desc: 'Ver pedidos y estados (MP / contra entrega).',
      href: '/admin/orders',
      cta: 'Ver pedidos',
    },
  ];

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1050 }}>
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

        <div
          className="adminHomeGrid"
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 14,
          }}
        >
          {cards.map((c) => (
            <Link
              key={c.href}
              to={c.href}
              className="card"
              style={{
                padding: '1.15rem',
                textDecoration: 'none',
                borderRadius: 18,
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
            >
              <div style={{ fontWeight: 1100, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{c.title}</div>
              <div className="muted" style={{ marginTop: 6, fontWeight: 850, lineHeight: 1.45 }}>{c.desc}</div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <span className="badge">Acceso rápido</span>
                <span style={{ fontWeight: 1100, color: 'var(--primary)' }}>{c.cta} →</span>
              </div>
            </Link>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px){
            .adminHomeGrid{ grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </main>
  );
}
