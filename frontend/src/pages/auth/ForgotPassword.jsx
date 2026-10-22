import { useState } from "react";
import api from "../../services/api";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import { authErrorMessage } from "../../components/auth/authForm";

export const FORGOT_SENT_MESSAGE =
  "Te enviamos un correo con el link para elegir una contraseña nueva. Revisá la bandeja de entrada (y spam).";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err, "Error al enviar el correo."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Recuperar acceso"
      brandSub="Te ayudamos a volver a entrar."
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresá el email de tu cuenta y te mandamos un link para elegir una nueva."
      error={error}
      notice={sent ? FORGOT_SENT_MESSAGE : ""}
      back={{ to: "/login", label: "Volver a iniciar sesión" }}
    >
      <form onSubmit={handleSubmit} className="authForm" aria-busy={loading}>
        <AuthField
          label="Email"
          icon="✉"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          placeholder="tuemail@gmail.com"
          required
        />

        <button className="authPrimaryBtn" type="submit" disabled={loading}>
          {loading ? "Enviando…" : sent ? "Reenviar link" : "Enviar link de recuperación"}
        </button>
      </form>
    </AuthLayout>
  );
}
