import { BrandLogo } from './ui';

export default function Header() {
  return (
    <div className="amp-header">
      <div className="amp-logo"><BrandLogo /></div>
      <div className="amp-cart-btn" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6" />
        </svg>
      </div>
    </div>
  );
}
