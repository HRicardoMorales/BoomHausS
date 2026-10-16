/* Logos SVG de marcas de tarjeta y Mercado Pago (sin requests de imágenes). */

export const LogoVisa = () => (
  <svg viewBox="0 0 60 22" width="42" height="16" aria-label="Visa" style={{ display:"block" }}>
    <rect width="60" height="22" rx="3" fill="#1A1F71"/>
    <text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text>
  </svg>
);
export const LogoMC = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Mastercard" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
    <circle cx="16" cy="14" r="9" fill="#EB001B"/>
    <circle cx="28" cy="14" r="9" fill="#F79E1B"/>
    <path d="M22 7.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00"/>
  </svg>
);
export const LogoAmex = () => (
  <svg viewBox="0 0 60 22" width="42" height="16" aria-label="American Express" style={{ display:"block" }}>
    <rect width="60" height="22" rx="3" fill="#2E77BC"/>
    <text x="30" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">AMEX</text>
  </svg>
);
export const LogoDiners = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Diners Club" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
    <circle cx="17" cy="14" r="8.5" fill="none" stroke="#004A97" strokeWidth="2.5"/>
    <circle cx="27" cy="14" r="8.5" fill="none" stroke="#004A97" strokeWidth="2.5"/>
  </svg>
);
export const LogoMP = () => (
  <svg viewBox="0 0 44 28" width="36" height="24" aria-label="Mercado Pago" style={{ display:"block" }}>
    <rect width="44" height="28" rx="4" fill="#009ee3"/>
    <text x="22" y="18" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif">MP</text>
  </svg>
);
