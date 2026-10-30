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
          : <ImgPlaceholder label={images[activeImg]?.label} />
        }
      </div>
      <div className="amp-thumbs" role="group" aria-label="Imágenes del producto">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={`amp-thumb${i === activeImg ? ' active' : ''}`}
            onClick={() => setActiveImg(i)}
            aria-current={i === activeImg ? 'true' : undefined}
            aria-label={`Ver imagen ${i + 1} de ${images.length}`}
          >
            {img.src
              ? <SafeImg src={img.src} alt="" width={56} height={56} sizes="56px" widths={THUMB_WIDTHS} />
              : <ImgPlaceholder label={String(i + 1)} />
            }
          </button>
        ))}
      </div>
    </div>
  );
}
