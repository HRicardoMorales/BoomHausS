// frontend/src/components/Marquee.jsx
import { useEffect, useState } from "react";

function useCountdown(storageKey, minutes) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    const target =
      saved && saved > Date.now() ? saved : Date.now() + minutes * 60 * 1000;
    sessionStorage.setItem(storageKey, String(target));

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

export default function Marquee({
  countdownKey = "pd_countdown",
  countdownMinutes = 18,
}) {
  const time = useCountdown(countdownKey, countdownMinutes);

  // Los items se construyen con el tiempo reactivo dentro del primero
  const items = [
    { text: "⚡ Oferta relámpago", suffix: time, highlight: true },
    { text: "🔒 Compra protegida" },
    { text: "🚚 Envío gratis a todo el país" },
  ];

  const loop = [...items, ...items];

  return (
    <div className="marquee" aria-label="Oferta y beneficios">
      <div className="marquee__track">
        {loop.map((item, i) => (
          <span key={i} className={`marquee__item${item.highlight ? " marquee__item--flash" : ""}`}>
            {item.text}
            {item.suffix && (
              <span className="marquee__cd-time" aria-live="polite">{item.suffix}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
