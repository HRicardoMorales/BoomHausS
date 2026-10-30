import { BRAND_NAME } from '../data';

/* Piezas chicas compartidas por varias secciones de la landing. */
export function ImgPlaceholder({ label }) {
  return (
    <div className="amp-img-placeholder">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5a2 2 0 00-2.8 0L4 19" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export function BrandLogo() {
  return <>{BRAND_NAME}<sup className="amp-logo-tm">™</sup></>;
}
