

/* Pie de la landing */
export default function Footer() {
  return (
    <footer className="pdx-footer">
      <div className="pdx-footer-body">
        <div className="pdx-footer-brand">
          <div className="pdx-footer-logo">Amelor</div>
          <p className="pdx-footer-tagline">Bienestar nocturno con ingredientes naturales</p>
        </div>
        <div className="pdx-footer-trust-row">
          <div className="pdx-footer-ti"><span>🔒</span>Pago seguro</div>
          <div className="pdx-footer-ti"><span>🚚</span>Envío gratis</div>
          <div className="pdx-footer-ti"><span>🛡️</span>Garantía 90 días</div>
          <div className="pdx-footer-ti"><span>💳</span>3 cuotas sin interés</div>
        </div>
        <div className="pdx-footer-bottom">
          <span>© 2026 Amelor · Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}
