// frontend/src/pages/AdminProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LANDING_CONFIGS, LANDING_META } from '../landings/index';

/* ─── helpers ─── */
function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
}
function sanitizeSlug(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function pct(price, compareAt) {
  const p = Number(price) || 0;
  const c = Number(compareAt) || 0;
  if (c > p && p > 0) return Math.round(((c - p) / c) * 100);
  return 0;
}

/* ─── Find which landing config (and variant) maps to a product slug ─── */
function findLandingForSlug(slug) {
  if (!slug) return null;
  for (const [landingSlug, config] of Object.entries(LANDING_CONFIGS)) {
    if (config.productSlug === slug) {
      return { landingSlug, config, variant: null, rootBundles: config.bundles || null };
    }
    if (Array.isArray(config.variants)) {
      for (const variant of config.variants) {
        if (variant.productSlug === slug) {
          return { landingSlug, config, variant, rootBundles: variant.bundles || null };
        }
      }
    }
  }
  return null;
}

/* ─── Extract images from config (main images array or first storyBlock imgs) ─── */
function extractImages(config) {
  if (Array.isArray(config.images) && config.images.length) return config.images;
  if (Array.isArray(config.storyBlocks)) {
    return config.storyBlocks.map(b => b.img).filter(Boolean).slice(0, 4);
  }
  return [];
}

/* ─── Guess category from landing slug ─── */
function guessCategory(landingSlug) {
  if (landingSlug.includes('mochila')) return 'mascotas';
  if (landingSlug.includes('lampara') || landingSlug.includes('nebuliz') || landingSlug.includes('porta')) return 'hogar';
  if (landingSlug.includes('soporte') || landingSlug.includes('nasal')) return 'salud';
  if (landingSlug.includes('consola')) return 'otro';
  return 'general';
}

/* ─── Derive all product slugs from LANDING_CONFIGS ─── */
function allLandingProducts() {
  const out = [];
  for (const [landingSlug, config] of Object.entries(LANDING_CONFIGS)) {
    const meta = LANDING_META.find(m => m.slug === landingSlug);
    if (Array.isArray(config.variants)) {
      for (const v of config.variants) {
        if (v.productSlug) out.push({
          productSlug: v.productSlug,
          name: `${meta?.name || landingSlug} — ${v.name}`,
          landingSlug,
          price: v.bundles?.[0]?.price || 0,
          category: guessCategory(landingSlug),
          images: v.images?.length ? v.images : extractImages(config),
          bundles: v.bundles || [],
        });
      }
    } else if (config.productSlug) {
      out.push({
        productSlug: config.productSlug,
        name: meta?.name || landingSlug,
        landingSlug,
        price: config.bundles?.[0]?.price || 0,
        category: guessCategory(landingSlug),
        images: extractImages(config),
        bundles: config.bundles || [],
      });
    }
  }
  return out;
}

const CATEGORIES = [
  { v: 'general',   l: 'General' },
  { v: 'hogar',     l: 'Hogar' },
  { v: 'mascotas',  l: 'Mascotas' },
  { v: 'salud',     l: 'Salud' },
  { v: 'accesorios',l: 'Accesorios' },
  { v: 'kits',      l: 'Kits' },
  { v: 'inflables', l: 'Inflables' },
  { v: 'gorros',    l: 'Gorros' },
  { v: 'ruido',     l: 'Ruido' },
  { v: 'mundial',   l: 'Mundial' },
  { v: 'otro',      l: 'Otro' },
];

const EMPTY_FORM = {
  _id: '', slug: '', name: '', description: '',
  price: '', compareAtPrice: '', imagesText: '',
  category: 'general', isActive: true, bundles: [],
};

function bundlesFromConfig(rootBundles) {
  if (!Array.isArray(rootBundles) || !rootBundles.length) return [];
  return rootBundles.map(b => ({
    qty:       b.qty,
    price:     b.price,
    compareAt: b.compareAt ?? 0,
    label:     b.label || '',
    badge:     b.badge || '',
    benefit:   b.benefit || '',
    popular:   b.popular || false,
  }));
}

export default function AdminProducts() {
  const [products, setProducts]       = useState([]);
  const [selectedId, setSelectedId]   = useState('');
  const [form, setForm]               = useState(EMPTY_FORM);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [seeding, setSeeding]         = useState(null);   // slug being seeded
  const [seedingAll, setSeedingAll]   = useState(false);
  const [error, setError]             = useState('');
  const [ok, setOk]                   = useState('');
  const [search, setSearch]           = useState('');
  const [mobileView, setMobileView]   = useState('list');
  const [showSync, setShowSync]       = useState(false);

  const selected = useMemo(() => products.find(p => p._id === selectedId) || null, [products, selectedId]);

  /* landing info for selected product */
  const landingInfo = useMemo(() => findLandingForSlug(form.slug), [form.slug]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
  }, [products, search]);

  /* missing products (in landing configs but not in DB) */
  const missingProducts = useMemo(() => {
    const dbSlugs = new Set(products.map(p => p.slug));
    return allLandingProducts().filter(lp => !dbSlugs.has(lp.productSlug));
  }, [products]);

  function hydrate(p) {
    const images = Array.isArray(p?.images) ? p.images : [];
    const dbBundles = Array.isArray(p?.bundles) ? p.bundles : [];
    const landing = findLandingForSlug(p?.slug);
    const configBundles = landing ? bundlesFromConfig(landing.rootBundles) : [];
    const finalBundles = dbBundles.length ? dbBundles : configBundles;
    setForm({
      _id: p?._id || '',
      slug: p?.slug || '',
      name: p?.name || '',
      description: p?.description || '',
      price: p?.price ?? '',
      compareAtPrice: p?.compareAtPrice ?? '',
      imagesText: images.join('\n'),
      category: p?.category || 'general',
      isActive: p?.isActive ?? true,
      bundles: finalBundles,
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

  function flash(msg) { setOk(msg); setTimeout(() => setOk(''), 2600); }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function setBundleField(idx, field, val) {
    setForm(f => {
      const b = [...f.bundles];
      b[idx] = { ...b[idx], [field]: field === 'popular' ? val : (Number(val) || 0) };
      return { ...f, bundles: b };
    });
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError(''); setOk('');
    try {
      const images = String(form.imagesText || '').split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
        slug:           sanitizeSlug(form.slug),
        name:           String(form.name || '').trim(),
        description:    String(form.description || '').trim(),
        price:          Number(form.price) || 0,
        compareAtPrice: Number(form.compareAtPrice) || 0,
        images,
        category:       String(form.category || 'general').trim(),
        isActive:       form.isActive,
        bundles:        form.bundles.map(b => ({
          qty:       Number(b.qty),
          price:     Number(b.price),
          compareAt: Number(b.compareAt) || 0,
          label:     String(b.label || ''),
          badge:     String(b.badge || ''),
          benefit:   String(b.benefit || ''),
          popular:   Boolean(b.popular),
        })),
      };
      if (!payload.slug) throw new Error('Falta slug');
      if (!payload.name) throw new Error('Falta nombre');
      if (!payload.price && !payload.bundles.length) throw new Error('Falta precio');
      if (form._id) await api.patch(`/products/${form._id}`, payload);
      else await api.post('/products', payload);
      flash('Guardado correctamente ✓');
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!form._id) return;
    if (!window.confirm(`¿Eliminar "${form.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true); setError('');
    try {
      await api.delete(`/products/${form._id}`);
      flash('Producto eliminado');
      setSelectedId('');
      setForm(EMPTY_FORM);
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Error al eliminar');
    } finally { setDeleting(false); }
  }

  function buildSeedPayload(lp) {
    return {
      name:     lp.name,
      slug:     lp.productSlug,
      price:    lp.price || 1,
      category: lp.category || 'general',
      images:   lp.images || [],
      isActive: true,
      bundles:  (lp.bundles || []).map(b => ({
        qty: b.qty, price: b.price, compareAt: b.compareAt ?? 0,
        label: b.label || '', badge: b.badge || '', benefit: b.benefit || '', popular: b.popular || false,
      })),
    };
  }

  async function seedProduct(lp) {
    setSeeding(lp.productSlug); setError('');
    try {
      await api.post('/products', buildSeedPayload(lp));
      flash(`"${lp.name}" creado ✓`);
      await fetchAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Error al crear');
    } finally { setSeeding(null); }
  }

  async function seedAll() {
    setSeedingAll(true); setError('');
    const missing = allLandingProducts().filter(lp => !products.some(p => p.slug === lp.productSlug));
    let created = 0;
    for (const lp of missing) {
      try {
        await api.post('/products', buildSeedPayload(lp));
        created++;
      } catch (_) { /* skip duplicates or errors */ }
    }
    flash(`${created} producto${created !== 1 ? 's' : ''} creado${created !== 1 ? 's' : ''} ✓`);
    await fetchAll();
    setSeedingAll(false);
  }

  const hasChanges = useMemo(() => {
    if (!selected) return true;
    const dbBundles = JSON.stringify((selected.bundles || []).map(b => ({ qty: b.qty, price: b.price, compareAt: b.compareAt })));
    const fmBundles = JSON.stringify((form.bundles || []).map(b => ({ qty: b.qty, price: Number(b.price), compareAt: Number(b.compareAt) })));
    return form.name !== (selected.name || '') ||
      form.slug !== (selected.slug || '') ||
      String(form.price) !== String(selected.price ?? '') ||
      String(form.compareAtPrice) !== String(selected.compareAtPrice ?? '') ||
      form.description !== (selected.description || '') ||
      form.imagesText !== (selected.images || []).join('\n') ||
      (form.category || '') !== (selected.category || '') ||
      form.isActive !== (selected.isActive ?? true) ||
      dbBundles !== fmBundles;
  }, [form, selected]);

  const basePct = pct(form.price, form.compareAtPrice);
  const imageList = useMemo(() => form.imagesText.split('\n').map(s => s.trim()).filter(Boolean), [form.imagesText]);

  if (loading) return (
    <main className="section"><div className="container" style={{ maxWidth: 1150 }}>
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
        <div style={{ fontWeight: 900, color: '#888' }}>Cargando productos...</div>
      </div>
    </div></main>
  );

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 1200 }}>
        <style>{`
          /* ─── Layout ─── */
          .ap-grid { display: grid; grid-template-columns: 300px 1fr; gap: 18px; margin-top: 16px; align-items: start; }
          @media (max-width: 900px) {
            .ap-grid { grid-template-columns: 1fr !important; }
            .ap-list-col { display: var(--apL, block); }
            .ap-editor-col { display: var(--apE, none); }
            .ap-mb-back { display: flex !important; }
          }
          @media (min-width: 901px) { .ap-mb-back { display: none !important; } }

          /* ─── Left panel ─── */
          .ap-list-panel { background: #fff; border: 1.5px solid rgba(148,163,184,.2); border-radius: 14px; overflow: hidden; }
          .ap-list-head { padding: 14px 14px 12px; border-bottom: 1px solid #f0f4ff; display: flex; gap: 8px; align-items: center; }
          .ap-prod-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 14px; border: none; background: transparent; cursor: pointer; transition: background .12s; border-bottom: 1px solid #f5f7fa; }
          .ap-prod-row:hover { background: #f8faff; }
          .ap-prod-row.ap-active { background: #f0f4ff; }
          .ap-prod-row:last-child { border-bottom: none; }
          .ap-thumb { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; background: #f0f4ff; flex-shrink: 0; display: grid; place-items: center; overflow: hidden; }

          /* ─── Inputs ─── */
          .ap-inp { width: 100%; padding: 9px 12px; border: 1.5px solid rgba(148,163,184,.28); border-radius: 8px; font-size: 14px; font-weight: 600; background: #fff; color: #1a1a1a; outline: none; transition: border-color .15s; box-sizing: border-box; font-family: inherit; }
          .ap-inp:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(27,77,62,.09); }
          .ap-inp::placeholder { color: #bbb; font-weight: 400; }
          .ap-lbl { font-size: 11.5px; font-weight: 800; color: #777; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .04em; }
          .ap-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          @media (max-width: 540px) { .ap-grid2 { grid-template-columns: 1fr !important; } }

          /* ─── Sections in editor ─── */
          .ap-section { border: 1.5px solid rgba(148,163,184,.18); border-radius: 12px; overflow: hidden; }
          .ap-section-head { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid rgba(148,163,184,.15); font-size: 13px; font-weight: 900; color: #374151; display: flex; align-items: center; gap: 8px; }
          .ap-section-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

          /* ─── Bundle table ─── */
          .ap-bundle-row { display: grid; grid-template-columns: 1fr 140px 140px; gap: 10px; align-items: center; padding: 10px 14px; border-radius: 9px; background: #f8fafc; border: 1px solid #e8ecf0; }
          .ap-bundle-row.ap-popular { background: #f0fdf4; border-color: #86efac; }
          @media (max-width: 640px) { .ap-bundle-row { grid-template-columns: 1fr !important; } }
          .ap-bundle-inp { padding: 8px 10px; border: 1.5px solid rgba(148,163,184,.28); border-radius: 7px; font-size: 14px; font-weight: 700; background: #fff; width: 100%; box-sizing: border-box; outline: none; font-family: inherit; }
          .ap-bundle-inp:focus { border-color: var(--primary); }

          /* ─── Status badge ─── */
          .ap-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .ap-dot-on { background: #10b981; }
          .ap-dot-off { background: #94a3b8; }

          /* ─── Toggle switch ─── */
          .ap-toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
          .ap-toggle input { opacity: 0; width: 0; height: 0; }
          .ap-toggle-slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 999px; transition: background .2s; cursor: pointer; }
          .ap-toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
          .ap-toggle input:checked ~ .ap-toggle-slider { background: #10b981; }
          .ap-toggle input:checked ~ .ap-toggle-slider::before { transform: translateX(18px); }

          /* ─── Image preview ─── */
          .ap-img-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
          .ap-img-preview img { width: 58px; height: 58px; object-fit: cover; border-radius: 8px; border: 1px solid #e0e0e0; }

          /* ─── Sync panel ─── */
          .ap-sync-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-radius: 9px; background: #fffbeb; border: 1px solid #fde68a; }

          /* ─── Category chip ─── */
          .ap-chip { display: inline-flex; align-items: center; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #f0f4ff; color: #4f46e5; border: 1px solid #c7d2fe; letter-spacing: .02em; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Productos</h1>
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: '#888' }}>
              {products.length} producto{products.length !== 1 ? 's' : ''}
              {missingProducts.length > 0 && (
                <span style={{ marginLeft: 10, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 8px', fontSize: 11 }}>
                  {missingProducts.length} sin sincronizar
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost" to="/admin" style={{ fontSize: 13 }}>← Panel</Link>
            <button className="btn btn-ghost" onClick={() => setShowSync(s => !s)} style={{ fontSize: 13, color: showSync ? 'var(--primary)' : undefined }}>
              Sincronizar landings
            </button>
            <button className="btn btn-ghost" onClick={fetchAll} style={{ fontSize: 13 }}>Recargar</button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', fontWeight: 700, fontSize: 13, color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 900, marginLeft: 12 }}>✕</button>
          </div>
        )}
        {ok && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.06)', fontWeight: 700, fontSize: 13, color: '#059669' }}>
            {ok}
          </div>
        )}

        {/* ── Sync panel ── */}
        {showSync && (
          <div className="ap-section" style={{ marginTop: 14 }}>
            <div className="ap-section-head">
              🔄 Sincronizar Landings
              {missingProducts.length > 0 && (
                <button
                  className="btn btn-primary"
                  style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 14px' }}
                  disabled={seedingAll}
                  onClick={seedAll}
                >
                  {seedingAll ? 'Creando...' : `Crear todos (${missingProducts.length})`}
                </button>
              )}
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {missingProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#10b981', fontWeight: 800, fontSize: 13 }}>
                  ✓ Todos los productos de las landings están sincronizados
                </div>
              ) : (
                missingProducts.map(lp => (
                  <div key={lp.productSlug} className="ap-sync-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{lp.name}</div>
                      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>
                        slug: <strong>{lp.productSlug}</strong>
                        {' · '}/lp/{lp.landingSlug}
                        {lp.price > 0 && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 800 }}>desde {money(lp.price)}</span>}
                        {lp.bundles.length > 0 && <span style={{ marginLeft: 6, background: '#f0f4ff', color: '#4f46e5', borderRadius: 4, padding: '0 5px', fontSize: 10, fontWeight: 800 }}>{lp.bundles.length} paquetes</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
                      disabled={!!seeding || seedingAll}
                      onClick={() => seedProduct(lp)}
                    >
                      {seeding === lp.productSlug ? 'Creando...' : 'Crear'}
                    </button>
                  </div>
                ))
              )}
              {missingProducts.length > 0 && (
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, padding: '4px 2px' }}>
                  Los productos sin precio se crean con $1 de placeholder — editá el precio en el panel de la derecha.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main grid ── */}
        <div
          className="ap-grid"
          style={{
            ['--apL']: mobileView === 'list' ? 'block' : 'none',
            ['--apE']: mobileView === 'editor' ? 'block' : 'none',
          }}
        >
          {/* ══ LEFT: Product list ══ */}
          <div className="ap-list-col">
            <div className="ap-list-panel">
              <div className="ap-list-head">
                <input
                  className="ap-inp"
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '7px 13px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => { setSelectedId(''); setForm(EMPTY_FORM); setMobileView('editor'); }}
                >
                  + Nuevo
                </button>
              </div>

              <div>
                {filtered.map(p => {
                  const thumb = p.images?.[0];
                  const isAct = selectedId === p._id;
                  const hasBundles = Array.isArray(p.bundles) && p.bundles.length > 0;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      className={`ap-prod-row ${isAct ? 'ap-active' : ''}`}
                      onClick={() => { setSelectedId(p._id); setMobileView('editor'); }}
                    >
                      <div className="ap-thumb">
                        {thumb
                          ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 15, color: '#bbb' }}>📦</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`ap-dot ${p.isActive !== false ? 'ap-dot-on' : 'ap-dot-off'}`} />
                          <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
                          <span>{p.slug}</span>
                          {hasBundles && <span style={{ background: '#f0f4ff', color: '#4f46e5', borderRadius: 4, padding: '0 4px', fontSize: 10, fontWeight: 800 }}>packs</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 64 }}>
                        {hasBundles
                          ? <div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>desde<br />{money(Math.min(...p.bundles.map(b => b.price)))}</div>
                          : <>
                            <div style={{ fontWeight: 900, fontSize: 13 }}>{money(p.price)}</div>
                            {p.compareAtPrice > 0 && p.compareAtPrice > p.price && (
                              <div style={{ fontSize: 10, color: '#bbb', textDecoration: 'line-through' }}>{money(p.compareAtPrice)}</div>
                            )}
                          </>
                        }
                      </div>
                    </button>
                  );
                })}
                {!filtered.length && (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa', fontSize: 13, fontWeight: 600 }}>
                    Sin resultados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Editor ══ */}
          <div className="ap-editor-col">
            <button type="button" className="ap-mb-back btn btn-ghost" onClick={() => setMobileView('list')} style={{ fontSize: 12, marginBottom: 12, padding: '6px 12px' }}>
              ← Lista
            </button>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── Editor header ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em' }}>
                    {form._id ? form.name || 'Editar producto' : 'Nuevo producto'}
                  </div>
                  {form.slug && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                      {landingInfo && (
                        <a href={`/lp/${landingInfo.landingSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                          /lp/{landingInfo.landingSlug} ↗
                        </a>
                      )}
                      {landingInfo?.variant && (
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#f0fdf4', color: '#065f46', border: '1px solid #86efac', borderRadius: 999, padding: '1px 7px' }}>
                          variante: {landingInfo.variant.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {hasChanges && (
                    <span style={{ fontSize: 11, fontWeight: 800, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 999, padding: '3px 10px' }}>
                      Sin guardar
                    </span>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: form.isActive ? '#10b981' : '#94a3b8' }}>
                    <label className="ap-toggle">
                      <input type="checkbox" checked={form.isActive} onChange={e => setF('isActive', e.target.checked)} />
                      <span className="ap-toggle-slider" />
                    </label>
                    {form.isActive ? 'Activo' : 'Inactivo'}
                  </label>
                </div>
              </div>

              {/* ── Sección: Información ── */}
              <div className="ap-section">
                <div className="ap-section-head">📋 Información general</div>
                <div className="ap-section-body">
                  <div className="ap-grid2">
                    <div>
                      <span className="ap-lbl">Nombre del producto</span>
                      <input className="ap-inp" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ej: Lámpara Magnética 3 en 1" />
                    </div>
                    <div>
                      <span className="ap-lbl">Slug (URL)</span>
                      <input className="ap-inp" value={form.slug} onChange={e => setF('slug', e.target.value)} placeholder="lampara-magnetica" />
                    </div>
                  </div>
                  <div>
                    <span className="ap-lbl">Categoría</span>
                    <select className="ap-inp" value={form.category} onChange={e => setF('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="ap-lbl">Descripción corta</span>
                    <textarea className="ap-inp" rows={2} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Descripción visible en la landing" style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* ── Sección: Precio base ── */}
              <div className="ap-section">
                <div className="ap-section-head">💰 Precio base</div>
                <div className="ap-section-body">
                  {form.bundles.length > 0 && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#888', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      Este producto usa paquetes — el precio base se usa como fallback y en metadatos.
                    </div>
                  )}
                  <div className="ap-grid2">
                    <div>
                      <span className="ap-lbl">Precio actual (ARS)</span>
                      <input className="ap-inp" inputMode="numeric" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="59900" style={{ fontSize: 17, fontWeight: 900 }} />
                    </div>
                    <div>
                      <span className="ap-lbl">Precio tachado (ARS)</span>
                      <input className="ap-inp" inputMode="numeric" value={form.compareAtPrice} onChange={e => setF('compareAtPrice', e.target.value)} placeholder="83900" />
                      {basePct > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: '#059669' }}>-{basePct}% descuento</div>
                      )}
                    </div>
                  </div>
                  {Number(form.price) > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>Vista previa:</span>
                      {Number(form.compareAtPrice) > Number(form.price) && (
                        <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: 14 }}>{money(form.compareAtPrice)}</span>
                      )}
                      <span style={{ fontWeight: 900, fontSize: 20 }}>{money(form.price)}</span>
                      {basePct > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>-{basePct}%</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Sección: Paquetes/Bundles ── */}
              {form.bundles.length > 0 && (
                <div className="ap-section">
                  <div className="ap-section-head">
                    📦 Paquetes / Bundles
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#888' }}>
                      Editá precio y tachado por paquete
                    </span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: 10, padding: '0 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Paquete</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Precio ARS</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Tachado ARS</div>
                    </div>

                    {form.bundles.map((b, i) => {
                      const dp = pct(b.price, b.compareAt);
                      return (
                        <div key={i} className={`ap-bundle-row ${b.popular ? 'ap-popular' : ''}`}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {b.popular && <span style={{ fontSize: 10, fontWeight: 900, background: '#10b981', color: '#fff', borderRadius: 4, padding: '1px 6px' }}>★ POPULAR</span>}
                              {b.badge && <span style={{ fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', border: '1px solid #fde68a' }}>{b.badge}</span>}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 3 }}>{b.label || `${b.qty} unidad${b.qty !== 1 ? 'es' : ''}`}</div>
                            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2 }}>
                              {b.qty} und · {b.benefit && b.benefit}
                            </div>
                          </div>
                          <div>
                            <input
                              className="ap-bundle-inp"
                              inputMode="numeric"
                              value={b.price}
                              onChange={e => setBundleField(i, 'price', e.target.value)}
                              style={{ fontWeight: 900, color: '#059669', fontSize: 15 }}
                            />
                            {dp > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginTop: 3 }}>-{dp}% off</div>}
                          </div>
                          <div>
                            <input
                              className="ap-bundle-inp"
                              inputMode="numeric"
                              value={b.compareAt}
                              onChange={e => setBundleField(i, 'compareAt', e.target.value)}
                              style={{ color: '#aaa', textDecoration: 'line-through' }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Resumen de precios */}
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>Resumen:</span>
                      {form.bundles.map((b, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 700 }}>
                          <span style={{ color: '#888' }}>{b.qty}x</span> {money(b.price)}
                          {pct(b.price, b.compareAt) > 0 && <span style={{ color: '#059669', marginLeft: 4 }}>-{pct(b.price, b.compareAt)}%</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Sección: Imágenes ── */}
              <div className="ap-section">
                <div className="ap-section-head">🖼️ Imágenes</div>
                <div className="ap-section-body">
                  <div>
                    <span className="ap-lbl">URLs (1 por línea)</span>
                    <textarea
                      className="ap-inp"
                      rows={4}
                      value={form.imagesText}
                      onChange={e => setF('imagesText', e.target.value)}
                      placeholder={"https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg"}
                      style={{ resize: 'vertical', fontSize: 12 }}
                    />
                  </div>
                  {imageList.length > 0 && (
                    <div className="ap-img-preview">
                      {imageList.map((url, i) => (
                        <img key={i} src={url} alt={`img ${i + 1}`} onError={e => { e.target.style.opacity = '.3'; }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Actions ── */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '12px 0' }}>
                  {saving ? 'Guardando...' : form._id ? 'Guardar cambios' : 'Crear producto'}
                </button>
                {form._id && (
                  <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={deleting} style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,.25)', fontSize: 13, padding: '12px 16px' }}>
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
