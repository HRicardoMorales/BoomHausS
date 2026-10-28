import { VSTRIP_VIDEOS } from '../data';

/* S4 — Videos de clientes ("Inspírate") */
export default function VideoStrip() {
  return (
    <div className="led-section led-section--white" style={{ paddingTop: 32, paddingBottom: 32 }}>
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
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
