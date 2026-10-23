import SafeImg from "../../SafeImg";
import "./WineStorySections.css";

/*
 * Bloques narrativos opcionales de las landings "wine" (masajeadores EMS y
 * facial). Cada uno recibe su porción del config y devuelve `null` si no hay
 * datos, así la landing los renderiza siempre y el contenido decide qué se ve.
 */

const WIDE_SIZES = "(min-width: 720px) 640px, 100vw";

/** Problema → "la buena noticia" → beneficios. Config: `circulacion`. */
export function CirculacionSection({ data: d }) {
  if (!d) return null;
  return (
    <div className="circ-section">
      <h2 className="circ-title">{d.title}</h2>
      {d.img && <SafeImg className="circ-img" src={d.img} alt={d.imgAlt || ""} sizes={WIDE_SIZES} />}
      {d.quote && <p className="circ-quote">{d.quote}</p>}
      {d.textHtml && <p className="circ-text" dangerouslySetInnerHTML={{ __html: d.textHtml }} />}
      {d.buenaNoticia && <h2 className="circ-title-buena">{d.buenaNoticia}</h2>}
      {d.img2 && <SafeImg className="circ-img" src={d.img2} alt={d.img2Alt || ""} sizes={WIDE_SIZES} />}
      {d.title2 && <h2 className="circ-title2">{d.title2}</h2>}
      {d.ctaBadge && (
        <div className="circ-badge-pill">
          <span className="circ-badge-dot" aria-hidden="true" />
          {d.ctaBadge}
        </div>
      )}
      {d.bullets?.length > 0 && (
        <ul className="circ-bullets">
          {d.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      {d.footnote && <p className="circ-footnote">{d.footnote}</p>}
    </div>
  );
}

/** Línea de tiempo de resultados por semana. Config: `cuatroSemanas`. */
export function CuatroSemanasSection({ data: d }) {
  if (!d?.weeks?.length) return null;
  return (
    <div className="semanas-section">
      <h2 className="semanas-title">
        {d.title}<br /><span className="semanas-accent">{d.titleAccent}</span>
      </h2>
      {d.subtitle && <p className="semanas-sub">{d.subtitle}</p>}
      <ol className="semanas-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {d.weeks.map((w, i) => (
          <li key={i} className="semana-row">
            <div className="semana-left">
              <span className="semana-badge">{w.label}</span>
              {i < d.weeks.length - 1 && <div className="semana-line" aria-hidden="true" />}
            </div>
            <div className="semana-content">
              <h3 className="semana-content-title">{w.title}</h3>
              <p className="semana-content-desc">{w.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      {d.img && <SafeImg className="semanas-img" src={d.img} alt={d.imgAlt || ""} sizes={WIDE_SIZES} />}
    </div>
  );
}

/** Modo de uso en pasos numerados + CTA. Config: `tresPasos`. */
export function TresPasosSection({ data: d, onBuy }) {
  if (!d?.steps?.length) return null;
  return (
    <div className="pasos-section">
      {d.kicker && <div className="pasos-kicker">{d.kicker}</div>}
      <h2 className="pasos-title">{d.title}</h2>
      {d.subtitle && <p className="pasos-sub">{d.subtitle}</p>}
      <ol className="pasos-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {d.steps.map((s, i) => (
          <li key={i} className="paso-item">
            <div className="paso-circle-wrap">
              {s.img
                ? <SafeImg className="paso-circle-img" src={s.img} alt={s.imgAlt || s.title} width={120} height={120} sizes="120px" widths={[240]} />
                : <div className="paso-circle-ph" />}
              <span className="paso-num-badge" aria-hidden="true">{s.num}</span>
            </div>
            <h3 className="paso-title">{s.title}</h3>
            <p className="paso-desc">{s.desc}</p>
          </li>
        ))}
      </ol>
      {d.ctaText && onBuy && (
        <button type="button" className="pasos-cta" onClick={onBuy}>{d.ctaText}</button>
      )}
    </div>
  );
}
