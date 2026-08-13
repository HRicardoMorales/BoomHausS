// frontend/src/components/SafeImg.jsx
//
// <img> con fallback graceful. Reemplaza:
//   - src vacio/null → nunca renderiza <img src=""> (que rompe seguro y
//     muestra alt text pelado o icono roto del browser).
//   - onError (404, CORS, hotlink bloqueado, dominio muerto) → swap a un
//     placeholder con el nombre del producto en vez del icono roto.
//
// Uso:
//   <SafeImg src={product.images[0]} name={product.name} alt="..." />
//
// Props:
//   src        URL de la imagen. Si vacia/null, se renderiza fallback.
//   name       Nombre del producto — se muestra en el placeholder.
//   alt        Alt text para accesibilidad (default: name).
//   className  Se pasa tanto al <img> como al <div> fallback.
//   style, loading, decoding, referrerPolicy, crossOrigin — passthrough a <img>.

import { useState, useEffect } from 'react';

export default function SafeImg({
    src,
    name,
    alt,
    className = '',
    style,
    loading,
    decoding,
    referrerPolicy,
    crossOrigin,
}) {
    const [failed, setFailed] = useState(false);
    const hasSrc = src && String(src).trim();

    // Reset failed cuando cambia src (el mismo <SafeImg> puede reutilizarse
    // con nueva URL, ej. carousel de imagenes).
    useEffect(() => { setFailed(false); }, [src]);

    if (!hasSrc || failed) {
        const label = name || alt || 'Producto';
        return (
            <div
                className={`safeimg-fallback ${className}`.trim()}
                style={style}
                role="img"
                aria-label={label}
            >
                <span className="safeimg-fallback-name">{label}</span>
                <style>{`
                    .safeimg-fallback {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        background: linear-gradient(135deg, #F5F0E8, #EDE8DF);
                        color: #6B5D4E;
                        padding: 16px;
                        box-sizing: border-box;
                        width: 100%;
                        height: 100%;
                        font-family: inherit;
                    }
                    .safeimg-fallback-name {
                        font-size: .85rem;
                        font-weight: 700;
                        line-height: 1.3;
                        letter-spacing: -0.01em;
                        max-width: 90%;
                        display: -webkit-box;
                        -webkit-line-clamp: 4;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || name || ''}
            className={className}
            style={style}
            loading={loading}
            decoding={decoding}
            referrerPolicy={referrerPolicy}
            crossOrigin={crossOrigin}
            onError={() => setFailed(true)}
        />
    );
}
