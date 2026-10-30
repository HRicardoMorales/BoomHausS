import SafeImg from "../SafeImg";
import { resolveMedia } from "../../utils/resolveMedia";
import RichText from "../ui/RichText";

/*
 * Bloques "texto + medio" alternados de las landings (config: `storyBlocks`).
 * El medio puede ser YouTube/Vimeo (iframe muteado en loop), mp4, GIF o imagen;
 * sin medio se muestra un placeholder con el `imgAlt`.
 *
 * Los estilos (.pd-flow, .flow-*) los pone cada landing, porque cada una tiene
 * su tono; este componente solo define la estructura.
 *
 * @param {{
 *   blocks?: Array<{ title: string, text?: string, textHtml?: string, badge?: string,
 *                    img?: string, videoUrl?: string, imgAlt?: string }>,
 *   getMedia?: (block: object, index: number) => string | undefined,
 *   imgProps?: object,
 *   placeholderIcon?: import('react').ReactNode,
 * }} props
 */
export default function StoryFlow({
  blocks,
  getMedia = (b) => b.img || b.videoUrl,
  imgProps,
  placeholderIcon = "💡",
}) {
  if (!blocks?.length) return null;
  return (
    <section className="pd-flow">
      {blocks.map((b, i) => (
        <div key={i} className="flow-row">
          <div className={`flow-text${b.textHtml ? " flow-text--rich" : ""}`}>
            {b.badge && <div className="flow-badge">{b.badge}</div>}
            <h3 className="flow-title">{b.title}</h3>
            {b.textHtml
              ? <RichText className="flow-p flow-p--rich" html={b.textHtml} />
              : <p className="flow-p">{b.text}</p>}
          </div>
          <div className="flow-media">
            <StoryMedia
              media={resolveMedia(getMedia(b, i))}
              alt={b.imgAlt}
              imgProps={imgProps}
              placeholderIcon={placeholderIcon}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

function StoryMedia({ media, alt, imgProps, placeholderIcon }) {
  if (media?.type === "iframe") {
    return (
      <div className="flow-imgBox flow-imgBox--video">
        <iframe
          src={media.src}
          title={alt}
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }
  if (media?.type === "video") {
    return (
      <div className="flow-imgBox hover-float">
        <video autoPlay muted loop playsInline preload="metadata" aria-label={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
          <source src={media.src} type="video/mp4" />
        </video>
      </div>
    );
  }
  return (
    <div className="flow-imgBox hover-float">
      {media
        ? <SafeImg src={media.src} alt={alt} sizes="(min-width: 960px) 520px, 100vw" {...imgProps} />
        : (
          <div className="spf-flow-ph">
            <span className="spf-flow-ph-icon" aria-hidden="true">{placeholderIcon}</span>
            <span className="spf-flow-ph-text">{alt}</span>
          </div>
        )}
    </div>
  );
}
