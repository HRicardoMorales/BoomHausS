// frontend/src/components/admin/home/DashboardParts.jsx
// Piezas visuales del dashboard. Toda la lógica vive en metrics.js.

import { useId } from 'react';
import { describeChange, describeSeries, sparklineGeometry, axisLabels } from './metrics.js';

export function Change({ value }) {
  const c = describeChange(value);
  if (!c) return null;
  return (
    <span className={`adm-change adm-change--${c.direction}`}>
      <span aria-hidden="true">{c.direction === 'up' ? '▲' : '▼'} {c.text}</span>
      <span className="sr-only">{c.srText}</span>
    </span>
  );
}

export function StatusBadge({ status, label }) {
  return <span className={`adm-badge adm-badge--${status}`}>{label}</span>;
}

/** Sparkline accesible: role="img" con la serie resumida en palabras. */
export function Sparkline({ labels, values, height = 72 }) {
  const titleId = useId();
  const geo = sparklineGeometry(values, { height });
  const ticks = axisLabels(labels);
  if (!geo) {
    return <p className="adm-empty-hint">Todavía no hay suficientes datos para graficar.</p>;
  }
  return (
    <figure className="adm-spark">
      <svg
        viewBox={`0 0 280 ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{describeSeries(labels, values)}</title>
        <path d={geo.area} className="adm-spark__area" />
        <polyline points={geo.line} className="adm-spark__line" vectorEffect="non-scaling-stroke" />
        <circle cx={geo.last.x} cy={geo.last.y} r="3.5" className="adm-spark__dot" />
      </svg>
      {ticks.length > 0 && (
        <figcaption className="adm-spark__axis" aria-hidden="true">
          {ticks.map((t, i) => <span key={`${t}-${i}`}>{t}</span>)}
        </figcaption>
      )}
    </figure>
  );
}
