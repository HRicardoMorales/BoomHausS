import { VSTRIP_VIDEOS } from '../data';

/* S4 — Videos de clientes ("Inspírate") */
export default function VideoStrip() {
  return (
    <div className="led-section led-section--white led-vstrip-section">
      <div className="led-container">
        <div className="led-vstrip-header">
          <div className="led-vstrip-kicker">✦ CLIENTES SATISFECHOS</div>
          <h2 className="led-vstrip-title">Inspírate ✨</h2>
          <p className="led-vstrip-sub">¡Mirá cómo nuestros clientes transforman sus rostros con el Escultor Facial LED!</p>
        </div>
        <div className="led-vstrip-row">
          {VSTRIP_VIDEOS.map((v, i) => (
            <div key={i} className="led-vstrip-item">
              <div className="led-vstrip-media">
                <video
                  src={v.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="led-vstrip-video"
                />
              </div>
              <div className="led-vstrip-benefit">{v.benefit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
