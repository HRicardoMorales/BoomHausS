export default function HomeHero({ storeName, maxDiscount, onExplore }) {
  return (
    <section className="hc-hero">
      <div className="hc-hero-inner">
        <div className="hc-hero-eyebrow">
          <span className="hc-hero-eyebrow-dot" />
          {storeName}
        </div>
        <h1 className="hc-hero-title">
          Todo lo que buscás,<br />
          <span>al mejor precio</span>
        </h1>
        <p className="hc-hero-sub">
          Productos seleccionados · Stock real · Envío a todo el país
        </p>
        <div className="hc-hero-actions">
          <button type="button" className="hc-hero-cta" onClick={onExplore}>
            Explorar catálogo <span style={{ fontSize: "1.1em" }} aria-hidden="true">↓</span>
          </button>
          {maxDiscount > 0 && (
            <span className="hc-hero-badge">
              🔖 Hasta -{maxDiscount}% OFF
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
