/**
 * Logos de medios de pago (SVG inline, sin requests). Devuelve solo los
 * íconos para que cada bloque de compra conserve su propio contenedor.
 */
const ICONS = [
  { name: "Visa", svg: (
    <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 21h-3.2l2-12.4h3.2L19.5 21zm12.8-12.1c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.7l-.4-.2-.4 2.7c.7.4 2.1.7 3.5.7 3.4 0 5.5-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.5-2.7zm8.3-.3h-2.5c-.8 0-1.3.2-1.7 1L32 21h3.4l.7-1.8h4.1l.4 1.8H44l-2.7-12.4h-2.7zm-3.3 8l1.7-4.6.8 4.6h-2.5zM16.3 8.6l-3.1 8.5-.3-1.7c-.6-2-2.4-4.2-4.5-5.2l2.9 10.7h3.4l5.1-12.3h-3.5z" fill="#1A1F71"/><path d="M10.4 8.6H5.1l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.3-1.1z" fill="#F9A533"/></svg>
  ) },
  { name: "Mastercard", svg: (
    <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.3a9 9 0 013 6.7 9 9 0 01-3 6.7 9 9 0 01-3-6.7 9 9 0 013-6.7z" fill="#FF5F00"/></svg>
  ) },
  { name: "Amex", svg: (
    <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#2557D6"/><path d="M6 16l3-7h3.5l1.5 3.5V9h4.3l1 3 1-3h4.2v14h-3.5l-1.5-3.3V23H15l-.7-1.8h-2.1L11.5 23H8l3-7zm5 4h1.5l-2.2-5.2L10.2 20H11zm6-7v7h2v-3l2 3h2.5l-2.5-3.5L23.5 13H21l-2 2.5V13h-2zm11-4l-3.5 7.5V23h2.5v-3l3.5-7h-2.5zm4.5 0v14h7.5l2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2-2.5L39 9h-6.5zm2.5 3h3l-1.2 1.5L37 12h-2zm0 4h3l-1.2 1.5L37 16h-2zm0 4h3l-1.2 1.5L37 20h-2z" fill="#fff"/></svg>
  ) },
  { name: "PayPal", svg: (
    <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><path d="M19.5 8h5.8c2.7 0 4.6 1.8 4.2 4.5-.5 3.3-2.8 5-5.8 5h-1.5c-.4 0-.8.3-.9.8l-.8 4.7h-3c-.3 0-.4-.2-.4-.4L19.5 8z" fill="#253B80"/><path d="M21 18.3l.8-4.8c.1-.4.4-.7.8-.7h3.5c1.5 0 2.7-.5 3.4-1.5-.3 3-2.5 4.7-5.2 4.7h-1.5c-.4 0-.8.3-.9.8l-.9 5.2h-2.5l2.5-3.7z" fill="#179BD7"/></svg>
  ) },
  { name: "Rapipago", svg: (
    <svg viewBox="0 0 48 32" width="38" height="25"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" strokeWidth="1"/><rect x="8" y="10" width="32" height="12" rx="2" fill="#00A650"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="Arial">RAPIPAGO</text></svg>
  ) },
];

export default function PaymentIcons() {
  return ICONS.map(({ name, svg }) => (
    <div key={name} className="hero-pay-icon">
      {svg}
    </div>
  ));
}
