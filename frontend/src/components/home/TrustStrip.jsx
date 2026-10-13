const TRUST_ITEMS = [
  { ico: "🚚", lbl: "Envío", val: "Gratis a todo el país" },
  { ico: "💳", lbl: "Pagás con", val: "Mercado Pago" },
  { ico: "🔒", lbl: "Compra", val: "100% segura" },
  { ico: "📦", lbl: "Stock", val: "Real · sale hoy" },
];

export default function TrustStrip({ items = TRUST_ITEMS }) {
  return (
    <div className="hc-trust">
      {items.map((t, i) => (
        <div
          key={t.lbl}
          className="hc-trust-item reveal"
          style={{ transitionDelay: `${i * 55}ms` }}
        >
          <span className="hc-trust-ico" aria-hidden="true">{t.ico}</span>
          <span className="hc-trust-lbl">{t.lbl}</span>
          <span className="hc-trust-val">{t.val}</span>
        </div>
      ))}
    </div>
  );
}
