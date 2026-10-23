import { useId, useState } from "react";

/**
 * Campo de formulario de auth: label asociado por id, ícono decorativo,
 * botón mostrar/ocultar para contraseñas (con aria-pressed) y mensaje
 * de error/ayuda enlazado por aria-describedby.
 */
export default function AuthField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  error = "",
  hint = "",
  revealable = false,
  ...inputProps
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const msgId = `${id}-msg`;
  const message = error || hint;
  const inputType = revealable && revealed ? "text" : type;

  return (
    <div className="authLabel">
      <label htmlFor={id}>{label}</label>
      <div className={`authField${error ? " is-invalid" : ""}`}>
        {icon ? (
          <span className="authFieldIcon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className="authInput"
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? msgId : undefined}
          {...inputProps}
        />
        {revealable ? (
          <button
            type="button"
            className="authPassBtn"
            aria-pressed={revealed}
            aria-controls={id}
            aria-label={revealed ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? "Ocultar" : "Mostrar"}
          </button>
        ) : null}
      </div>
      <p id={msgId} className={error ? "authFieldError" : "authFieldHint"} aria-live="polite">
        {message}
      </p>
    </div>
  );
}
