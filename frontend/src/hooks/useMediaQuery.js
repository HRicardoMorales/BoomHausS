import { useCallback, useSyncExternalStore } from "react";

const hasMatchMedia = () => typeof window !== "undefined" && !!window.matchMedia;

/**
 * Media query reactiva con `useSyncExternalStore` (sin estado duplicado ni
 * efecto que lo sincronice). En SSR/tests sin `matchMedia` devuelve `false`.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      if (!hasMatchMedia()) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  const getSnapshot = () => hasMatchMedia() && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
