// Columna izquierda del editor: buscador, alta y lista de productos.
import { useId } from 'react';
import { listPrice, money } from './productForm.js';

function ProductRow({ product: p, active, onPick }) {
  const thumb = p.images?.[0];
  const { fromBundles, price: fromPrice } = listPrice(p);
  const on = p.isActive !== false;
  return (
    <li>
      <button type="button" className="ap-prod-row" aria-current={active ? 'true' : undefined} onClick={() => onPick(p)}>
        <span className="ap-thumb" aria-hidden="true">
          {thumb ? <img src={thumb} alt="" loading="lazy" /> : '📦'}
        </span>
        <span className="ap-row-main">
          <span className="ap-row-name">
            <span className={`ap-dot${on ? ' ap-dot--on' : ''}`} aria-hidden="true" />
            <span>{p.name}</span>
          </span>
          <span className="ap-row-meta">
            <span>{p.slug}</span>
            {!on && <span className="ap-tag">inactivo</span>}
            {fromBundles && <span className="ap-tag">packs</span>}
          </span>
        </span>
        <span className="ap-row-price">
          {fromBundles
            ? <><small>desde</small>{money(fromPrice)}</>
            : <>
              {money(p.price)}
              {p.compareAtPrice > p.price && <s>{money(p.compareAtPrice)}</s>}
            </>}
        </span>
      </button>
    </li>
  );
}

export default function ProductList({ products, selectedId, search, onSearch, onPick, onNew }) {
  const searchId = useId();
  return (
    <div className="ap-list-panel">
      <div className="ap-list-head" role="search">
        <label htmlFor={searchId} className="sr-only">Buscar productos</label>
        <input id={searchId} type="search" className="ap-inp" placeholder="Buscar..." value={search} onChange={e => onSearch(e.target.value)} />
        <button type="button" className="btn btn-primary ap-btn-sm" onClick={onNew}>+ Nuevo</button>
      </div>
      {products.length
        ? (
          <ul className="ap-list" aria-label="Productos">
            {products.map(p => <ProductRow key={p._id} product={p} active={p._id === selectedId} onPick={onPick} />)}
          </ul>
        )
        : <p className="ap-empty" role="status">Sin resultados</p>}
    </div>
  );
}
