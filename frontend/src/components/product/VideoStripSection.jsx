import SafeImg from "../SafeImg";
import Reveal from "../motion/Reveal";

/* =========================
   Video strip — tres videos verticales estilo Calmora
========================= */
export default function VideoStripSection({ mc = {} }) {
  const videos = mc.proofVideos;
  if (!videos?.length) return null;
  return (
    <Reveal as="section" className="vstrip-section">
      {/* Header: kicker + title + subtitle ARRIBA de los videos */}
      <div className="vstrip-header">
        <div className="vstrip-kicker">{mc.proofVideosKicker || "✦ CLIENTES SATISFECHOS"}</div>
        {mc.proofVideosTitle && (
          <h2 className="vstrip-title">{mc.proofVideosTitle}</h2>
        )}
        {mc.proofVideosSubtitle && (
          <div className="vstrip-sub">{mc.proofVideosSubtitle}</div>
        )}
      </div>

      {/* Tres elementos en columnas — los tres caben en mobile simultáneamente */}
      <div className="vstrip-row">
        {videos.map((v, i) => (
          <div key={i} className="vstrip-item">
            <div className="vstrip-media">
              {v.videoUrl ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="vstrip-video"
                  aria-label={v.label}
                >
                  <source src={v.videoUrl} type="video/mp4" />
                </video>
              ) : v.imgUrl ? (
                <SafeImg
                  src={v.imgUrl}
                  alt={v.label}
                  className="vstrip-video"
                  sizes="(min-width: 768px) 240px, 45vw"
                />
              ) : (
                <div className="vstrip-ph" aria-hidden="true">
                  <span className="vstrip-ph-ico">▶</span>
                </div>
              )}
            </div>
            <div className="vstrip-label">{v.label}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
