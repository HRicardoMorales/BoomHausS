// frontend/src/components/CardPaymentBrick.jsx
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: "es-AR" });
}

const STATUS_MESSAGES = {
  cc_rejected_insufficient_amount: "Fondos insuficientes. Verificá el saldo de tu tarjeta.",
  cc_rejected_bad_filled_security_code: "Código de seguridad incorrecto.",
  cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta.",
  cc_rejected_call_for_authorize: "La tarjeta requiere autorización. Llamá a tu banco.",
  cc_rejected_card_disabled: "Tarjeta deshabilitada. Contactá a tu banco.",
  cc_rejected_duplicated_payment: "Pago duplicado. Esperá unos minutos y reintentá.",
  cc_rejected_high_risk: "El pago fue rechazado por seguridad.",
  pending_contingency: "El pago está en proceso. Te avisaremos cuando se confirme.",
  pending_review_manual: "El pago está en revisión. Te avisaremos en breve.",
};

function getStatusMessage(status, statusDetail) {
  if (STATUS_MESSAGES[statusDetail]) return STATUS_MESSAGES[statusDetail];
  if (status === "rejected") return "El pago fue rechazado. Verificá los datos o usá otra tarjeta.";
  if (status === "in_process" || status === "pending") return "El pago está siendo procesado. Te avisaremos cuando se confirme.";
  return "Ocurrió un problema con el pago. Intentá de nuevo.";
}

/**
 * Props:
 *   amount         — número (total en ARS)
 *   onBeforeSubmit — () => boolean  — validar form externo antes de procesar
 *   onSuccess      — (data) => void — pago aprobado
 *   onError        — (err)  => void — pago rechazado / error
 *   onSetError     — (msg)  => void — para mostrar error en el padre (formulario)
 */
export default function CardPaymentBrick({ amount, onBeforeSubmit, onSuccess, onError, onSetError }) {
  if (!MP_PUBLIC_KEY) {
    return (
      <div style={{ padding: "16px", color: "#b91c1c", background: "#fef2f2", borderRadius: "8px", fontSize: "14px" }}>
        Error de configuración: falta <code>VITE_MP_PUBLIC_KEY</code> en el .env del frontend.
      </div>
    );
  }

  async function handleSubmit(formData) {
    // 1. Validar formulario externo (nombre, DNI, dirección)
    if (typeof onBeforeSubmit === "function") {
      const ok = onBeforeSubmit();
      if (!ok) return; // el padre ya mostró el error
    }

    try {
      const body = {
        token: formData.token,
        amount,
        installments: formData.installments,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        payer: {
          email: formData.payer?.email,
          identification: formData.payer?.identification,
        },
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/payments/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        onSuccess?.(data);
      } else {
        const msg = getStatusMessage(data.status, data.status_detail);
        onSetError?.(msg);
        onError?.(data);
      }
    } catch (err) {
      console.error("CardPaymentBrick error:", err);
      onSetError?.("Error de conexión. Verificá tu internet e intentá de nuevo.");
      onError?.(err);
    }
  }

  return (
    <CardPayment
      initialization={{ amount }}
      customization={{
        paymentMethods: { minInstallments: 1, maxInstallments: 12 },
        visual: { style: { theme: "default" } },
      }}
      onSubmit={handleSubmit}
      onError={(err) => {
        console.error("MP Brick internal error:", err);
        onSetError?.("Ocurrió un error en el formulario de pago.");
      }}
    />
  );
}
