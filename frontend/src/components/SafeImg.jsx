// frontend/src/components/SafeImg.jsx
//
// <img> con fallback graceful. Reemplaza:
//   - src vacio/null → nunca renderiza <img src=""> (que rompe seguro y
//     muestra alt text pelado o icono roto del browser).
//   - onError (404, CORS, hotlink bloqueado, dominio muerto) → swap a un
//     placeholder disenado (monograma de marca + nombre del producto) que
//     lee como "foto en camino", no como "sitio roto".
//
// Uso:
//   <SafeImg src={product.images[0]} name={product.name} alt="..." />
//
// Props:
//   src        URL de la imagen. Si vacia/null, se renderiza fallback.
//   name       Nombre del producto — se muestra en el placeholder.
//   alt        Alt text para accesibilidad (default: name).
//   className  Se pasa tanto al <img> como al <div> fallback.
//   width, height  Dimensiones intrínsecas (reservan espacio → sin CLS).
//   sizes      Atributo `sizes` para el srcset (default "100vw").
//   widths     Anchos del srcset. Solo aplica a CDNs transformables
//              (Cloudinary, Pexels; ver utils/imageCdn.js). `false` lo apaga.
//   priority   Imagen above-the-fold (LCP): loading="eager" + fetchpriority="high".
//              Sin priority: loading="lazy" y decoding="async" por defecto.
//   style, loading, decoding, referrerPolicy, crossOrigin, draggable — passthrough.

import { useState } from 'react';
import { responsiveImage, DEFAULT_WIDTHS } from '../utils/imageCdn.js';

import { BRAND_MONOGRAM as BRAND_MONO } from '../config/brand.js';
import './SafeImg.css';

export default function SafeImg({
    src,
    name,
    alt,
    className = '',
    style,
    width,
    height,
    sizes = '100vw',
    widths = DEFAULT_WIDTHS,
    priority = false,
    loading,
    decoding,
    referrerPolicy,
    crossOrigin,
    draggable,
}) {
    // Guardamos QUÉ src falló en vez de un booleano: si el mismo <SafeImg> se
    // reutiliza con otra URL (ej. carousel), el fallback se resetea solo,
    // sin un useEffect que dispare un render extra.
    const [failedSrc, setFailedSrc] = useState(null);
    const failed = failedSrc !== null && failedSrc === src;
    const hasSrc = src && String(src).trim();

    if (!hasSrc || failed) {
        const label = name || alt || 'Producto';
        return (
            <div
                className={`safeimg-fallback ${className}`.trim()}
                style={style}
                role="img"
                aria-label={label}
            >
                <div className="safeimg-fallback-mono" aria-hidden="true">{BRAND_MONO}</div>
                <div className="safeimg-fallback-name">{label}</div>
            </div>
        );
    }

    const responsive = widths ? responsiveImage(src, { widths }) : { src, srcSet: undefined };

    return (
        <img
            src={responsive.src}
            srcSet={responsive.srcSet}
            sizes={responsive.srcSet ? sizes : undefined}
            alt={alt ?? name ?? ''}
            className={className}
            style={style}
            width={width}
            height={height}
            loading={loading ?? (priority ? 'eager' : 'lazy')}
            decoding={decoding ?? (priority ? undefined : 'async')}
            fetchPriority={priority ? 'high' : undefined}
            referrerPolicy={referrerPolicy}
            crossOrigin={crossOrigin}
            draggable={draggable}
            onError={() => setFailedSrc(src)}
        />
    );
}
