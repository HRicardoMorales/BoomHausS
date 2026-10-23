/*
 * Franja "visto en": en vez de logos de prensa (que la tienda no tiene) muestra
 * dónde la gente descubre los productos — el tráfico real llega desde los
 * anuncios de Instagram y Facebook. Texto (no logos de marcas) en un marquee
 * CSS; la copia del loop va con aria-hidden para que se lea una sola vez.
 */
const CHANNELS = ["Instagram", "Reels", "Facebook", "Stories", "WhatsApp"];

export default function SeenInStrip({ channels = CHANNELS }) {
  const row = (hidden) => (
    <ul className="hc-seen-row" aria-hidden={hidden || undefined}>
      {channels.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );

  return (
    <section className="hc-seen" aria-label="Dónde nos conocen">
      <p className="hc-seen-label">Lo viste en</p>
      <div className="hc-seen-track">
        <div className="hc-seen-loop">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
