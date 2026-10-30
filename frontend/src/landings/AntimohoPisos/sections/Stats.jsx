import { STATS } from '../data';

export default function Stats() {
  return (
    <div className="amp-stats-section">
      <div className="amp-container amp-stats-grid">
        {STATS.map((s, i) => (
          <div key={i}>
            <span className="amp-stat-val">{s.val}</span>
            <span className="amp-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
