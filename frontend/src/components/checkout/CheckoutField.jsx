// Campo de texto del checkout fullpage: label accesible + input + mensaje de error.
// Reemplaza el patrón input + fieldError/fieldOk + <span> que estaba copiado 7 veces
// en pages/checkout.jsx. La validación sigue en la página: acá solo llega el texto
// del error (vacío = válido) y si el campo ya se considera "ok".
//
// - El label es `sr-only`: el diseño usa el placeholder como rótulo visual, pero el
//   placeholder desaparece al tipear y no es un nombre accesible confiable.
// - `aria-invalid` + `aria-describedby` atan el error al input para lectores de pantalla.
import { useId } from "react";

export function CheckoutField({ label, error = "", ok = false, icon = null, className = "", placeholder, ...inputProps }) {
  const id = useId();
  const errId = `${id}-err`;
  const classes = [
    "ckfp-input",
    icon ? "ckfp-input--icon" : "",
    className,
    error ? "err" : "",
    ok ? "ok" : "",
  ].filter(Boolean).join(" ");

  const input = (
    <input
      id={id}
      placeholder={placeholder ?? label}
      className={classes}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errId : undefined}
      {...inputProps}
    />
  );

  return (
    <div className="ckfp-field">
      <label htmlFor={id} className="sr-only">{label}</label>
      {icon ? <div className="ckfp-input-icon-wrap">{input}{icon}</div> : input}
      {error && <span id={errId} className="ckfp-field-err">{error}</span>}
    </div>
  );
}
