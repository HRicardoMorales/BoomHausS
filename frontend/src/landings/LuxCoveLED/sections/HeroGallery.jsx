import SafeImg from '../../../components/SafeImg';
import { HERO_SIZES, THUMB_WIDTHS } from '../../../components/landing/imageSizes';

/* Galería del hero: imagen principal (LCP, con priority) + tira de miniaturas.
   El índice activo vive en el padre porque se resetea al cambiar ?regalo=. */
export default function HeroGallery({ images, activeIdx, onSelect }) {
  const active = images[activeIdx];
  return (
    <div className="led-gallery">
      <div className="led-gallery-main">
        {active?.src
          ? <SafeImg src={active.src} alt={active.alt} width={800} height={800} sizes={HERO_SIZES} priority />
          : <div className="led-img-placeholder led-img-placeholder--hero">{active?.alt}</div>
        }
      </div>
      <div className="led-thumbs" role="group" aria-label="Imágenes del producto">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={`led-thumb${i === activeIdx ? ' led-thumb-active' : ''}`}
            onClick={() => onSelect(i)}
            aria-current={i === activeIdx ? 'true' : undefined}
            aria-label={`Ver imagen ${i + 1} de ${images.length}`}
          >
            {img.src
              ? <SafeImg src={img.src} alt="" width={70} height={70} sizes="70px" widths={THUMB_WIDTHS} />
              : <span className="led-img-placeholder led-img-placeholder--thumb" aria-hidden="true">{i + 1}</span>
            }
          </button>
        ))}
      </div>
    </div>
  );
}
