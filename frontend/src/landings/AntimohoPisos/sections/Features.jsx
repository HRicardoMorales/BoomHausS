import { FEATURES } from '../data';

export default function Features() {
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <h2 className="amp-sec-h2">Por qué elegir Anti-Moho PRO</h2>
        <div className="amp-feat-grid" style={{ marginTop: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="amp-feat-card">
              <div className="amp-feat-icon"><f.icon /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
