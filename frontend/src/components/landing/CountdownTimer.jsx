import { useEffect, useState } from "react";
import "./CountdownTimer.css";

/**
 * Lee (o crea) la fecha límite de la oferta en sessionStorage, para que el
 * contador no se reinicie al recargar dentro de la misma sesión.
 * sessionStorage puede tirar en algunos navegadores in-app o en modo privado:
 * en ese caso el contador funciona igual, solo que sin persistir.
 */
function readDeadline(storageKey, minutes) {
  const now = Date.now();
  const fresh = now + minutes * 60 * 1000;
  try {
    const saved = Number(sessionStorage.getItem(storageKey));
    if (saved > now) return saved;
    sessionStorage.setItem(storageKey, String(fresh));
  } catch {
    /* sin storage: no persiste entre recargas */
  }
  return fresh;
}

function format(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Contador regresivo de oferta compartido por las landings y ProductDetail
 * (antes había 5 copias idénticas salvo por la `storageKey`).
 *
 * - La fecha límite se calcula en el primer render (sin el "00:00" inicial
 *   que mostraban las copias viejas hasta que corría el effect).
 * - El intervalo se corta al llegar a cero.
 * - `role="timer"`: los lectores de pantalla no anuncian cada segundo.
 */
export default function CountdownTimer({ storageKey, minutes = 18, className = "lp-countdown" }) {
  const [deadline] = useState(() => readDeadline(storageKey, minutes));
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, deadline - now);
  const running = left > 0;

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  return (
    <span className={className} role="timer" aria-atomic="true">
      {format(left)}
    </span>
  );
}
