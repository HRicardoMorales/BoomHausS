import { REVIEWS_DATA } from '../data';
import { IconCheckCircle } from '../icons';

export default function Reviews() {
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <span className="amp-eyebrow amp-eyebrow-stars" role="img" aria-label="5 de 5 estrellas">★★★★★</span>
        <h2 className="amp-sec-h2">Lo que dicen quienes ya lo probaron</h2>
        <p className="amp-sec-sub">Reseñas de clientes reales. *Ejemplos — reemplazar por reseñas verificadas antes de publicar.</p>
        <div className="amp-reviews-grid">
          {REVIEWS_DATA.map((r, i) => (
            <div key={i} className="amp-review-card">
              <div className="amp-review-stars" role="img" aria-label={`${r.stars} de 5 estrellas`}>{'★'.repeat(r.stars)}</div>
              <h3>{r.title}</h3>
              <p>&ldquo;{r.text}&rdquo;</p>
              <div className="amp-review-name">{r.name}</div>
              <div className="amp-review-verified"><IconCheckCircle /> Compra verificada</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
