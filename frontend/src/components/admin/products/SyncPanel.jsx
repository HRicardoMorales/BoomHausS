// Productos que tienen landing pero todavía no existen en la base.
import { money } from './productForm.js';

export default function SyncPanel({ id, missing, busy, onSeedOne, onSeedAll }) {
  const seedingAll = busy === 'seed-all';
  return (
    <section id={id} className="ap-section ap-sync" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="ap-section-head">
        🔄 Sincronizar landings
        {missing.length > 0 && (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={onSeedAll}>
            {seedingAll ? 'Creando...' : `Crear todos (${missing.length})`}
          </button>
        )}
      </h2>
      <div className="ap-sync-body">
        {missing.length === 0
          ? <p className="ap-sync-done">✓ Todos los productos de las landings están sincronizados</p>
          : missing.map(lp => (
            <div key={lp.productSlug} className="ap-sync-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ap-sync-name">{lp.name}</div>
                <div className="ap-sync-meta">
                  <span>slug: <strong>{lp.productSlug}</strong> · /lp/{lp.landingSlug}</span>
                  {lp.price > 0 && <span className="ap-from">desde {money(lp.price)}</span>}
                  {lp.bundles.length > 0 && <span className="ap-tag">{lp.bundles.length} paquetes</span>}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy !== null}
                aria-label={`Crear ${lp.name}`}
                onClick={() => onSeedOne(lp)}
              >
                {busy === `seed:${lp.productSlug}` ? 'Creando...' : 'Crear'}
              </button>
            </div>
          ))}
        {missing.length > 0 && (
          <p className="ap-sync-foot">Los productos sin precio se crean con $1 de placeholder — editá el precio en el panel de la derecha.</p>
        )}
      </div>
    </section>
  );
}
