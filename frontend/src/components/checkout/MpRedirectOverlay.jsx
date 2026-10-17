// Pantalla de "Conectando con Mercado Pago" mientras se redirige al link de pago.
// Se porta a document.body para escapar del contexto de apilamiento de la animación
// de .ckfp-shell, que rompería position:fixed en Safari/WebView mobile.
// Solo presentación: la redirección la decide la página.
import { createPortal } from "react-dom";

export function MpRedirectOverlay({ open }) {
  if (!open) return null;
  return createPortal(
    <div className="ckfp-mp-overlay" role="alertdialog" aria-modal="true" aria-labelledby="ckfp-mp-title" aria-describedby="ckfp-mp-sub">
      <div className="ckfp-mp-card">
        <div className="ckfp-mp-logo-wrap">
          <svg viewBox="0 0 40 40" width="52" height="52" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="12" fill="#009ee3"/>
            <path d="M10.5 20.8c0-3.4 2.2-6.2 5.2-6.2 1.6 0 2.7.7 3.3 1.5.6-.8 1.7-1.5 3.3-1.5 3 0 5.2 2.8 5.2 6.2 0 4.8-5 9.2-8.5 11.2-3.5-2-8.5-6.4-8.5-11.2z" fill="#fff"/>
          </svg>
        </div>
        <h2 className="ckfp-mp-title" id="ckfp-mp-title">Conectando con Mercado Pago</h2>
        <p className="ckfp-mp-sub" id="ckfp-mp-sub">Estamos generando tu link de pago seguro</p>
        <div className="ckfp-mp-bar-track" role="progressbar" aria-label="Redirigiendo a Mercado Pago"><div className="ckfp-mp-bar" /></div>
        <p className="ckfp-mp-note">No cerrés esta pantalla — serás redirigido en segundos</p>
      </div>
    </div>,
    document.body
  );
}
