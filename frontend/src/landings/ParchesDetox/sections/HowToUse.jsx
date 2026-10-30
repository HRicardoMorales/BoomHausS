import SafeImg from '../../../components/SafeImg';
import { STEP_WIDTHS } from '../../../components/landing/imageSizes';
import { STEPS } from '../data';

/* S11 — Cómo se usa */
export default function HowToUse() {
  return (
    <div className="pdx-section pdx-section--white pdx-how-section">
      <div className="pdx-container">
        <div className="pdx-how-kicker">SIMPLE Y SIN SALIR DE CASA</div>
        <h2 className="pdx-section-title">¿Cómo se usa?</h2>
        <div className="pdx-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="pdx-step-item">
              <div className="pdx-step-img-wrap">
                {step.img
                  ? <SafeImg src={step.img} alt="" width={90} height={90} sizes="90px" widths={STEP_WIDTHS} />
                  : <span className="pdx-step-img-ph">{step.num}</span>
                }
              </div>
              <div className="pdx-step-content">
                <div className="pdx-step-label">Paso {step.num}</div>
                <h3 className="pdx-step-title">{step.title}</h3>
                <p className="pdx-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
