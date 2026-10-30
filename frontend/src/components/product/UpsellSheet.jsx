import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import SafeImg from "../SafeImg";
import { THUMB_WIDTHS } from "../landing/imageSizes";
import { FALLBACK_IMG } from "./format";
import { moneyARSTight } from "../../utils/pricing.js";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import "./UpsellSheet.css";

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
    </>
  );
}
