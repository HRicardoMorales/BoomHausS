import { useState } from "react";
import MC from "../../../landings/mundial-revendedores.js";
import { moneyARS } from "./utils";
import "./ProfitCalculator.css";

/* =========================
   PROFIT CALCULATOR — el corazón
========================= */
export function ProfitCalculator({ onBuyNow }) {
  // Productos sin el kit (el kit tiene su propia tarjeta)
  const products = MC.products.filter((p) => !p.isKit);
  const [slug, setSlug] = useState(products[0]?.slug || "");
  const [packs, setPacks] = useState(2);

  const product = products.find((p) => p.slug === slug) || products[0];

  // Cálculo aritmético barato: se recalcula en cada render (sin useMemo).
  const calc = (() => {
    if (!product) return null;
    const inversion = product.price * packs;
    const totalUnits = product.unitsPerPack * packs;
    const ingreso = product.suggestedResale * totalUnits;
    const ganancia = ingreso - inversion;
    const margen = inversion > 0 ? Math.round((ganancia / inversion) * 100) : 0;
    const porUnidad = product.price / product.unitsPerPack;
    // Multiplicador "por cada $1 invertido te llevás $X"
    const multiplicador = inversion > 0 ? ingreso / inversion : 0;
    // Ganancia por unidad (venta sugerida - costo por unidad)
    const gananciaPorUnidad = product.suggestedResale - porUnidad;
    return { inversion, totalUnits, ingreso, ganancia, margen, porUnidad, multiplicador, gananciaPorUnidad };
  })();

  if (!product || !calc) return null;

  const decPacks = () => setPacks((p) => Math.max(1, p - 1));
  const incPacks = () => setPacks((p) => Math.min(99, p + 1));

  return (
    <div className="ml-calc anim-el">
      {/* HEAD compacto */}
      <div className="ml-calc-head">
        <div className="ml-calc-kicker">CALCULÁ LO QUE GANÁS</div>
        <h2 className="ml-calc-title">Elegí un producto y mirá tu ganancia</h2>
      </div>

      {/* Selector de producto — tabs horizontales con scroll */}
      <div className="ml-calc-tabs-wrap">
        <div className="ml-calc-tabs-hint">← Deslizá para ver más productos →</div>
        <div className="ml-calc-tabs" role="tablist" aria-label="Producto">
          {products.map((p) => {
            const active = slug === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                role="tab"
                aria-selected={active}
                className={`ml-calc-tab ${active ? "is-on" : ""}`}
                onClick={() => setSlug(p.slug)}
              >
                {p.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel unificado */}
      <div className="ml-calc-panel">
        {/* BIG profit highlight — lo primero que ve el cliente */}
        <div className="ml-calc-hero">
          <div className="ml-calc-hero-eq">
            <div className="ml-calc-hero-col">
              <div className="ml-calc-hero-lbl">PONÉS</div>
              <div className="ml-calc-hero-val ml-calc-hero-val--cost">{moneyARS(calc.inversion)}</div>
            </div>
            <div className="ml-calc-hero-arrow" aria-hidden="true">→</div>
            <div className="ml-calc-hero-col">
              <div className="ml-calc-hero-lbl">GANÁS</div>
              <div className="ml-calc-hero-val ml-calc-hero-val--profit">+{moneyARS(calc.ganancia)}</div>
            </div>
          </div>
          <div className="ml-calc-hero-mult">
            Por cada <strong>$1</strong> que invertís, te llevás <strong>${calc.multiplicador.toFixed(1)}</strong>
          </div>
        </div>

        {/* Stepper de cantidad */}
        <div className="ml-calc-stepper-row">
          <div className="ml-calc-stepper-lbl">
            <div className="ml-calc-stepper-lbl-top">¿CUÁNTOS PACKS?</div>
            <div className="ml-calc-stepper-lbl-sub">
              = <strong>{calc.totalUnits}</strong> unidades para vender
            </div>
          </div>
          <div className="ml-calc-stepper">
            <button type="button" className="ml-calc-stepper-btn" onClick={decPacks} aria-label="Restar">−</button>
            <div className="ml-calc-stepper-val">{packs}</div>
            <button type="button" className="ml-calc-stepper-btn" onClick={incPacks} aria-label="Sumar">+</button>
          </div>
        </div>

        {/* Detalles — compactos y claros */}
        <div className="ml-calc-mini">
          <div className="ml-calc-mini-item">
            <span className="ml-calc-mini-lbl">Cada unidad te cuesta</span>
            <span className="ml-calc-mini-val">{moneyARS(calc.porUnidad)}</span>
          </div>
          <div className="ml-calc-mini-item">
            <span className="ml-calc-mini-lbl">Podés venderla a</span>
            <span className="ml-calc-mini-val">{moneyARS(product.suggestedResale)}</span>
          </div>
          <div className="ml-calc-mini-item ml-calc-mini-item--hi">
            <span className="ml-calc-mini-lbl">Ganás por unidad</span>
            <span className="ml-calc-mini-val">+{moneyARS(calc.gananciaPorUnidad)}</span>
          </div>
        </div>

        {/* CTA final */}
        <button
          type="button"
          className="ml-calc-go"
          onClick={() => onBuyNow?.(product, packs)}
        >
          <span>Comprar {packs} pack{packs > 1 ? "s" : ""} · {moneyARS(calc.inversion)}</span>
          <span className="ml-calc-go-arrow" aria-hidden="true">→</span>
        </button>
        <div className="ml-calc-go-sub">
          🚚 Envío gratis · 📦 Sale hoy · 💬 WhatsApp directo
        </div>
      </div>
    </div>
  );
}
