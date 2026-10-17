import { useEffect, useState } from "react";

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Cuenta de 0 a `target` con rAF cuando `active` pasa a true (una vez por
 * `target`). Con `instant` (reduced motion) devuelve el valor final sin animar.
 * El estado solo se actualiza dentro del callback de rAF, nunca en el cuerpo
 * del effect.
 */
export function useCountUp(target, { active, duration = 1400, instant = false } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || instant) return undefined;
    let raf = 0;
    let start = 0;
    const tick = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, instant]);

  return instant ? target : value;
}
