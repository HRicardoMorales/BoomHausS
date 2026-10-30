import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { HERO_SIZES, THUMB_WIDTHS } from '../../../components/landing/imageSizes';

/* Galería del hero: imagen principal (LCP, con priority) + miniaturas. El índice activo vive acá */
export default function HeroGallery({ images }) {
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="pdx-gallery">
      <div className="pdx-gallery-main">
        {images[activeImg]?.src && (
          <SafeImg
            src={images[activeImg].src}
            alt={images[activeImg].alt}
            width={800}
            height={800}
            sizes={HERO_SIZES}
            priority
          />
        )}
      </div>
      <div className="pdx-thumbs">
        {images.map((img, i) => (
          <div
            key={i}
            className={`pdx-thumb${i === activeImg ? ' pdx-thumb-active' : ''}`}
            onClick={() => setActiveImg(i)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
            aria-label={`Imagen ${i + 1}`}
          >
            <SafeImg src={img.src} alt="" width={60} height={60} sizes="60px" widths={THUMB_WIDTHS} />
          </div>
        ))}
      </div>
    </div>
  );
}
