import { useSyncExternalStore } from "react";

/*
 * `prefers-reduced-motion` reactivo sin Framer Motion: la home vive en el
 * chunk inicial y Framer ahí sumaría ~35 KB gzip por un matchMedia.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
