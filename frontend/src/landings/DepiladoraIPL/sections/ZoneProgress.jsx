import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { HALF_SIZES, HALF_WIDTHS } from '../../../components/landing/imageSizes';
import { ZONE_TABS } from '../data';

/* S3.5 — Antes / después por zona corporal */
export default function ZoneProgress() {
  const [activeZone, setActiveZone] = useState(2);

  return (
    <section className="ipl-wkprog-section">
      <div className="ipl-container">
        <p className="ipl-wkprog-kicker">Progreso semana a semana</p>
        <h2 className="ipl-section-title">Resultados desde casa</h2>
        <div className="ipl-wkprog-tabs-outer">
          <div className="ipl-wkprog-tabs" role="group" aria-label="Zona del cuerpo">
            {ZONE_TABS.map((zone, i) => (
              <button
                key={zone.id}
                type="button"
                aria-pressed={activeZone === i}
                className={`ipl-wkprog-tab${activeZone === i ? ' ipl-wkprog-tab--active' : ''}`}
                onClick={() => setActiveZone(i)}
              >
                <span aria-hidden="true">{zone.emoji}</span>
                <span>{zone.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ipl-wkprog-grid">
          <div className="ipl-wkprog-item">
            <SafeImg
              src={ZONE_TABS[activeZone].beforeSrc}
              alt={`Antes ${ZONE_TABS[activeZone].label}`}
              sizes={HALF_SIZES}
              widths={HALF_WIDTHS}
            />
            <div className="ipl-wkprog-chip ipl-wkprog-chip--before">Antes</div>
          </div>
          <div className="ipl-wkprog-item">
            <SafeImg
              src={ZONE_TABS[activeZone].afterSrc}
              alt={`Después ${ZONE_TABS[activeZone].label}`}
              sizes={HALF_SIZES}
              widths={HALF_WIDTHS}
            />
            <div className="ipl-wkprog-chip ipl-wkprog-chip--after">Después</div>
          </div>
        </div>
      </div>
    </section>
  );
}
