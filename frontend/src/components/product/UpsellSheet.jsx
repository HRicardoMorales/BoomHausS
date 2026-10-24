import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import SafeImg from "../SafeImg";
import { THUMB_WIDTHS } from "../landing/imageSizes";
import { FALLBACK_IMG } from "./format";
import { moneyARSTight } from "../../utils/pricing.js";
import { useDialogA11y } from "../../hooks/useDialogA11y";

/* =========================
   Upsell Sheet — aparece antes del checkout
========================= */
export default function UpsellSheet({ mc, mainProduct, mainDisplayTotal, onConfirm }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);
  const { upsell } = mc;
  const [accProducts, setAccProducts] = useState({});
  const [done, setDone] = useState(false);
  const [selectedSet, setSelectedSet] = useState(new Set());

  // Animar entrada
  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      sheetRef.current?.classList.add("ups-sheet--open");
      backdropRef.current?.classList.add("ups-backdrop--open");
    });
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fetch accesorios
  useEffect(() => {
    if (!upsell?.items?.length) return;
    let cancelled = false;
    async function fetchAll() {
      const results = await Promise.all(
        upsell.items.map(async (item) => {
          try {
            const res = await api.get(`/products/slug/${item.slug}`);
            return [item.slug, res.data?.ok ? res.data.data : null];
          } catch { return [item.slug, null]; }
        })
      );
      if (!cancelled) { setAccProducts(Object.fromEntries(results)); setDone(true); }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [upsell]);

  function animateClose(cb) {
    sheetRef.current?.classList.remove("ups-sheet--open");
    backdropRef.current?.classList.remove("ups-backdrop--open");
    setTimeout(cb, 340);
  }



  const handleToggle = (idx) => setSelectedSet((p) => {
    const next = new Set(p);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });

  const mainPrice       = mainDisplayTotal ?? mainProduct?.price ?? 0;
  const mainCompareAt   = mainProduct?.originalPrice || mainProduct?.compareAtPrice || (mainProduct?.price ?? 0);
  const selIdxArr       = Array.from(selectedSet);
  const accTotal        = selIdxArr.reduce((sum, idx) => {
    const it = upsell.items[idx]; const ac = accProducts[it.slug];
    return sum + (ac?.price ?? it.fallbackPrice ?? 0);
  }, 0);
  const accCompareTotal = selIdxArr.reduce((sum, idx) => {
    const it = upsell.items[idx]; const ac = accProducts[it.slug];
    const p  = ac?.price ?? it.fallbackPrice ?? 0;
    return sum + (ac?.originalPrice || ac?.compareAtPrice || it.fallbackCompareAt || p);
  }, 0);
  const bundleTotal  = mainPrice + accTotal;
  const bundleSaving = (mainCompareAt + accCompareTotal) - bundleTotal;

  const confirm = (withBundle) => {
    animateClose(() => {
      if (!withBundle || selectedSet.size === 0) { onConfirm(null); return; }
      const bundles = selIdxArr.map(idx => {
        const it = upsell.items[idx];
        const ac = accProducts[it.slug] ?? null;
        const compareAt = ac?.originalPrice || ac?.compareAtPrice || it.fallbackCompareAt || null;
        return { item: it, accProduct: ac, compareAtPrice: compareAt };
      });
      onConfirm({ bundles });
    });
  };

  // Escape = "Continuar sin agregar" (lo mismo que tocar el fondo).
  useDialogA11y(sheetRef, () => confirm(false), { initialFocus: "container" });

  return (
    <>
      <div ref={backdropRef} className="ups-backdrop" role="presentation" onClick={() => confirm(false)} aria-hidden="true" />
      <div ref={sheetRef} tabIndex={-1} className="ups-sheet" role="dialog" aria-modal="true" aria-labelledby="ups-sheet-title">
        <div className="ups-sheet-scroll">
          {/* Cabecera */}
          <div className="ups-sheet-head">
            <div className="ups-sheet-promo-banner">
              <span className="ups-sheet-promo-icon" aria-hidden="true">🏷️</span>
              <span className="ups-sheet-promo-text">DESCUENTOS EXCLUSIVOS PARA TU COMPRA</span>
            </div>
            <h2 className="ups-sheet-title" id="ups-sheet-title">{upsell.title || "¿Querés agregar algo?"}</h2>
            <p className="ups-sheet-sub">Mismo envío · ahorrás más llevando los dos</p>
          </div>

          {/* Lista */}
          <div className="ups-list">
            {(upsell.items || []).map((item, idx) => {
              const acc     = accProducts[item.slug];
              const aPrice  = acc?.price ?? item.fallbackPrice ?? 0;
              const aCmpAt  = acc?.originalPrice || acc?.compareAtPrice || item.fallbackCompareAt || aPrice;
              const aImg    = acc?.imageUrl || item.fallbackImage || FALLBACK_IMG;
              const saving  = aCmpAt - aPrice;
              const isSel   = selectedSet.has(idx);
              return (
                // La fila entera es un atajo de puntero; el control accesible es el botón.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div key={idx} className={`ups-row${isSel ? " ups-row--on" : ""}`}
                  onClick={() => done && handleToggle(idx)}>
                  <SafeImg src={aImg} alt="" name={item.name} className="ups-row-img"
                    widths={THUMB_WIDTHS} sizes="64px" width={64} height={64}
                    referrerPolicy="no-referrer" />
                  <div className="ups-row-info">
                    {item.badge && <span className="ups-row-badge">{item.badge}</span>}
                    <p className="ups-row-name">{item.name}</p>
                    <div className="ups-row-prices">
                      {saving > 0 && <s className="ups-row-was">{moneyARSTight(aCmpAt)}</s>}
                      <span className="ups-row-now">{moneyARSTight(aPrice)}</span>
                      {saving > 0 && <span className="ups-row-save">−{moneyARSTight(saving)}</span>}
                    </div>
                  </div>
                  <button type="button" aria-pressed={isSel}
                    aria-label={`${isSel ? "Quitar" : "Agregar"} ${item.name}`}
                    className={`ups-row-btn${isSel ? " ups-row-btn--on" : ""}`}
                    disabled={!done}
                    onClick={(e) => { e.stopPropagation(); done && handleToggle(idx); }}>
                    {isSel ? "✓" : "+"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="ups-sheet-ctas">
            {selectedSet.size > 0 ? (
              <>
                <button type="button" className="ups-sheet-btn-main" onClick={() => confirm(true)}>
                  Agregar y pagar — {moneyARSTight(bundleTotal)}
                  {bundleSaving > 0 && <span className="ups-sheet-btn-save"> · ahorrás {moneyARSTight(bundleSaving)}</span>}
                </button>
                <button type="button" className="ups-sheet-btn-skip" onClick={() => confirm(false)}>
                  No gracias, solo el producto
                </button>
              </>
            ) : (
              <button type="button" className="ups-sheet-btn-skip ups-sheet-btn-skip--solo" onClick={() => confirm(false)}>
                Continuar sin agregar →
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ups-backdrop { position:fixed; inset:0; background:rgba(11,17,32,0); z-index:10000; transition:background .30s ease; }
        .ups-backdrop--open { background:rgba(11,17,32,.65); backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px); }
        .ups-sheet { position:fixed; top:50%; left:50%; z-index:10001; background:#fff; border-radius:22px; box-shadow:0 24px 80px rgba(11,17,32,.28); width:calc(100% - 32px); max-width:420px; max-height:90dvh; max-height:90vh; display:flex; flex-direction:column; opacity:0; transform:translate(-50%,-50%) scale(.95); transition:opacity .28s ease, transform .28s cubic-bezier(.22,1,.36,1); will-change:transform,opacity; pointer-events:none; }
        .ups-sheet--open { opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto; }
        .ups-sheet-scroll { overflow-y:auto; flex:1; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:20px 18px 24px; }
        .ups-sheet-scroll::-webkit-scrollbar { display:none; }
        .ups-sheet-head { text-align:center; padding:0 0 18px; }
        .ups-sheet-promo-banner { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg,#ff6b00 0%,#ff9500 100%); color:#fff; font-size:.67rem; font-weight:900; letter-spacing:.1em; padding:5px 13px; border-radius:100px; margin-bottom:10px; box-shadow:0 4px 14px rgba(255,107,0,.35); }
        .ups-sheet-promo-icon { font-size:.85rem; line-height:1; }
        .ups-sheet-promo-text { line-height:1; }
        .ups-sheet-title { font-size:1.15rem; font-weight:900; margin:0 0 4px; }
        .ups-sheet-sub { font-size:.78rem; color:rgba(11,18,32,.45); margin:0; font-weight:600; }
        .ups-sheet-ctas { display:flex; flex-direction:column; gap:10px; margin-top:20px; }
        .ups-sheet-btn-main { width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(135deg,var(--pd-accent) 0%,var(--pd-accent-strong) 60%,var(--pd-accent-deep) 100%); color:#fff; font-weight:900; font-size:.97rem; letter-spacing:.03em; cursor:pointer; box-shadow:0 8px 28px rgb(var(--pd-accent-rgb) / .32); transition:transform .12s,box-shadow .12s; }
        .ups-sheet-btn-main:active { transform:scale(.98); box-shadow:0 4px 14px rgb(var(--pd-accent-rgb) / .22); }
        .ups-sheet-btn-save { font-size:.78rem; font-weight:700; opacity:.85; }
        .ups-sheet-btn-skip { width:100%; padding:12px; border:1.5px solid rgba(11,18,32,.15); border-radius:12px; background:none; color:rgba(11,18,32,.60); font-size:.88rem; font-weight:700; cursor:pointer; text-align:center; transition:border-color .15s,color .15s; }
        .ups-sheet-btn-skip:hover { border-color:rgba(11,18,32,.30); color:rgba(11,18,32,.80); }
        .ups-sheet-btn-skip--solo { border-color:rgba(11,18,32,.18); color:rgba(11,18,32,.65); font-size:.92rem; padding:13px; }
      `}</style>
    </>
  );
}

/* =========================
   Stats Circles — gráficos circulares animados
========================= */
