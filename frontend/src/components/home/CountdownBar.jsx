import { useCountdown } from "../../hooks/useCountdown.js";

/* Misma key que el marquee ("pd_countdown") → los dos muestran el mismo tiempo. */
export default function CountdownBar({ storageKey = "pd_countdown", minutes = 18 }) {
  const time = useCountdown(storageKey, minutes);
  return (
    <p className="hc-cd-bar">
      La oferta de hoy termina en <span className="hc-cd-time">{time}</span>
    </p>
  );
}
