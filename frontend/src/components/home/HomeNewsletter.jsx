import { useId, useState } from "react";
import { subscribe } from "../../services/newsletter.js";

/*
 * Newsletter: formulario accesible (label real, error asociado con
 * aria-describedby, estado anunciado con role="status"). El envío pasa por
 * `services/newsletter` (hoy un mock: ver el archivo).
 */
export default function HomeNewsletter() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (state.status === "loading") return;
    setState({ status: "loading", message: "" });
    try {
      await subscribe(email);
      setState({ status: "done", message: "¡Listo! Te vamos a avisar de las próximas ofertas." });
      setEmail("");
    } catch (err) {
      setState({ status: "error", message: err?.message || "No pudimos anotarte. Probá de nuevo." });
    }
  };

  const invalid = state.status === "error";

  return (
    <section className="hn" aria-labelledby={`${id}-title`}>
      <div className="hp-inner">
        <div className="hn-card hc-anim">
          <div className="hn-copy">
            <p className="hp-eyebrow hp-eyebrow--ink">Lista de ofertas</p>
            <h2 className="hp-title hp-title--ink hn-title" id={`${id}-title`}>
              Enterate <em>primero.</em>
            </h2>
            <p className="hp-lede hp-lede--ink">
              Un mail cuando entra un producto nuevo o baja un precio. Nada más, y te das de baja con un clic.
            </p>
          </div>

          <form className="hn-form" onSubmit={onSubmit} noValidate>
            <label className="hn-label" htmlFor={`${id}-email`}>Tu mail</label>
            <div className="hn-field">
              <input
                id={`${id}-email`}
                className="hn-input"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nombre@mail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (invalid) setState({ status: "idle", message: "" });
                }}
                aria-invalid={invalid || undefined}
                aria-describedby={`${id}-msg`}
                required
              />
              <button className="hn-submit" type="submit" disabled={state.status === "loading"}>
                {state.status === "loading" ? "Anotando…" : "Avisame"}
              </button>
            </div>
            <p
              id={`${id}-msg`}
              className={`hn-msg${invalid ? " hn-msg--error" : ""}${state.status === "done" ? " hn-msg--done" : ""}`}
              role="status"
            >
              {state.message}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
