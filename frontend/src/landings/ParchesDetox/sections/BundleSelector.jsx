import { Fragment } from 'react';
import SafeImg from '../../../components/SafeImg';
import { THUMB_WIDTHS } from '../../../components/landing/imageSizes';
import { moneyARS } from '../../../utils/pricing.js';
import { BUNDLES } from '../data';

/* Selector de kit. ctaRef marca el bloque que observa la barra fija */
export default function BundleSelector({ selected, onSelect, images, ctaRef }) {
  return (
    <div className="pdx-bundles" ref={ctaRef}>
      {BUNDLES.map((b, idx) => {
        const isActive = idx === selected;
        return (
          <Fragment key={b.id}>
            <label
              className={`pdx-bundle${isActive ? ' pdx-bundle--active' : ''}${b.popular ? ' pdx-bundle--popular' : ''}`}
            >
              <input
                type="radio"
                name="pdx-bundle"
                checked={isActive}
                onChange={() => onSelect(idx)}
              />
              {b.badge && <span className="pdx-bundle-badge">{b.badge}</span>}

              <div className="pdx-bundle-row">
                <div className="pdx-bundle-mini-img">
                  {(b.img || images[0]?.src) && (
                    <SafeImg src={b.img || images[0].src} alt="" width={54} height={54} sizes="54px" widths={THUMB_WIDTHS} />
                  )}
                </div>
                <div className="pdx-bundle-info">
                  <div className="pdx-bundle-title-line">
                    <span className="pdx-bundle-title">{b.label}</span>
                    {b.cuotas && (
                      <span className="pdx-bundle-cuotas">{b.cuotas}</span>
                    )}
                  </div>
                  {b.benefit && (
                    <span className="pdx-bundle-benefit">{b.benefit}</span>
                  )}
                </div>
                <div className="pdx-bundle-price">
                  {b.compareAt > b.price && (
                    <span className="pdx-bundle-pct-badge">-{Math.round(((b.compareAt - b.price) / b.compareAt) * 100)}%</span>
                  )}
                  <span className="pdx-bundle-now">{moneyARS(b.price)}</span>
                  {b.compareAt > b.price && (
                    <span className="pdx-bundle-was">{moneyARS(b.compareAt)}</span>
                  )}
                </div>
              </div>
            </label>
            {b.bannerBelow && (
              <div className="pdx-bundle-inter-banner">{b.bannerBelow}</div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
