import { useMediaQuery } from "./useMediaQuery.js";

/*
 * `prefers-reduced-motion` reactivo para componentes que animan con CSS o
 * con APIs del DOM (videos, contadores). Los que usan `m.*` de Framer ya
 * respetan la preferencia vía `<MotionConfig reducedMotion="user">`.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
