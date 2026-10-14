import SafeImg from "../SafeImg";
import { FEATURE_SIZES } from "../landing/imageSizes";
import SectionHeader from "./SectionHeader";

export default function HowToSteps({ mc = {} }) {
  const { howTo } = mc;

  return (
    <section className="pd-block" id="howto">
      <SectionHeader title={howTo.title} />

      <div className="how-imgWrap hover-float anim-el">
        <SafeImg
          src={howTo.image?.url}
          alt={howTo.image?.alt || howTo.title}
          name={howTo.title}
          sizes={FEATURE_SIZES}
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  );
}
