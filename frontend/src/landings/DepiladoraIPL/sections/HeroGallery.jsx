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
      <div className="ipl-thumbs">
        {images.map((img, i) => (
          <div
            key={i}
            className={`ipl-thumb${i === activeIdx ? ' ipl-thumb-active' : ''}`}
            onClick={() => setActiveIdx(i)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveIdx(i)}
            aria-label={`Imagen ${i + 1}`}
          >
            <SafeImg src={img.src} alt="" width={60} height={60} sizes="60px" widths={THUMB_WIDTHS} />
          </div>
        ))}
      </div>
    </div>
  );
}
