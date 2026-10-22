// Formulario de un producto: información, precio base, paquetes e imágenes.
// Presentacional: el estado del formulario y las acciones viven en AdminProducts.
import { useEffect, useId, useMemo, useRef } from 'react';
import BundlesEditor from './BundlesEditor.jsx';
import { CATEGORIES, lines, money, pct } from './productForm.js';

/** Rótulo asociado al control (`htmlFor`) y ayuda opcional vía `aria-describedby`. */
function Field({ label, hint, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label className="ap-lbl" htmlFor={id}>{label}</label>
      {children({ id, 'aria-describedby': hintId })}
      {hint && <div id={hintId} className="ap-hint">{hint}</div>}
    </div>
  );
}

function Section({ icon, title, children }) {
  const id = useId();
  return (
    <section className="ap-section" aria-labelledby={id}>
      <h3 id={id} className="ap-section-head"><span aria-hidden="true">{icon}</span> {title}</h3>
      <div className="ap-section-body">{children}</div>
    </section>
  );
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * El error de guardado se muestra junto al botón y recibe foco: en mobile el
 * aviso general queda arriba, fuera de pantalla, y tocar "Crear producto"
 * parecía no hacer nada. `error.seq` cambia en cada intento, así que repetir
 * el mismo error vuelve a llevar la vista hasta él.
 */
function FormError({ error, onDismiss }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView?.({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  }, [error?.seq]);
  if (!error?.text) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="ap-alert ap-form-error">
      <span>{error.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Cerrar error">✕</button>
    </div>
  );
}

export default function ProductEditor({
  form, setField, setBundleField, landingInfo, hasChanges,
  saving, deleting, error, onDismissError, onSubmit, onDelete, onBack,
}) {
  const basePct = pct(form.price, form.compareAtPrice);
  const imageList = useMemo(() => lines(form.imagesText), [form.imagesText]);
  const bind = key => ({ value: form[key], onChange: e => setField(key, e.target.value) });

  return (
    <>
      <button type="button" className="ap-mb-back btn btn-ghost" onClick={onBack}>← Lista</button>

      <form onSubmit={onSubmit} className="ap-form" noValidate>
        <div className="ap-editor-head">
          <div>
            <h2 className="ap-editor-title">{form._id ? form.name || 'Editar producto' : 'Nuevo producto'}</h2>
            {form.slug && landingInfo && (
              <div className="ap-editor-links">
                {landingInfo && (
                  <a href={`/lp/${landingInfo.landingSlug}`} target="_blank" rel="noreferrer">
                    /lp/{landingInfo.landingSlug} ↗<span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                )}
                {landingInfo?.variant && <span className="ap-pill ap-pill--ok">variante: {landingInfo.variant.name}</span>}
              </div>
            )}
          </div>
          <div className="ap-editor-status">
            {hasChanges && <span className="ap-pill ap-pill--warn" role="status">Sin guardar</span>}
            <label className={`ap-switch${form.isActive ? ' ap-switch--on' : ''}`}>
              <span className="ap-toggle">
                <input type="checkbox" role="switch" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} />
                <span className="ap-toggle-slider" />
              </span>
              {form.isActive ? 'Activo' : 'Inactivo'}
            </label>
          </div>
        </div>

        <Section icon="📋" title="Información general">
          <div className="ap-grid2">
            <Field label="Nombre del producto" hint={<>Este nombre aparece como <strong>título H1</strong> en la landing.</>}>
              {a => <input {...a} className="ap-inp" {...bind('name')} placeholder="Ej: Lámpara Magnética 3 en 1" />}
            </Field>
            <Field label="Slug (URL)">
              {a => <input {...a} className="ap-inp" {...bind('slug')} placeholder="lampara-magnetica" autoCapitalize="off" spellCheck={false} />}
            </Field>
          </div>
          <Field label="Categoría">
            {a => (
              <select {...a} className="ap-inp" {...bind('category')}>
                {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            )}
          </Field>
          <Field label="Descripción corta">
            {a => <textarea {...a} className="ap-inp" rows={2} {...bind('description')} placeholder="Descripción visible en la landing" />}
          </Field>
          <Field label="Subtítulo de la ficha">
            {a => <input {...a} className="ap-inp" maxLength={120} {...bind('subtitle')} placeholder="Ej: Más higiene y orden todos los días" />}
          </Field>
          <Field label="Bullets de la ficha (uno por línea, máx. 6)">
            {a => <textarea {...a} className="ap-inp" rows={4} {...bind('highlightsText')} placeholder={'⚡ Beneficio principal\n🔋 Recargable'} />}
          </Field>
        </Section>

        <Section icon="💰" title="Precio base">
          {form.bundles.length > 0 && (
            <p className="ap-note" style={{ margin: 0 }}>Este producto usa paquetes — el precio base se usa como fallback y en metadatos.</p>
          )}
          <div className="ap-grid2">
            <Field label="Precio actual (ARS)">
              {a => <input {...a} className="ap-inp ap-inp--price" inputMode="numeric" {...bind('price')} placeholder="59900" />}
            </Field>
            <Field label="Precio tachado (ARS)" hint={basePct > 0 ? <span className="ap-off">-{basePct}% descuento</span> : null}>
              {a => <input {...a} className="ap-inp" inputMode="numeric" {...bind('compareAtPrice')} placeholder="83900" />}
            </Field>
          </div>
          {Number(form.price) > 0 && (
            <div className="ap-preview" aria-label="Vista previa del precio">
              <span className="ap-preview-lbl">Vista previa:</span>
              {Number(form.compareAtPrice) > Number(form.price) && <s>{money(form.compareAtPrice)}</s>}
              <strong>{money(form.price)}</strong>
              {basePct > 0 && <span className="ap-off">-{basePct}%</span>}
            </div>
          )}
        </Section>

        <BundlesEditor bundles={form.bundles} onChange={setBundleField} />

        <Section icon="🖼️" title="Imágenes">
          <Field label="URLs (1 por línea)">
            {a => (
              <textarea
                {...a}
                className="ap-inp ap-inp--mono"
                rows={4}
                {...bind('imagesText')}
                placeholder={'https://ejemplo.com/foto1.jpg\nhttps://ejemplo.com/foto2.jpg'}
                spellCheck={false}
              />
            )}
          </Field>
          {imageList.length > 0 && (
            <ul className="ap-img-preview" aria-label="Vista previa de imágenes">
              {imageList.map((url, i) => (
                <li key={`${i}-${url}`}>
                  <img src={url} alt={`Imagen ${i + 1}`} loading="lazy" onError={e => { e.currentTarget.dataset.broken = ''; }} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <FormError error={error} onDismiss={onDismissError} />

        <div className="ap-submit-row">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : form._id ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {form._id && (
            <button type="button" className="btn btn-ghost ap-delete" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
