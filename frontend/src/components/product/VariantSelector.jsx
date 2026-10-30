import SafeImg from "../SafeImg";
import { THUMB_WIDTHS } from "../landing/imageSizes";
import { moneyARSTight } from "../../utils/pricing.js";

/**
 * Selector de variantes en dos niveles (modelo → color) con miniatura.
 * Solo se muestra si la landing define más de una variante; el nivel de
 * color aparece cuando la variante activa trae `colorVariants`.
 * Los botones usan `aria-pressed` para exponer la selección.
 */
export default function VariantSelector({
  variants,
  selectedIdx,
  onSelect,
  activeVariant,
  selectedColorIdx,
  onSelectColor,
}) {
  if (!variants || variants.length <= 1) return null;
  return (
    <div className="vsel2-wrap">
      <div className="vsel2-label">Elegí tu versión</div>
      <div className="vsel2-grid">
        {variants.map((v, i) => {
          const img = v.thumbImg ?? v.images?.[0];
          const isOn = selectedIdx === i;
          return (
            <button
              key={v.id}
              type="button"
              className={`vsel2-card${isOn ? " vsel2-card--on" : ""}`}
              onClick={() => onSelect(i)}
              aria-pressed={isOn}
            >
              <div className="vsel2-img-wrap">
                {img
                  ? <SafeImg src={img} alt="" name={v.name} className="vsel2-img" widths={THUMB_WIDTHS} sizes="72px" width={72} height={72} />
                  : <div className="vsel2-img-ph" />
                }
                {v.badge && <span className="vsel2-badge">{v.badge}</span>}
              </div>
              <div className="vsel2-name">{v.name}</div>
              {v.bundles?.[0]?.price && (
                <div className="vsel2-from">desde {moneyARSTight(v.bundles[0].price)}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nivel 2: color — solo visible cuando la variante activa tiene colorVariants */}
      {activeVariant?.colorVariants?.length > 0 && (
        <div className="vsel2-sub">
          <div className="vsel2-sub-label">Color</div>
          <div className="vsel2-sub-grid">
            {activeVariant.colorVariants.map((cv, ci) => {
              const img = cv.thumbImg ?? cv.images?.[0];
              const isOn = selectedColorIdx === ci;
              return (
                <button
                  key={cv.id}
                  type="button"
                  className={`vsel2-card${isOn ? " vsel2-card--on" : ""}`}
                  onClick={() => onSelectColor(ci)}
                  aria-pressed={isOn}
                >
                  <div className="vsel2-img-wrap">
                    {img
                      ? <SafeImg src={img} alt="" name={cv.name} className="vsel2-img" widths={THUMB_WIDTHS} sizes="56px" width={56} height={56} />
                      : <div className="vsel2-img-ph" />
                    }
                  </div>
                  <div className="vsel2-name">{cv.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="vsel-divider" />
    </div>
  );
}
