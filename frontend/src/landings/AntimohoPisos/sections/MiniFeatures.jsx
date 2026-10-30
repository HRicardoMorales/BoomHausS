import { MINI_FEATURES } from '../data';

export default function MiniFeatures() {
  return (
    <div className="amp-sec amp-mist">
      <div className="amp-container amp-mini-grid">
        {MINI_FEATURES.map((m, i) => (
          <div key={i} className="amp-mini-card">
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
