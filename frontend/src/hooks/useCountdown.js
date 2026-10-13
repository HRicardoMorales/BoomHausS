import { useEffect, useState } from "react";

function readTarget(storageKey) {
  try {
    return Number(sessionStorage.getItem(storageKey)) || 0;
  } catch {
    return 0; // storage bloqueado (modo privado de Safari, iframes)
  }
}

function saveTarget(storageKey, target) {
  try {
    sessionStorage.setItem(storageKey, String(target));
  } catch { /* sin storage el contador igual corre, solo no se comparte */ }
}

/**
 * Cuenta regresiva "mm:ss" persistida en sessionStorage. Componentes con la
 * misma `storageKey` (marquee y home usan "pd_countdown") muestran el mismo
 * tiempo aunque se monten en momentos distintos.
 */
export function useCountdown(storageKey, minutes) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const saved = readTarget(storageKey);
    const target = saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;
    saveTarget(storageKey, target);

    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, minutes]);

  const totalSec = Math.floor(left / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
