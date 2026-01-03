// frontend/src/components/GalleryCarousel.jsx

import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function GalleryCarousel({
    images: imagesProp,
    intervalMs = 3800,
    id = 'gallery-carousel'
}) {
    // ✅ Si no pasás images por props, usa placeholders (cambiá esto por tus URLs reales)
    const images = useMemo(
        () =>
            Array.isArray(imagesProp) && imagesProp.length
                ? imagesProp
                : [
                    // TIP: reemplazá por tus fotos reales (URLs o /assets)
                    'https://maximstore.com/_next/image?url=https%3A%2F%2Fback.maximstore.com%2Fstatic%2Fimages%2F580b030c-8cbc-4a0d-bc9a-baefff606c27.png&w=960&q=75',
                    'https://maximstore.com/_next/image?url=https%3A%2F%2Fback.maximstore.com%2Fstatic%2Fimages%2F7f7e071a-5d88-45bd-9fc8-727ff4209355.png&w=960&q=75',
                    'https://acdn-us.mitiendanube.com/stores/001/662/318/products/airpods-3-c68e4869eab18d768e17520213046616-640-0.webp',
                    'https://maximstore.com/_next/image?url=https%3A%2F%2Fback.maximstore.com%2Fstatic%2Fimages%2F9a2df311-e1ba-4b22-b33b-b3a0853d227b.png&w=960&q=75',
                    'https://maximstore.com/_next/image?url=https%3A%2F%2Fback.maximstore.com%2Fstatic%2Fimages%2F28e94d65-6360-4343-88c8-98fab2b08804.png&w=960&q=75'
                ],
        [imagesProp]
    );

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // swipe
    const startXRef = useRef(null);
    const startYRef = useRef(null);
    const isDraggingRef = useRef(false);

    // autoplay timer
    const timerRef = useRef(null);

    const canAutoplay = images.length > 1 && !paused;

    const go = (nextIndex) => {
        setIndex((cur) => {
            const max = images.length - 1;
            return clamp(nextIndex, 0, max);
        });
    };

    const next = () => {
        setIndex((cur) => (cur + 1) % images.length);
    };

    const prev = () => {
        setIndex((cur) => (cur - 1 + images.length) % images.length);
    };

    // Autoplay
    useEffect(() => {
        if (!canAutoplay) return;

        timerRef.current = setInterval(() => {
            next();
        }, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canAutoplay, intervalMs, images.length]);

    // Teclado (izq/der)
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images.length]);

    // Swipe (mobile)
    function onPointerDown(e) {
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        setPaused(true);
    }

    function onPointerMove(e) {
        if (!isDraggingRef.current) return;
        // No hacemos drag visual, solo detectamos intención
    }

    function onPointerUp(e) {
        if (!isDraggingRef.current) return;

        const startX = startXRef.current;
        const startY = startYRef.current;

        isDraggingRef.current = false;
        startXRef.current = null;
        startYRef.current = null;

        if (startX == null || startY == null) {
            setPaused(false);
            return;
        }

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // si fue más vertical que horizontal => ignorar (scroll)
        if (Math.abs(dy) > Math.abs(dx)) {
            setPaused(false);
            return;
        }

        const threshold = 40; // px
        if (dx > threshold) prev();
        if (dx < -threshold) next();

        setTimeout(() => setPaused(false), 450);
    }

    // Pausa al hover (desktop)
    function onMouseEnter() {
        setPaused(true);
    }
    function onMouseLeave() {
        setPaused(false);
    }

    return (
        <div
            id={id}
            className="card"
            style={{
                padding: '0.9rem',
                borderRadius: 18,
                overflow: 'hidden',
                position: 'relative',

            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* top row */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                }}
            >
                <div>
                    <div style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Galería</div>
                    <div className="muted" style={{ marginTop: '0.15rem' }}>
                        Deslizá o usá las flechas
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-ghost" type="button" onClick={prev} aria-label="Anterior">
                        ←
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={next} aria-label="Siguiente">
                        →
                    </button>
                </div>
            </div>

            {/* slider */}
            <div
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.03)',
                    position: 'relative'
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <div
                    style={{
                        display: 'flex',
                        width: `${images.length * 100}%`,
                        transform: `translateX(-${index * (100 / images.length)}%)`,
                        transition: 'transform 520ms cubic-bezier(.2,.8,.2,1)'
                    }}
                >
                    {images.map((src, i) => (
                        <div
                            key={i}
                            style={{
                                width: `${100 / images.length}%`,
                                aspectRatio: '16/10',
                                position: 'relative'
                            }}
                        >
                            <img
                                src={src}
                                alt={`Imagen ${i + 1}`}
                                loading={i === 0 ? 'eager' : 'lazy'}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    userSelect: 'none'
                                }}
                                draggable={false}
                            />

                            {/* soft vignette */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background:
                                        'radial-gradient(800px circle at 50% 20%, transparent 40%, rgba(0,0,0,0.55) 100%)',
                                    pointerEvents: 'none'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* progress */}
                <div
                    style={{
                        position: 'absolute',
                        left: 12,
                        right: 12,
                        bottom: 12,
                        display: 'flex',
                        gap: '0.4rem',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    {/* dots */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {images.map((_, i) => {
                            const active = i === index;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Ir a imagen ${i + 1}`}
                                    onClick={() => go(i)}
                                    style={{
                                        width: active ? 22 : 10,
                                        height: 10,
                                        borderRadius: 999,
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        background: active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 220ms ease'
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* counter */}
                    <div
                        className="muted"
                        style={{
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.35)'
                        }}
                    >
                        {index + 1}/{images.length}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalleryCarousel;
