import { useCountdown } from "../../hooks/useCountdown.js";

/* Misma key que el marquee ("pd_countdown") → los dos muestran el mismo tiempo. */
export default function CountdownBar({ storageKey = "pd_countdown", minutes = 18 }) {
  const time = useCountdown(storageKey, minutes);
  return (
    <div className="hc-cd-bar">
      <span className="hc-cd-text">⚡ Oferta relámpago termina en</span>
      <span className="hc-cd-sep" />
      <span className="hc-cd-time">{time}</span>
      <span className="hc-cd-sep" />
      <span className="hc-cd-cta">Aprovechá ahora</span>
    </div>
  );
}
