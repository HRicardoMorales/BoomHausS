/**
 * Resumen de calificación del hero de la ficha: iniciales de quienes dejaron
 * opinión + "Calificado 4,8/5 basado en +234 reseñas".
 *
 * Todo sale del config de la landing (`reviewScore`, `reviewCount` y los
 * nombres de `miniReviews` / `reviewsCarousel`). Antes eran tres fotos de
 * bancos de imágenes hotlinkeadas y un "4.5/5 · +650" fijo para cualquier
 * producto; si el config no trae números, el bloque no se muestra.
 */
const MAX_AVATARS = 3;

function initials(name = "") {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const scoreFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

export default function RatingSummary({ mc }) {
  const count = Number(mc?.reviewCount) || 0;
  const score = Number(mc?.reviewScore) || 0;
  if (!count || !score) return null;

  const people = [...(mc.miniReviews || []), ...(mc.reviewsCarousel || [])]
    .map((r) => initials(r?.name))
    .filter(Boolean)
    .filter((v, i, all) => all.indexOf(v) === i)
    .slice(0, MAX_AVATARS);

  return (
    <div className="reviews-container">
      {people.length > 0 && (
        <div className="avatars" aria-hidden="true">
          {people.map((ini) => (
            <span key={ini} className="avatar avatar--initials">{ini}</span>
          ))}
        </div>
      )}
      <span className="text-grey">
        Calificado <strong>{scoreFormat.format(score)}/5</strong> basado en{" "}
        <strong>+{count.toLocaleString("es-AR")} reseñas</strong>
      </span>
    </div>
  );
}
