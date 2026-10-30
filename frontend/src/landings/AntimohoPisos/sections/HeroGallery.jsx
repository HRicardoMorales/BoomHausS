import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { HERO_SIZES, THUMB_WIDTHS } from '../../../components/landing/imageSizes';
import { ImgPlaceholder } from './ui';

/* Galería — usa fotos reales del producto si ya las cargaste
   en /admin/products; si no, muestra los placeholders. */
export default function HeroGallery({ images }) {
  const [activeImg, setActiveImg] = useState(0);
  return (
    <div className="amp-gallery">
      <div className="amp-gallery-main">
        {images[activeImg]?.src
          ? <SafeImg src={images[activeImg].src} alt={images[activeImg].alt} width={800} height={800} sizes={HERO_SIZES} priority />
          : <ImgPlaceholder label={images[activeImg]?.label} style={{ minHeight: 320 }} />
        }
      </div>
      <div className="amp-thumbs">
        {images.map((img, i) => (
          <div
            key={i}
            className={`amp-thumb${i === activeImg ? ' active' : ''}`}
            onClick={() => setActiveImg(i)}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveImg(i)}
            aria-label={`Imagen ${i + 1}`}
          >
            {img.src
              ? <SafeImg src={img.src} alt="" width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
              : <ImgPlaceholder label={String(i + 1)} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}
