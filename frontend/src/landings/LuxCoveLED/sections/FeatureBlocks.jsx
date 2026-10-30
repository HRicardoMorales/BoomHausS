import { FEATURE_BLOCKS } from '../data';

/* S7–S9 — Bloques de modo EMS, luz roja y luz verde (GIF + texto) */
export default function FeatureBlocks() {
  return FEATURE_BLOCKS.map((b) => (
    <div key={b.id} className={`led-feat-section led-feat-section--${b.tone}`}>
      <div className={b.reverse ? 'led-feat-inner led-feat-reverse' : 'led-feat-inner'}>
        <div className="led-feat-img">
          <img
            className="led-feat-media"
            src={b.src}
            srcSet={b.srcSet}
            sizes="(min-width: 750px) 50vw, 100vw"
            alt={b.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="led-feat-text">
          <h2 className="led-feat-title">{b.title}</h2>
          {b.paragraphs.map((p) => (
            <p key={p} className="led-feat-desc">{p}</p>
          ))}
        </div>
      </div>
    </div>
  ));
}
