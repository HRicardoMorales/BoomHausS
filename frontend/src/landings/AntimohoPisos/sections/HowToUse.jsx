import { STEPS } from '../data';

export default function HowToUse() {
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <h2 className="amp-sec-h2">Tres pasos para juntas como nuevas</h2>
        <div className="amp-steps-grid" style={{ marginTop: 24 }}>
          {STEPS.map((s) => (
            <div key={s.num} className="amp-step">
              <div className="amp-step-num">{s.num}</div>
              <span className="amp-step-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="amp-copy-cta-wrap">
          <a href="#comprar" className="amp-inline-cta">Conseguir juntas como nuevas</a>
        </div>
      </div>
    </div>
  );
}
