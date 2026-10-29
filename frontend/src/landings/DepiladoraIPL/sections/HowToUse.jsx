import SafeImg from '../../../components/SafeImg';
import { STEP_WIDTHS } from '../../../components/landing/imageSizes';
import { STEPS } from '../data';

/* S11 — Cómo se usa */
export default function HowToUse() {
  return (
    <div className="ipl-section ipl-section--white ipl-how-section">
      <div className="ipl-container">
        <div className="ipl-how-kicker">FÁCIL Y SIN SALIR DE CASA</div>
        <h2 className="ipl-section-title">¿Cómo se usa?</h2>
        <div className="ipl-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="ipl-step-item">
              <div className="ipl-step-img-wrap">
                {step.img
                  ? <SafeImg src={step.img} alt="" width={90} height={90} sizes="90px" widths={STEP_WIDTHS} />
                  : <span className="ipl-step-img-ph">{step.num}</span>
                }
              </div>
              <div className="ipl-step-content">
                <div className="ipl-step-label">Paso {step.num}</div>
                <h3 className="ipl-step-title">{step.title}</h3>
                <p className="ipl-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
