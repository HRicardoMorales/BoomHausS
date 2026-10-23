import "./GuaranteeNote.css";

/**
 * Línea de garantía debajo de los CTA (antes `<p className="pd-cta-guarantee">`
 * repetido con su CSS en 4 landings). `light` para fondos oscuros.
 */
export default function GuaranteeNote({
  light = false,
  children = "Garantía 30 días — Si no te convence, te devolvemos el dinero entero",
}) {
  return (
    <p className={`lp-guarantee${light ? " lp-guarantee--light" : ""}`}>
      <span aria-hidden="true">🛡️</span> {children}
    </p>
  );
}
