import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth } from "../utils/auth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import {
  MIN_PASSWORD,
  authErrorMessage,
  authFromResponse,
  redirectTarget,
  registerError,
} from "../components/auth/authForm";

const SIDE = {
  badge: "Rápido y seguro",
  title: "¿Por qué crear cuenta?",
  text: "Porque te da seguimiento del pedido y te evita problemas con el comprobante.",
  benefits: [
    { icon: "📦", title: "Historial de pedidos", text: "Vas a “Mis pedidos” y ves todo ordenado." },
    { icon: "📎", title: "Subir comprobante", text: "Adjuntás la captura/PDF sin vueltas." },
    { icon: "🛡️", title: "Compra protegida", text: "Tu pedido queda registrado y confirmado." },
  ],
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passMismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    const invalid = registerError({ password, confirm });
    setError(invalid);
    if (invalid) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });

      // Si el backend no loguea al registrar, no viene token: seguimos en /login
      // conservando a dónde quería ir.
      if (!saveAuth(authFromResponse(res.data))) {
        navigate("/login", { replace: true, state: { from: location.state?.from } });
        return;
      }
      navigate(redirectTarget(location.state), { replace: true });
    } catch (err) {
      setError(
        authErrorMessage(err, "Error al registrarte.", {
          byStatus: { 409: "Ese email ya está registrado. Probá iniciar sesión." },
        })
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Cuenta"
      brandSub="Creá tu cuenta para ver pedidos y subir comprobantes."
      title="Crear cuenta"
      subtitle="Te toma 30 segundos. Después podés comprar y seguir el estado de tu pedido."
      error={error}
      side={SIDE}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" state={location.state} className="authLink">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="authForm" aria-busy={loading}>
        <AuthField
          label="Nombre"
          icon="👤"
          autoComplete="name"
          value={name}
          onChange={setName}
          placeholder="Tu nombre"
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
          hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
          revealable
          required
        />
        <AuthField
          label="Repetir contraseña"
          icon="🔁"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repetí la contraseña"
          error={passMismatch ? "Las contraseñas no coinciden." : ""}
          revealable
          required
        />

        <button className="authPrimaryBtn" type="submit" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta →"}
        </button>
      </form>
    </AuthLayout>
  );
}
