// frontend/src/components/marquee.jsx
import { useCountdown } from "../hooks/useCountdown.js";

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

  // La pista se duplica para el loop infinito (translateX -50%); la copia
  // va con aria-hidden para que los lectores lean los avisos una sola vez.
  // El contador no es aria-live: se anunciaría cada segundo.
  const renderItems = () =>
    items.map((item, i) => (
      <span key={i} className={`marquee__item${item.highlight ? " marquee__item--flash" : ""}`}>
        {item.text}
        {item.suffix && <span className="marquee__cd-time">{item.suffix}</span>}
      </span>
    ));

  return (
    <aside className="marquee" aria-label="Oferta y beneficios">
      <div className="marquee__track">
        {renderItems()}
        <span className="marquee__copy" aria-hidden="true">{renderItems()}</span>
      </div>
    </aside>
  );
}
