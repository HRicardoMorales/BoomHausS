import SafeImg from "../SafeImg";
import { FEATURE_SIZES } from "../landing/imageSizes";
import Reveal from "../motion/Reveal";

export default function StoryBlocks({ mc = {} }) {
  const blocks = mc.storyBlocks;
  // La ficha genérica (/products/:id) no tiene bloques de historia.
  if (!blocks?.length) return null;
  return (
    <section className="pd-flow">
      {blocks.map((b, i) => (
        <Reveal key={i} index={i} className="flow-row">
          <div className={`flow-text${b.textHtml ? " flow-text--rich" : ""}`}>
            {b.badge && <div className="flow-badge">{b.badge}</div>}
            <h3 className="flow-title">{b.title}</h3>
            {b.textHtml ? (
              <p
                className="flow-p flow-p--rich"
                dangerouslySetInnerHTML={{ __html: b.textHtml }}
              />
            ) : (
              <p className="flow-p">{b.text}</p>
            )}
          </div>

          <div className="flow-media">
            <div className="flow-imgBox hover-float">
              {b.videoUrl ? (
                // Video autoplay silencioso en loop (estilo Calmora)
                <video
                  src={b.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={b.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : b.gifUrl ? (
                // GIF animado (alternativa al video)
                <SafeImg
                  src={b.gifUrl}
                  alt={b.title}
                  sizes={FEATURE_SIZES}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                // Fallback imagen estática
                <SafeImg
                  src={b.img}
                  alt={b.title}
                  sizes={FEATURE_SIZES}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}
