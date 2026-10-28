import { useRef, useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { lights } from '../data';

/* S10 — Carrusel de luces LED (C8) */
export default function LightsCarousel() {
  const [lightIdx, setLightIdx] = useState(0);
  const lightsTrackRef = useRef(null);

  const handleLightsScroll = () => {
    if (!lightsTrackRef.current) return;
    const idx = Math.round(lightsTrackRef.current.scrollLeft / 167);
    setLightIdx(Math.min(idx, lights.length - 1));
  };
  const scrollToLight = (i) => {
    setLightIdx(i);
    lightsTrackRef.current?.scrollTo({ left: i * 167, behavior: 'smooth' });
  };

  return (
    <div className="led-lights-section">
      <h2 className="led-lights-title">Obtené tratamientos de miles de pesos con un solo dispositivo.</h2>
      <div
        className="led-lights-track-wrap"
        ref={lightsTrackRef}
        onScroll={handleLightsScroll}
        role="region"
        aria-label="Modos de luz LED (deslizá para ver más)"
        tabIndex={0}
      >
        <div className="led-lights-track">
          {lights.map((light, i) => (
            <div key={i} className="led-lights-card">
              <div
                className="led-lights-img-wrap"
                style={{ borderColor: light.border ? '#bbb' : light.color }}
              >
                <SafeImg
                  src={light.src}
                  alt=""
                  width={120}
                  height={120}
                  sizes="120px"
                  widths={[240, 360]}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="led-lights-name">{light.name}</span>
              {light.nm && <span className="led-lights-nm">({light.nm})</span>}
              <p className="led-lights-desc">{light.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="led-lights-dots">
        {lights.map((_, i) => (
          <button key={i} className={`led-lights-dot-btn${i === lightIdx ? ' active' : ''}`} onClick={() => scrollToLight(i)} aria-label={`Luz ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
