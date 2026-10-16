/**
 * Confirmación previa al pago contra entrega: la modalidad solo existe en CABA.
 * Componente de presentación: el envío del pedido lo decide el padre (onConfirm).
 */
export function CabaConfirmModal({ address, submitting, error, primaryColor, onConfirm, onCancel }) {
  const showAddress = Boolean(address);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cs-caba-title" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 400, width: "100%", padding: "32px 28px 28px", boxShadow: "0 24px 60px rgba(0,0,0,.25)", textAlign: "center" }}>
        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#f5f5f7,#ebebeb)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32, boxShadow: "0 8px 20px rgba(0,0,0,.08)" }}>
          🛵
        </div>
        <h3 id="cs-caba-title" style={{ fontWeight: 900, fontSize: 20, color: "#0b1220", margin: "0 0 8px", lineHeight: 1.2 }}>
          Entrega en CABA
        </h3>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
          Esta modalidad de <strong>pago al recibir</strong> está disponible <strong>únicamente para Ciudad Autónoma de Buenos Aires (CABA)</strong>.<br />
          Confirmá que tu dirección está en CABA para continuar.
        </p>

        {/* Address preview */}
        {showAddress && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Tu dirección</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              {address}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <button
          disabled={submitting}
          onClick={onConfirm}
          style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: primaryColor, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 10, boxShadow: "0 8px 20px rgba(0,0,0,.18)", transition: "transform .12s, box-shadow .18s" }}
        >
          {submitting ? "Confirmando pedido..." : "Sí, estoy en CABA — Confirmar pedido"}
        </button>
        <button
          onClick={onCancel}
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "transparent", color: "#64748b", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
        >
          Volver y cambiar método de entrega
        </button>

        {error && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#c0392b" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
