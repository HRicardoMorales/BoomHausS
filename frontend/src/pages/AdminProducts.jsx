import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
}

function sanitizeSlug(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ _id: '', slug: '', name: '', description: '', price: '', compareAtPrice: '', imagesText: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [search, setSearch] = useState('');

  const selected = useMemo(() => products.find((p) => p._id === selectedId) || null, [products, selectedId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
  }, [products, search]);

  function hydrate(p) {
    const images = Array.isArray(p?.images) ? p.images : [];
    setForm({
      _id: p?._id || '', slug: p?.slug || '', name: p?.name || '',
      description: p?.description || '', price: p?.price ?? '', compareAtPrice: p?.compareAtPrice ?? '',
      imagesText: images.join('\n'), category: p?.category || '',
    });
  }

  async function fetchAll() {
    setLoading(true); setError('');
    try {
      const res = await api.get('/products/all');
      const arr = Array.isArray(res?.data?.data || res?.data) ? (res?.data?.data || res?.data) : [];
      setProducts(arr);
      if (arr.length && !selectedId) { setSelectedId(arr[0]._id); hydrate(arr[0]); }
      if (!arr.length) { setSelectedId(''); hydrate({}); }
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los productos');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => { if (selected) hydrate(selected); }, [selectedId]);

  function flash(msg) { setOk(msg); setTimeout(() => setOk(''), 2200); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError(''); setOk('');
    try {
      const payload = {
        slug: sanitizeSlug(form.slug), name: String(form.name || '').trim(),
        description: String(form.description || '').trim(),
        price: Number(form.price) || 0, compareAtPrice: Number(form.compareAtPrice) || 0,
        images: String(form.imagesText || '').split('\n').map(s => s.trim()).filter(Boolean),
        category: String(form.category || 'general').trim(),
      };
      if (!payload.slug) throw new Error('Falta slug');
      if (!payload.name) throw new Error('Falta nombre');
      if (!payload.price) throw new Error('Falta precio');
      if (form._id) await api.patch(`/products/${form._id}`, payload);
      else await api.post('/products', payload);
      flash('Guardado correctamente');
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!form._id) return;
    if (!window.confirm(`Eliminar "${form.name}"? Esta accion no se puede deshacer.`)) return;
    setDeleting(true); setError('');
    try {
      await api.delete(`/products/${form._id}`);
      flash('Producto eliminado');
      setSelectedId('');
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Error al eliminar');
    } finally { setDeleting(false); }
  }

  const hasChanges = useMemo(() => {
    if (!selected) return true;
    return form.name !== (selected.name || '') || form.slug !== (selected.slug || '') ||
      String(form.price) !== String(selected.price ?? '') ||
      String(form.compareAtPrice) !== String(selected.compareAtPrice ?? '') ||
      form.description !== (selected.description || '') ||
      form.imagesText !== (selected.images || []).join('\n') ||
      (form.category || '') !== (selected.category || '');
  }, [form, selected]);

  const discount = useMemo(() => {
    const p = Number(form.price) || 0;
    const c = Number(form.compareAtPrice) || 0;
    if (c > p && p > 0) return Math.round(((c - p) / c) * 100);
    return 0;
  }, [form.price, form.compareAtPrice]);

  const imageList = useMemo(() => form.imagesText.split('\n').map(s => s.trim()).filter(Boolean), [form.imagesText]);

  if (loading) return (
    <main className="section"><div className="container" style={{ maxWidth: 1100 }}>
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>...</div>
        <div className="muted" style={{ fontWeight: 900 }}>Cargando productos</div>
      </div>
    </div></main>
  );

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1150 }}>
        <style>{`
          .ap-grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; margin-top: 18px; }
          @media (max-width: 900px) { .ap-grid { grid-template-columns: 1fr !important; } }
          .ap-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          @media (max-width: 600px) { .ap-form-grid { grid-template-columns: 1fr !important; } }
          .ap-prod-btn { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; border: 1.5px solid rgba(148,163,184,.18); background: transparent; cursor: pointer; transition: all .15s; }
          .ap-prod-btn:hover { background: rgba(11,92,255,.04); }
          .ap-prod-btn.active { border-color: var(--primary); background: rgba(11,92,255,.06); }
          .ap-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: #f0f4ff; flex-shrink: 0; display: grid; place-items: center; overflow: hidden; }
          .ap-inp { width: 100%; padding: 10px 12px; border: 1.5px solid rgba(148,163,184,.25); border-radius: 8px; font-size: 14px; font-weight: 600; background: #fff; color: #1a1a1a; outline: none; transition: border-color .15s; box-sizing: border-box; font-family: inherit; }
          .ap-inp:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(11,92,255,.08); }
          .ap-inp::placeholder { color: #aaa; font-weight: 400; }
          .ap-label { font-size: 12px; font-weight: 800; color: #666; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .04em; }
          .ap-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
          .ap-preview img { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0; }
          .ap-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px; }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.04em' }}>Productos</h1>
            <div className="muted" style={{ fontWeight: 800, marginTop: 4, fontSize: 13 }}>
              {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="btn btn-ghost" to="/admin" style={{ fontSize: 13 }}>Panel</Link>
            <button className="btn btn-ghost" onClick={fetchAll} style={{ fontSize: 13 }}>Recargar</button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', fontWeight: 700, fontSize: 13, color: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 900, fontSize: 16 }}>x</button>
          </div>
        )}
        {ok && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.06)', fontWeight: 700, fontSize: 13, color: '#059669' }}>
            {ok}
          </div>
        )}

        <div className="ap-grid">
          {/* Left: Product list */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="ap-inp" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap' }} onClick={() => { setSelectedId(''); hydrate({ _id: '' }); }}>
                + Nuevo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map(p => {
                const thumb = p.images?.[0];
                const isActive = selectedId === p._id;
                return (
                  <button key={p._id} type="button" className={`ap-prod-btn ${isActive ? 'active' : ''}`} onClick={() => setSelectedId(p._id)}>
                    <div className="ap-thumb">
                      {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, color: '#bbb' }}>img</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>/lp/{p.slug}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{money(p.price)}</div>
                      {p.compareAtPrice > 0 && p.compareAtPrice > p.price && (
                        <div style={{ fontSize: 10, color: '#aaa', textDecoration: 'line-through' }}>{money(p.compareAtPrice)}</div>
                      )}
                    </div>
                  </button>
                );
              })}
              {!filtered.length && <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13, fontWeight: 600 }}>Sin resultados</div>}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="card" style={{ padding: '20px', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{form._id ? 'Editar producto' : 'Nuevo producto'}</div>
                {form.slug && (
                  <a href={`/lp/${sanitizeSlug(form.slug)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
                    /lp/{sanitizeSlug(form.slug)}
                  </a>
                )}
              </div>
              {hasChanges && <span className="ap-badge" style={{ background: 'rgba(245,158,11,.1)', color: '#d97706', border: '1px solid rgba(245,158,11,.25)' }}>Sin guardar</span>}
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ap-form-grid">
                <div>
                  <span className="ap-label">Nombre</span>
                  <input className="ap-inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" />
                </div>
                <div>
                  <span className="ap-label">Slug (URL)</span>
                  <input className="ap-inp" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="mi-producto" />
                </div>
              </div>

              <div>
                <span className="ap-label">Categoría</span>
                <select className="ap-inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">general</option>
                  <option value="gorros">gorros</option>
                  <option value="accesorios">accesorios</option>
                  <option value="inflables">inflables</option>
                  <option value="ruido">ruido</option>
                  <option value="hogar">hogar</option>
                  <option value="kits">kits</option>
                  <option value="mundial">mundial</option>
                  <option value="otro">otro</option>
                </select>
              </div>

              <div>
                <span className="ap-label">Descripcion</span>
                <textarea className="ap-inp" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion corta para la landing" style={{ resize: 'vertical' }} />
              </div>

              <div className="ap-form-grid">
                <div>
                  <span className="ap-label">Precio actual (ARS)</span>
                  <input className="ap-inp" inputMode="numeric" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="29800" style={{ fontSize: 18, fontWeight: 900 }} />
                </div>
                <div>
                  <span className="ap-label">Precio anterior (tachado)</span>
                  <input className="ap-inp" inputMode="numeric" value={form.compareAtPrice} onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))} placeholder="53300" />
                  {discount > 0 && (
                    <span className="ap-badge" style={{ background: 'rgba(16,185,129,.1)', color: '#059669', border: '1px solid rgba(16,185,129,.25)', marginTop: 6 }}>
                      -{discount}% descuento
                    </span>
                  )}
                </div>
              </div>

              {/* Price preview */}
              {Number(form.price) > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>Asi se ve:</span>
                  {Number(form.compareAtPrice) > Number(form.price) && (
                    <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 14 }}>{money(form.compareAtPrice)}</span>
                  )}
                  <span style={{ fontWeight: 900, fontSize: 20, color: '#1a1a1a' }}>{money(form.price)}</span>
                  {discount > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>-{discount}%</span>}
                </div>
              )}

              <div>
                <span className="ap-label">Imagenes (1 URL por linea)</span>
                <textarea className="ap-inp" rows={4} value={form.imagesText} onChange={e => setForm(f => ({ ...f, imagesText: e.target.value }))} placeholder={"https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg"} style={{ resize: 'vertical', fontSize: 12 }} />
                {imageList.length > 0 && (
                  <div className="ap-preview">
                    {imageList.map((url, i) => <img key={i} src={url} alt={`img ${i + 1}`} onError={e => { e.target.style.display = 'none'; }} />)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {form._id && (
                  <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={deleting} style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,.25)', fontSize: 13 }}>
                    {deleting ? '...' : 'Eliminar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
