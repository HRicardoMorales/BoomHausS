import SafeImg from '../../../components/SafeImg';
import RichText from '../../../components/ui/RichText';
import { FEATURE_SIZES } from '../../../components/landing/imageSizes';
import { FEATURE_BLOCKS } from '../data';

/* S6–S7B — Bloques imagen + texto (antes 3 copias casi iguales) */
export default function FeatureBlocks() {
  return FEATURE_BLOCKS.map((block) => (
    <div key={block.kicker} className={`pdx-feat-section pdx-feat-section--${block.tone}`}>
      <div className={`pdx-feat-inner${block.reverse ? ' pdx-feat-reverse' : ''}`}>
        <div className="pdx-feat-img">
          <SafeImg
            src={block.img}
            alt={block.alt}
            width={600}
            height={600}
            sizes={FEATURE_SIZES}
            className="pdx-feat-media"
          />
        </div>
        <div className="pdx-feat-text">
          <div className="pdx-feat-kicker">{block.kicker}</div>
          <h2 className="pdx-feat-title">{block.title}</h2>
          {block.paragraphs.map((p) => <RichText key={p} html={p} className="pdx-feat-desc" />)}
        </div>
      </div>
    </div>
  ));
}
