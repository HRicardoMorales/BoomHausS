/* Logos SVG de marcas de tarjeta y Mercado Pago (sin requests de imágenes).
   Insignias 38×24 tipo "tarjeta" para la lista de medios de pago del checkout
   fullpage (antes: <img> a cdn.shopify.com). Decorativas: el nombre accesible del
   medio va en texto al lado, por eso `aria-hidden` y sin `aria-label`. */
const badgeProps = { width: 38, height: 24, viewBox: "0 0 38 24", "aria-hidden": true, focusable: "false", className: "ckfp-logo-img" };
const BadgeFrame = () => <rect x=".5" y=".5" width="37" height="23" rx="3.5" fill="#fff" stroke="#d9d9d9" />;

export const BadgeMP = () => (
  <svg {...badgeProps}>
    <BadgeFrame />
    <ellipse cx="19" cy="12" rx="12.5" ry="8.5" fill="#00b1ea" />
    <ellipse cx="19" cy="12" rx="11" ry="7" fill="none" stroke="#fff" strokeWidth="1" />
    <path d="M12.5 12.4l2.6-2.2 2.4 1.6 1.8-1.4 1.9 1.3 2.2-1.5 2.1 2.2" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const BadgeVisa = () => (
  <svg {...badgeProps}>
    <BadgeFrame />
    <text x="19" y="16" textAnchor="middle" fill="#1434cb" fontSize="11" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif" letterSpacing=".3">VISA</text>
  </svg>
);
export const BadgeMC = () => (
  <svg {...badgeProps}>
    <BadgeFrame />
    <circle cx="15" cy="12" r="7" fill="#eb001b" />
    <circle cx="23" cy="12" r="7" fill="#f79e1b" />
    <path d="M19 6.2a7 7 0 0 1 0 11.6 7 7 0 0 1 0-11.6z" fill="#ff5f00" />
  </svg>
);
