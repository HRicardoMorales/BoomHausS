import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Admin simple para manejar múltiples landings (1 producto = 1 landing)

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num);
}

function sanitizeSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const DEFAULTS = [
  {
    slug: 'porta-cepillos',
    name: 'Porta Cepillos + Dispenser + UV',
    description: 'Más higiene todos los días. Fácil de instalar. Ideal para familia.',
    price: 29800,
    compareAtPrice: 53300,
    images: [],
  },
  {
    slug: 'retro-console',
    name: 'Consola Retro M15',
    description: 'Plug & Play. HDMI. Dos joysticks. Diversión asegurada.',
    price: 31800,
    compareAtPrice: 42600,
    images: [],
  },
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    _id: '',
    slug: '',
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    imagesText: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const selected = useMemo(() => products.find((p) => p._id === selectedId) || null, [products, selectedId]);

  function hydrate(p) {
    const images = Array.isArray(p?.images) ? p.images : [];
    setForm({
      _id: p?._id || '',
      slug: p?.slug || '',
      name: p?.name || '',
      description: p?.description || '',
      price: p?.price ?? '',
      compareAtPrice: p?.compareAtPrice ?? '',
      imagesText: images.join('\n'),
    });
  }

  async function fetchAll() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products/all');
      const list = res?.data?.data || res?.data || [];
      const arr = Array.isArray(list) ? list : [];
      setProducts(arr);
      if (arr.length && !selectedId) setSelectedId(arr[0]._id);
      if (!arr.length) {
        setSelectedId('');
        hydrate({ _id: '', ...DEFAULTS[0] });
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }

  // auto-seed (si no hay productos)
  async function seedDefaultsIfEmpty() {
    try {
      const res = await api.get('/products/all');
      const list = res?.data?.data || res?.data || [];
      const arr = Array.isArray(list) ? list : [];
      if (arr.length) return;

      for (const d of DEFAULTS) {
        try {
          await api.post('/products', { ...d, slug: d.slug });
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {}
  }

  useEffect(() => {
    (async () => {
      await seedDefaultsIfEmpty();
      await fetchAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) hydrate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      const payload = {
        slug: sanitizeSlug(form.slug),
        name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        price: Number(form.price) || 0,
        compareAtPrice: Number(form.compareAtPrice) || 0,
        images: String(form.imagesText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (!payload.slug) throw new Error('Falta slug');
      if (!payload.name) throw new Error('Falta nombre');
      if (!payload.price) throw new Error('Falta precio');

      if (form._id) {
        await api.patch(`/products/${form._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setOk('Guardado ✅');
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Error al guardar');
    } finally {
      setSaving(false);
      setTimeout(() => setOk(''), 1600);
    }
  }

  if (loading) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="card" style={{ padding: '1.2rem' }}>
            <div className="muted" style={{ fontWeight: 900 }}>Cargando…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, letterSpacing: '-0.03em' }}>Landings</h1>
            <div className="muted" style={{ fontWeight: 850, marginTop: 6 }}>
              1 producto = 1 landing. El slug define la URL: <b>/lp/&lt;slug&gt;</b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost" to="/admin">← Panel</Link>
            <button className="btn btn-ghost" onClick={fetchAll}>🔄 Recargar</button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ marginTop: 14, padding: '12px', border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)' }}>
            <b style={{ color: '#ef4444' }}>⚠️ {error}</b>
          </div>
        )}

        {ok && (
          <div className="card" style={{ marginTop: 14, padding: '12px', border: '1px solid rgba(16,185,129,.35)', background: 'rgba(16,185,129,.08)' }}>
            <b style={{ color: '#10b981' }}>{ok}</b>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18, marginTop: 16 }} className="admin-grid">
          {/* LISTA */}
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 1000 }}>Tus landings</div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedId('');
                  hydrate({ _id: '', ...DEFAULTS[0] });
                }}
              >
                + Nueva
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {products.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedId(p._id)}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 14,
                    border: selectedId === p._id ? '1px solid rgba(11,92,255,.45)' : '1px solid rgba(148,163,184,.22)',
                    background: selectedId === p._id ? 'rgba(11,92,255,.08)' : 'rgba(255,255,255,.03)',
                  }}
                >
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontWeight: 1000, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div className="muted" style={{ fontWeight: 850, fontSize: '.88rem' }}>/lp/{p.slug}</div>
                  </div>
                  <div style={{ fontWeight: 1000 }}>{money(p.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* EDITOR */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 1100 }}>Editar landing</div>
                <div className="muted" style={{ fontWeight: 850, marginTop: 4 }}>
                  Link: {form.slug ? (
                    <a href={`/lp/${sanitizeSlug(form.slug)}`} target="_blank" rel="noreferrer">
                      /lp/{sanitizeSlug(form.slug)}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ marginTop: 14, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                  Slug (URL)
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="porta-cepillos" />
                </label>

                <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                  Nombre
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" />
                </label>
              </div>

              <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                Descripción (sale en la landing)
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Texto corto, claro, sin mucho." />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                  Precio actual
                  <input inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="29800" />
                </label>
                <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                  Precio anterior (tachado)
                  <input inputMode="numeric" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="53300" />
                </label>
              </div>

              <label className="muted" style={{ display: 'grid', gap: 6, fontWeight: 900 }}>
                Imágenes (1 URL por línea)
                <textarea rows={5} value={form.imagesText} onChange={(e) => setForm((f) => ({ ...f, imagesText: e.target.value }))} placeholder="https://...\nhttps://..." />
              </label>

              <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>

        <style>{`
          @media (max-width: 980px){
            .admin-grid{ grid-template-columns: 1fr !important; }
            .form-grid{ grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </main>
  );
}
