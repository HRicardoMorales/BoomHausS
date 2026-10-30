import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { HERO_SIZES, THUMB_WIDTHS } from '../../../components/landing/imageSizes';

/* Galería del hero: imagen principal (LCP, con priority) + miniaturas.
   El índice activo vive acá: cambiar de foto ya no re-renderiza la landing. */
export default function HeroGallery({ images }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = images[activeIdx];
  return (
    <div className="ipl-gallery">
      <div className="ipl-gallery-main">
        <SafeImg
          src={active.src}
          alt={active.alt}
          width={800}
          height={800}
          sizes={HERO_SIZES}
          priority
        />
      </div>
      <div className="ipl-thumbs" role="group" aria-label="Imágenes del producto">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={`ipl-thumb${i === activeIdx ? ' ipl-thumb-active' : ''}`}
            onClick={() => setActiveIdx(i)}
            aria-current={i === activeIdx ? 'true' : undefined}
            aria-label={`Ver imagen ${i + 1} de ${images.length}`}
          >
            <SafeImg src={img.src} alt="" width={60} height={60} sizes="60px" widths={THUMB_WIDTHS} />
          </button>
        ))}
      </div>
    </div>
  );
}
