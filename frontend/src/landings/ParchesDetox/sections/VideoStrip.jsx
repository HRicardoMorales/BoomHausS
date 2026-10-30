import SafeImg from '../../../components/SafeImg';
import { VSTRIP_VIDEOS } from '../data';

/* S3 — Tira de videos/GIFs de clientes */
export default function VideoStrip() {
  return (
    <section className="pdx-vstrip-section">
      <div className="pdx-container">
        <div className="pdx-vstrip-header">
          <div className="pdx-vstrip-kicker">✦ Clientes reales</div>
          <h2 className="pdx-vstrip-title">El ritual nocturno que transforma ✨</h2>
          <p className="pdx-vstrip-sub">Mirá cómo los Parches Detox cambian la mañana de nuestros clientes.</p>
        </div>
        <div className="pdx-vstrip-row">
          {VSTRIP_VIDEOS.map((v, i) => (
            <div key={i} className="pdx-vstrip-item">
              <div className="pdx-vstrip-media">
                {v.src
                  ? /\.(mp4|webm|ogg|mov)(\?|$)/i.test(v.src)
                    ? <video src={v.src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} />
                    : <SafeImg src={v.src} alt={v.benefit || `Video ${i + 1}`} width={300} height={533} sizes="(min-width: 900px) 300px, 33vw" widths={[240, 360, 480]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} />
                  : <div className="pdx-vstrip-ph"><span className="pdx-vstrip-ph-ico">🌙</span></div>
                }
              </div>
              <div className="pdx-vstrip-benefit">{v.benefit}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
