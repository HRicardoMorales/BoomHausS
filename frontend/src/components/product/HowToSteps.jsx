import SafeImg from "../SafeImg";
import { FEATURE_SIZES } from "../landing/imageSizes";
import SectionHeader from "./SectionHeader";
import Reveal from "../motion/Reveal";

export default function HowToSteps({ mc = {} }) {
  const { howTo } = mc;

  return (
    <section className="pd-block" id="howto">
      <SectionHeader title={howTo.title} />

      {/* Reveal por fuera: su transform inline pisaría el hover de .hover-float */}
      <Reveal>
        <div className="how-imgWrap hover-float">
          <SafeImg
            src={howTo.image?.url}
            alt={howTo.image?.alt || howTo.title}
            name={howTo.title}
            sizes={FEATURE_SIZES}
            referrerPolicy="no-referrer"
          />
        </div>
      </Reveal>
    </section>
  );
}
