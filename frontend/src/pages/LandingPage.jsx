import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext.jsx';
import MarqueeBar from '../components/marquee.jsx';
import CheckoutDrawer from '../components/CheckoutDrawer.jsx';

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num);
}

const LANDING_CONFIG = {
  'porta-cepillos': {
    badge: 'Higiene + orden en 1 minuto',
    bullets: ['Esteriliza con UV', 'Sin enchastre de pasta', 'Ideal para familia'],
  },
  'consola-retro': {
    badge: 'Volvé a jugar como antes',
    bullets: ['Plug & Play', 'Ideal regalos', 'Horas de nostalgia'],
  },
};

export default function LandingPage() {
  const { slug } = useParams();
  const cfg = LANDING_CONFIG[slug] || null;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [openCheckout, setOpenCheckout] = useState(false);

  const { addItem, items } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/products/slug/${slug}`);
        if (!mounted) return;
        setProduct(res.data?.data || res.data);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'No se encontró el producto.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const heroImg = useMemo(() => {
    const imgs = product?.images || [];
    const first = imgs?.[0];
    return first?.url || first || product?.thumbnail || product?.image || null;
  }, [product]);

  const compare = Number(product?.comparePrice || product?.compareAt || 0);
  const price = Number(product?.price || 0);
  const showCompare = compare > 0 && compare > price;
  const pct = showCompare ? Math.round(((compare - price) / compare) * 100) : 0;

  const handleBuy = () => {
    if (!product) return;
    const already = (items || []).some((it) => String(it.productId) === String(product._id || product.id));
    if (!already) {
      addItem({
        _id: product._id || product.id,
        name: product.title || product.name,
        price: product.price,
        imageUrl: heroImg,
      }, 1);
    }
    setOpenCheckout(true);
  };

  if (!cfg) {
    return (
      <main className="section">
        <div className="container">
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ marginTop: 0 }}>Landing no configurada</h2>
            <p className="muted">Usá /lp/porta-cepillos o /lp/consola-retro</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <MarqueeBar />

      <main className="section" style={{ paddingTop: 18 }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {loading ? (
            <div className="card" style={{ padding: '1.25rem' }}>Cargando…</div>
          ) : error ? (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 1100 }}>⚠️ {error}</div>
            </div>
          ) : (
            <div className="lpGrid">
              <section className="card" style={{ padding: '1.25rem', borderRadius: 22 }}>
                <div className="lpBadge">{cfg.badge}</div>
                <h1 style={{ margin: '10px 0 8px', letterSpacing: '-0.05em' }}>{product?.title}</h1>
                <div className="muted" style={{ fontWeight: 850, lineHeight: 1.6 }}>
                  {product?.description || 'Comprá seguro, rápido y sin vueltas.'}
                </div>

                <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                  {cfg.bullets.map((b) => (
                    <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 900 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.22)', display: 'grid', placeItems: 'center' }}>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  {showCompare && (
                    <div className="muted" style={{ textDecoration: 'line-through', fontWeight: 900 }}>
                      {money(compare)}
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', fontWeight: 1200, letterSpacing: '-0.03em' }}>{money(price)}</div>
                  {showCompare && <span className="lpOff">{pct}% OFF</span>}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBuy}
                  style={{ width: '100%', marginTop: 16, padding: '1.05rem', fontWeight: 1200 }}
                >
                  Comprar ahora
                </button>

                <div className="muted" style={{ marginTop: 10, fontWeight: 850, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span>🔒 Pago seguro</span>
                  <span>•</span>
                  <span>🚚 Envío a todo el país</span>
                  <span>•</span>
                  <span>💵 CABA: pagás al recibir</span>
                </div>
              </section>

              <aside className="card" style={{ padding: '1.1rem', borderRadius: 22 }}>
                <div className="lpMedia">
                  {heroImg ? (
                    <img src={heroImg} alt={product?.title} />
                  ) : (
                    <div style={{ height: 320, display: 'grid', placeItems: 'center', fontWeight: 1000 }}>📦</div>
                  )}
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                  <div className="lpChip">⚡ Checkout sin salir de la página</div>
                  <div className="lpChip">✅ 3 cuotas sin interés (MP)</div>
                  <div className="lpChip">📲 Confirmación por WhatsApp</div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <CheckoutDrawer open={openCheckout} onClose={() => setOpenCheckout(false)} />

      <style>{`
        .lpGrid{
          display:grid;
          grid-template-columns: 1.25fr .85fr;
          gap: 16px;
          align-items: start;
        }
        .lpBadge{
          display:inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 1100;
          border: 1px solid rgba(27,77,62,.20);
          background: rgba(27,77,62,.08);
          color: rgba(11,18,32,.85);
        }
        .lpOff{
          font-size: .9rem;
          font-weight: 1100;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(16,185,129,.25);
          background: rgba(16,185,129,.10);
          color: #065f46;
        }
        .lpMedia{
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(15,23,42,.10);
          background: rgba(241,245,249,.55);
        }
        .lpMedia img{ width: 100%; height: 360px; object-fit: cover; display:block; }
        .lpChip{
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          border: 1px solid rgba(15,23,42,.10);
          background: rgba(255,255,255,.7);
        }
        @media (max-width: 980px){
          .lpGrid{ grid-template-columns: 1fr; }
          .lpMedia img{ height: 320px; }
        }
      `}</style>
    </>
  );
}
