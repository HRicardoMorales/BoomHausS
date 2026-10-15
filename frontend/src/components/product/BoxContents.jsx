import Reveal from "../motion/Reveal";
export default function BoxContents({ mc = {} }) {
  const items = mc.boxItems || [];
  if (!items.length) return null;

  return (
    <Reveal as="section" className="boxc">
      <div className="boxc-header">
        <span className="boxc-header-icon">📦</span>
        <div>
          <div className="boxc-header-kicker">TODO INCLUIDO</div>
          <div className="boxc-header-title">¿Qué viene en la caja?</div>
        </div>
      </div>
      <div className="boxc-grid">
        {items.map((item, i) => (
          <div
            key={i}
            className="boxc-item"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="boxc-item-icon">{item.icon}</div>
            <div className="boxc-item-info">
              <div className="boxc-item-name">{item.name}</div>
              {item.qty && <div className="boxc-item-qty">{item.qty}</div>}
            </div>
            <div className="boxc-item-check">✓</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
