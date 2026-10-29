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
      <div className="led-thumbs">
        {images.map((img, i) => (
          <div
            key={i}
            className={`led-thumb${i === activeIdx ? ' led-thumb-active' : ''}`}
            onClick={() => onSelect(i)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelect(i)}
            aria-label={`Imagen ${i + 1}`}
          >
            {img.src
              ? <SafeImg src={img.src} alt="" width={70} height={70} sizes="70px" widths={THUMB_WIDTHS} />
              : <div className="led-img-placeholder led-img-placeholder--thumb">{i + 1}</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}
