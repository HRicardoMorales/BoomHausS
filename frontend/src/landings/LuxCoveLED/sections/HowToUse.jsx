import { STEPS } from '../data';

/* S15 — Cómo usarlo (C11) */
export default function HowToUse() {
  return (
    <div className="led-section led-section--white">
      <div className="led-container">
        <h2 className="led-section-title">Cómo usarlo</h2>
        <div className="led-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="led-step-item">
              <div className="led-step-num">{step.num}</div>
              <div className="led-step-content">
                <h3 className="led-step-title">{step.title}</h3>
                <p className="led-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
