// frontend/src/pages/AdminProducts.jsx
// Editor de productos del admin. Esta página solo orquesta: datos y llamadas a la
// API en `useAdminProducts`; formato, payload, "sin guardar" y sincronización con
// landings en `productForm.js`; la vista en `components/admin/products/`.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminProducts.css';
import { useConfirm } from '../components/ui/useConfirm.jsx';
import { useNotice } from '../components/ui/useNotice.jsx';
import { useAdminProducts } from '../hooks/admin/useAdminProducts.js';
import { LANDING_CONFIGS, LANDING_META } from '../landings/index';
import ProductList from '../components/admin/products/ProductList.jsx';
import ProductEditor from '../components/admin/products/ProductEditor.jsx';
import SyncPanel from '../components/admin/products/SyncPanel.jsx';
import {
  EMPTY_FORM, filterProducts, findLandingForSlug, formFromProduct, isDirty,
  missingLandingProducts, payloadFromForm, updateBundle,
} from '../components/admin/products/productForm.js';

const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

export default function AdminProducts() {
  const { confirm, confirmDialog } = useConfirm();
  const { notify, notice } = useNotice({ duration: 2600 });
  const { products, loading, error: loadError, busy, refresh, save, remove, seedOne, seedMany } = useAdminProducts();

  const [selectedId, setSelectedId]   = useState('');
  const [form, setForm]               = useState(() => ({ ...EMPTY_FORM }));
  const [actionError, setActionError] = useState('');           // sincronización (aviso de arriba)
  const [formError, setFormErrorState] = useState(null);        // guardar/eliminar: { text, seq }
  const [search, setSearch]           = useState('');
  const [mobileView, setMobileView]   = useState('list');
  const [showSync, setShowSync]       = useState(false);

  const error = actionError || loadError;

  const selected = useMemo(() => products.find(p => p._id === selectedId) || null, [products, selectedId]);
  const landingInfo = useMemo(() => findLandingForSlug(form.slug, LANDING_CONFIGS), [form.slug]);
  const filtered = useMemo(() => filterProducts(products, search), [products, search]);
  const missingProducts = useMemo(() => missingLandingProducts(products, LANDING_CONFIGS, LANDING_META), [products]);
  const hasChanges = useMemo(() => isDirty(form, selected, LANDING_CONFIGS), [form, selected]);

  // `seq` cambia en cada intento para que el editor vuelva a enfocar el error aunque el texto se repita.
  const setFormError = text => setFormErrorState(text ? prev => ({ text, seq: (prev?.seq || 0) + 1 }) : null);

  // El formulario se hidrata solo al elegir un producto: refrescar la lista
  // (después de guardar, por ejemplo) no pisa ediciones sin guardar.
  function select(p) {
    setSelectedId(p?._id || '');
    setForm(formFromProduct(p, LANDING_CONFIGS));
    setFormError('');
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
    if (invalid) { setFormError(invalid); return; }
    setFormError('');
    const res = await save(form._id, payload);
    if (!res.ok) { setFormError(res.message); return; }
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
    setFormError('');
    const res = await remove(form._id);
    if (!res.ok) { setFormError(res.message); return; }
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
    <main className="section"><div className="container ap-wrap">
      <div className="card ap-loading" role="status">Cargando productos...</div>
    </div></main>
  );

  return (
    <main className="section">
      <div className="container ap-wrap">
        <header className="ap-header">
          <div>
            <h1 className="ap-title">Productos</h1>
            <p className="ap-count" style={{ marginBottom: 0 }}>
              {plural(products.length, 'producto')}
              {missingProducts.length > 0 && <span className="ap-pill ap-pill--warn">{missingProducts.length} sin sincronizar</span>}
            </p>
          </div>
          <div className="ap-actions">
            <Link className="btn btn-ghost" to="/admin">← Panel</Link>
            <button type="button" className="btn btn-ghost" aria-expanded={showSync} aria-controls="ap-sync" onClick={() => setShowSync(s => !s)}>
              Sincronizar landings
            </button>
            <button type="button" className="btn btn-ghost" onClick={refresh} disabled={loading}>Recargar</button>
          </div>
        </header>

        {error && (
          <div role="alert" className="ap-alert">
            <span>{error}</span>
            {actionError
              ? <button type="button" onClick={() => setActionError('')} aria-label="Cerrar error">✕</button>
              : <button type="button" className="ap-link" onClick={refresh}>Reintentar</button>}
          </div>
        )}

        {showSync && (
          <SyncPanel id="ap-sync" missing={missingProducts} busy={busy} onSeedOne={seedProduct} onSeedAll={seedAll} />
        )}

        <div className="ap-grid" data-view={mobileView}>
          <div className="ap-list-col">
            <ProductList
              products={filtered}
              selectedId={selectedId}
              search={search}
              onSearch={setSearch}
              onPick={p => { if (p._id !== selectedId) select(p); setMobileView('editor'); }}
              onNew={() => { select(null); setMobileView('editor'); }}
            />
          </div>
          <div className="ap-editor-col">
            <ProductEditor
              form={form}
              setField={setF}
              setBundleField={setBundleField}
              landingInfo={landingInfo}
              hasChanges={hasChanges}
              saving={busy === 'save'}
              deleting={busy === 'delete'}
              error={formError}
              onDismissError={() => setFormError('')}
              onSubmit={handleSave}
              onDelete={handleDelete}
              onBack={() => setMobileView('list')}
            />
          </div>
        </div>
      </div>
      {confirmDialog}
      {notice}
    </main>
  );
}
