import { useCallback, useMemo, useState } from "react";
import { defaultBundleIdx } from "../../components/product/landingConfig";

/**
 * Selección de variante → color → pack de una landing.
 *
 * Al elegir otra variante se reinician el color y (si la variante trae sus
 * propios packs) el pack por defecto, en el mismo evento: antes era un
 * `useEffect` sobre el índice que hacía un render extra con el color/pack de
 * la variante anterior.
 */
export function useLandingVariants(config) {
  const variants = config.variants || null;

  const [variantIdx, setVariantIdx] = useState(() => config.defaultVariantIdx ?? 0);
  // Siempre arranca en el primer color: el código anterior reiniciaba el color
  // en el montaje (effect sobre el índice de variante), así que
  // `defaultColorIdx` nunca tuvo efecto en producción y el de lampara-magnetica
  // (3) ni siquiera existe en su variante por defecto.
  const [colorIdx, setColorIdx] = useState(0);
  const [bundleIdx, setBundleIdx] = useState(() => {
    const variant = variants?.[config.defaultVariantIdx ?? 0];
    return defaultBundleIdx(config, variant?.bundles || config.bundles);
  });

  const activeVariant = useMemo(() => (variants ? variants[variantIdx] || null : null), [variants, variantIdx]);
  const activeColorVariant = activeVariant?.colorVariants?.[colorIdx] || null;

  const selectVariant = useCallback(
    (idx) => {
      if (idx === variantIdx) return;
      setVariantIdx(idx);
      setColorIdx(0);
      const next = variants?.[idx];
      if (next?.bundles) setBundleIdx(defaultBundleIdx(config, next.bundles));
    },
    [config, variants, variantIdx]
  );

  return {
    variantIdx,
    colorIdx,
    bundleIdx,
    activeVariant,
    activeColorVariant,
    selectVariant,
    selectColor: setColorIdx,
    selectBundle: setBundleIdx,
  };
}

