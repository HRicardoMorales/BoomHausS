// frontend/src/pages/AdminProducts.jsx
// Editor de productos del admin. Datos y llamadas a la API en `useAdminProducts`;
// formato, payload, "sin guardar" y sincronización con landings en `productForm.js`.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import { useNotice } from '../components/ui/useNotice.jsx';
import { useAdminProducts } from '../hooks/admin/useAdminProducts.js';
import { LANDING_CONFIGS, LANDING_META } from '../landings/index';
import {
  CATEGORIES, EMPTY_FORM, filterProducts, findLandingForSlug, formFromProduct, isDirty,
  lines, listPrice, missingLandingProducts, money, payloadFromForm, pct, updateBundle,
} from '../components/admin/products/productForm.js';

const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

export default function AdminProducts() {
  const { confirm, confirmDialog } = useConfirm();
  const { notify, notice } = useNotice({ duration: 2600 });
  const { products, loading, error: loadError, busy, refresh, save, remove, seedOne, seedMany } = useAdminProducts();

  const [selectedId, setSelectedId]   = useState('');
  const [form, setForm]               = useState(() => ({ ...EMPTY_FORM }));
  const [actionError, setActionError] = useState('');
  const [search, setSearch]           = useState('');
  const [mobileView, setMobileView]   = useState('list');
  const [showSync, setShowSync]       = useState(false);

  const error = actionError || loadError;
  const saving = busy === 'save';
  const deleting = busy === 'delete';
  const seedingAll = busy === 'seed-all';

  const selected = useMemo(() => products.find(p => p._id === selectedId) || null, [products, selectedId]);
  const landingInfo = useMemo(() => findLandingForSlug(form.slug, LANDING_CONFIGS), [form.slug]);
  const filtered = useMemo(() => filterProducts(products, search), [products, search]);
  const missingProducts = useMemo(() => missingLandingProducts(products, LANDING_CONFIGS, LANDING_META), [products]);
  const hasChanges = useMemo(() => isDirty(form, selected, LANDING_CONFIGS), [form, selected]);
  const basePct = pct(form.price, form.compareAtPrice);
  const imageList = useMemo(() => lines(form.imagesText), [form.imagesText]);

  // El formulario se hidrata solo al elegir un producto: refrescar la lista
  // (después de guardar, por ejemplo) no pisa ediciones sin guardar.
  function select(p) {
    setSelectedId(p?._id || '');
    setForm(formFromProduct(p, LANDING_CONFIGS));
    setActionError('');
  }

  // Primera carga: abre el primer producto. Se ajusta durante el render (patrón
  // recomendado por React) en vez de un efecto que dispara un segundo render.
  const [autoSelected, setAutoSelected] = useState(false);
  if (!autoSelected && !loading) {
    setAutoSelected(true);
    if (products.length) select(products[0]);
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setBundleField(idx, field, val) { setForm(f => ({ ...f, bundles: updateBundle(f.bundles, idx, field, val) })); }

  async function handleSave(e) {
    e.preventDefault();
    const { payload, error: invalid } = payloadFromForm(form);
    if (invalid) { setActionError(invalid); return; }
    setActionError('');
    const res = await save(form._id, payload);
    if (!res.ok) { setActionError(res.message); return; }
    notify(form._id ? 'Cambios guardados' : 'Producto creado', { tone: 'success' });
    // Un alta nueva queda seleccionada (antes saltaba al primer producto de la lista).
    if (res.data?._id) select(res.data);
  }

  async function handleDelete() {
    if (!form._id) return;
    const yes = await confirm({
      title: `¿Eliminar "${form.name}"?`,
      message: 'Se quita del catálogo de la tienda. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar producto',
      tone: 'danger',
    });
    if (!yes) return;
    setActionError('');
    const res = await remove(form._id);
    if (!res.ok) { setActionError(res.message); return; }
    notify('Producto eliminado', { tone: 'success' });
    select(null);
    setMobileView('list');
  }

  async function seedProduct(lp) {
    setActionError('');
    const res = await seedOne(lp);
    if (!res.ok) { setActionError(res.message); return; }
    notify(`"${lp.name}" creado`, { tone: 'success' });
  }

  async function seedAll() {
    setActionError('');
    if (!missingProducts.length) { notify('Todos los productos ya están sincronizados', { tone: 'success' }); return; }
    const { created, errors } = await seedMany(missingProducts);
    if (errors.length) setActionError(`${plural(errors.length, 'error')}: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} más)` : ''}`);
    if (created) notify(`${plural(created, 'producto')} ${created !== 1 ? 'creados' : 'creado'}`, { tone: 'success' });
  }

  if (loading && !products.length) return (
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
            <button className="btn btn-ghost" onClick={refresh} disabled={loading} style={{ fontSize: 13 }}>Recargar</button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div role="alert" style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', fontWeight: 700, fontSize: 13, color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            {actionError
              ? <button type="button" onClick={() => setActionError('')} aria-label="Cerrar error" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 900, marginLeft: 12 }}>✕</button>
              : <button type="button" onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 900, marginLeft: 12, textDecoration: 'underline' }}>Reintentar</button>}
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
                      disabled={busy !== null}
                      onClick={() => seedProduct(lp)}
                    >
                      {busy === `seed:${lp.productSlug}` ? 'Creando...' : 'Crear'}
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
                  onClick={() => { select(null); setMobileView('editor'); }}
                >
                  + Nuevo
                </button>
              </div>

              <div>
                {filtered.map(p => {
                  const thumb = p.images?.[0];
                  const isAct = selectedId === p._id;
                  const { fromBundles: hasBundles, price: fromPrice } = listPrice(p);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      className={`ap-prod-row ${isAct ? 'ap-active' : ''}`}
                      onClick={() => { if (p._id !== selectedId) select(p); setMobileView('editor'); }}
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
                          ? <div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>desde<br />{money(fromPrice)}</div>
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
                    <span className="ap-toggle">
                      <input type="checkbox" checked={form.isActive} onChange={e => setF('isActive', e.target.checked)} />
                      <span className="ap-toggle-slider" />
                    </span>
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
                      <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: '#888', lineHeight: 1.4 }}>
                        Este nombre aparece como <strong>título H1</strong> en la landing.
                      </div>
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
                  <div>
                    <span className="ap-lbl">Subtítulo de la ficha</span>
                    <input className="ap-inp" value={form.subtitle} maxLength={120} onChange={e => setF('subtitle', e.target.value)} placeholder="Ej: Más higiene y orden todos los días" />
                  </div>
                  <div>
                    <span className="ap-lbl">Bullets de la ficha (uno por línea, máx. 6)</span>
                    <textarea className="ap-inp" rows={4} value={form.highlightsText} onChange={e => setF('highlightsText', e.target.value)} placeholder={'⚡ Beneficio principal\n🔋 Recargable'} style={{ resize: 'vertical' }} />
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
                      Nombre, precio y tachado editables
                    </span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: 10, padding: '0 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Nombre del paquete ✏️</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Precio ARS</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.04em' }}>Tachado ARS</div>
                    </div>

                    {form.bundles.map((b, i) => {
                      const dp = pct(b.price, b.compareAt);
                      return (
                        <div key={i} className={`ap-bundle-row ${b.popular ? 'ap-popular' : ''}`}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                              {b.popular && <span style={{ fontSize: 10, fontWeight: 900, background: '#10b981', color: '#fff', borderRadius: 4, padding: '1px 6px' }}>★ POPULAR</span>}
                              {b.badge && <span style={{ fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', border: '1px solid #fde68a' }}>{b.badge}</span>}
                            </div>
                            <input
                              className="ap-bundle-inp"
                              value={b.label}
                              onChange={e => setBundleField(i, 'label', e.target.value)}
                              placeholder={`Nombre del paquete ${i + 1}`}
                              style={{ fontWeight: 800, fontSize: 13 }}
                            />
                            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 4 }}>
                              {b.qty} und · {b.benefit}
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
      {confirmDialog}
      {notice}
    </main>
  );
}
