import SafeImg from '../../../components/SafeImg';
import { FEATURE_SIZES } from '../../../components/landing/imageSizes';
import { FEATURE_BLOCKS } from '../data';

/* S5–S7 — Bloques imagen + texto (antes 3 copias casi iguales) */
export default function FeatureBlocks() {
  return FEATURE_BLOCKS.map((block) => (
    <div key={block.kicker} className={`ipl-feat-section ipl-feat-section--${block.tone}`}>
      <div className="ipl-feat-inner">
        <div className="ipl-feat-img">
          <SafeImg
            src={block.img}
            alt={block.alt}
            width={600}
            height={600}
            sizes={FEATURE_SIZES}
            className="ipl-feat-media"
          />
        </div>
        <div className="ipl-feat-text">
          <div className="ipl-feat-kicker">{block.kicker}</div>
          <h2 className="ipl-feat-title">{block.title}</h2>
          {block.paragraphs.map((p) => <p key={p} className="ipl-feat-desc">{p}</p>)}
        </div>
      </div>
    </div>
  ));
}
