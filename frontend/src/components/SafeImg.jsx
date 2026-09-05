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
//   style, loading, decoding, referrerPolicy, crossOrigin — passthrough a <img>.

import { useState, useEffect } from 'react';

// Monograma de marca (primer caracter de VITE_STORE_NAME). Sale del env
// para que se auto-sincronice si cambia el nombre de la tienda.
const STORE_NAME = import.meta.env.VITE_STORE_NAME || 'Amelor';
const BRAND_MONO = String(STORE_NAME).trim().charAt(0).toUpperCase() || 'A';

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
                <div className="safeimg-fallback-mono" aria-hidden="true">{BRAND_MONO}</div>
                <div className="safeimg-fallback-name">{label}</div>
                <style>{`
                    .safeimg-fallback {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 18px 14px;
                        width: 100%;
                        height: 100%;
                        box-sizing: border-box;
                        text-align: center;
                        background:
                            radial-gradient(circle at 50% 42%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%),
                            linear-gradient(135deg, var(--secondary-soft, #F6F0EE) 0%, var(--bg, #FAF7F5) 100%);
                        color: var(--muted, #8A6A63);
                        font-family: inherit;
                    }
                    .safeimg-fallback-mono {
                        width: clamp(36px, 22%, 56px);
                        aspect-ratio: 1 / 1;
                        border-radius: 50%;
                        border: 1.5px solid var(--primary, #C8928B);
                        color: var(--primary, #C8928B);
                        display: grid;
                        place-items: center;
                        font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
                        font-weight: 600;
                        font-size: clamp(20px, 12cqmin, 30px);
                        letter-spacing: -0.02em;
                        line-height: 1;
                        opacity: .78;
                        background: rgba(255, 255, 255, .55);
                    }
                    .safeimg-fallback-name {
                        font-size: clamp(11px, 3.4cqmin, 13px);
                        font-weight: 500;
                        color: var(--primary-ink, #8A6A63);
                        letter-spacing: .01em;
                        line-height: 1.35;
                        max-width: 88%;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        opacity: .82;
                    }
                    .safeimg-fallback { container-type: inline-size; }
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
