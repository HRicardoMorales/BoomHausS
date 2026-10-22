import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth } from "../utils/auth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import { authErrorMessage, authFromResponse, redirectTarget } from "../components/auth/authForm";

const SIDE = {
  badge: "Compra segura",
  title: "Tu cuenta te da control total",
  text: "Seguís el estado del pedido y subís el comprobante en segundos.",
  benefits: [
    { icon: "✅", title: "Mis pedidos", text: "Ves el estado, total y datos del envío." },
    { icon: "📎", title: "Subir comprobante", text: "Adjuntás la captura y confirmamos." },
    { icon: "💬", title: "Soporte rápido", text: "Te ayudamos por WhatsApp si hace falta." },
  ],
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      if (!saveAuth(authFromResponse(res.data))) {
        setError(res.data?.message || "No se pudo iniciar sesión (no vino token).");
        return;
      }
      navigate(redirectTarget(location.state), { replace: true });
    } catch (err) {
      setError(
        authErrorMessage(err, "Error al iniciar sesión.", {
          fallbackByStatus: { 401: "Email o contraseña incorrectos." },
        })
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Acceso"
      brandSub="Ingresá para ver pedidos y subir comprobantes."
      title="Iniciar sesión"
      subtitle="Entrás en 10 segundos. Tu cuenta te permite ver el estado del pedido y adjuntar el comprobante."
      error={error}
      side={SIDE}
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link to="/register" state={location.state} className="authLink">
            Registrate
          </Link>
        </>
      }
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
        <AuthField
          label="Contraseña"
          icon="🔒"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Tu contraseña"
          revealable
          required
        />

        <Link to="/forgot-password" className="authForgot">
          ¿Olvidaste tu contraseña?
        </Link>

        <button className="authPrimaryBtn" type="submit" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar →"}
        </button>
      </form>
    </AuthLayout>
  );
}
