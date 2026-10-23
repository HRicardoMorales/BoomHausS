import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import { MIN_PASSWORD, authErrorMessage, registerError } from "../../components/auth/authForm";

export const RESET_REDIRECT_MS = 3000;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Tras el éxito, al login en 3 s. Con limpieza: si la persona toca
  // "Ir a iniciar sesión" antes (o se va), el timer no navega después.
  useEffect(() => {
    if (!done) return undefined;
    const id = setTimeout(() => navigate("/login", { replace: true }), RESET_REDIRECT_MS);
    return () => clearTimeout(id);
  }, [done, navigate]);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    const invalid = registerError({ password, confirm });
    if (invalid) {
      setError(invalid);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err, "El link expiró o es inválido."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Nueva contraseña"
      brandSub="Último paso para recuperar tu cuenta."
      title="Elegí una contraseña nueva"
      subtitle={`Usá al menos ${MIN_PASSWORD} caracteres. Después vas a poder entrar con ella.`}
      error={error}
      notice={done ? "¡Contraseña actualizada! Te llevamos al login en unos segundos." : ""}
      back={{ to: "/login", label: "Volver a iniciar sesión" }}
    >
      {done ? (
        <Link to="/login" replace className="authPrimaryBtn authPrimaryBtn--link">
          Ir a iniciar sesión →
        </Link>
      ) : (
        <form onSubmit={handleSubmit} className="authForm" aria-busy={loading}>
          <AuthField
            label="Nueva contraseña"
            icon="🔒"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
            revealable
            required
          />
          <AuthField
            label="Repetir contraseña"
            icon="🔒"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repetila"
            error={mismatch ? "Las contraseñas no coinciden." : ""}
            revealable
            required
          />

          <button className="authPrimaryBtn" type="submit" disabled={loading}>
            {loading ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
