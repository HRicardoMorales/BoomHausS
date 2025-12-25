import { useMemo, useState } from "react";

export default function HeroMiniGallery({ items = [] }) {
    const slides = useMemo(() => items.filter(Boolean), [items]);
    const [i, setI] = useState(0);

    if (!slides.length) return null;

    const current = slides[i];

    const prev = () => setI((v) => (v - 1 + slides.length) % slides.length);
    const next = () => setI((v) => (v + 1) % slides.length);

    return (
        <div className="hero-mini">
            <div className="hero-mini__main">
                <div className="hero-mini__content">
                    <div className="hero-mini__title">{current.title}</div>
                    <div className="hero-mini__text">{current.text}</div>
                </div>

                {current.image && (
                    <div className="hero-mini__image">
                        <img src={current.image} alt={current.title} />
                    </div>
                )}

                <div className="hero-mini__nav">
                    <button className="btn btn-ghost" onClick={prev} aria-label="Anterior">
                        ←
                    </button>
                    <div className="hero-mini__dots">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                className={`hero-mini__dot ${idx === i ? "is-active" : ""}`}
                                onClick={() => setI(idx)}
                                aria-label={`Ir a ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <button className="btn btn-ghost" onClick={next} aria-label="Siguiente">
                        →
                    </button>
                </div>
            </div>

            <div className="hero-mini__thumbs">
                {slides.map((s, idx) => (
                    <button
                        key={idx}
                        className={`hero-mini__thumb ${idx === i ? "is-active" : ""}`}
                        onClick={() => setI(idx)}
                        title={s.title}
                    >
                        <div className="hero-mini__thumbTitle">{s.title}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
