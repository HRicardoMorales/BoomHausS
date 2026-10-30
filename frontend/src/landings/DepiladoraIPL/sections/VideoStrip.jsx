import InViewVideo from '../../../components/media/InViewVideo';
import { VSTRIP_VIDEOS } from '../data';

/* S4.5 — Videos de clientas */
export default function VideoStrip() {
  return (
    <section className="ipl-vstrip-section">
      <div className="ipl-container">
        <div className="ipl-vstrip-header">
          <div className="ipl-vstrip-kicker">✦ Clientas reales</div>
          <h2 className="ipl-vstrip-title">Resultados que hablan solos ✨</h2>
          <p className="ipl-vstrip-sub">Mirá cómo la Depiladora IPL transforma la piel de nuestras clientas.</p>
        </div>
        <div className="ipl-vstrip-row">
          {VSTRIP_VIDEOS.map((v, i) => (
            <div key={i} className="ipl-vstrip-item">
              <div className="ipl-vstrip-media">
                {v.src
                  ? <InViewVideo src={v.src} className="ipl-vstrip-video" label={`Video de clienta: ${v.benefit}`} threshold={0.25} />
                  : <div className="ipl-vstrip-ph"><span className="ipl-vstrip-ph-ico">📹</span></div>
                }
              </div>
              <div className="ipl-vstrip-benefit">{v.benefit}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
