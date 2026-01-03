import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
    const { token } = useParams(); // Capturamos el token de la URL
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            return setError("Las contraseñas no coinciden ❌");
        }

        if (password.length < 6) {
            return setError("La contraseña debe tener al menos 6 caracteres");
        }

        setLoading(true);

        try {
            // Llamada al backend con el token
            await api.post(`/auth/reset-password/${token}`, { password });

            setMessage("✅ ¡Contraseña actualizada! Redirigiendo al login...");

            // Esperamos 2 segundos y lo mandamos al login
            setTimeout(() => {
                navigate("/login");
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || "El link expiró o es inválido.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
            <div className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", textAlign: "center", backgroundColor: "white" }}>
                <h2 style={{ color: "#0B5CFF", marginBottom: "20px" }}>Nueva Contraseña 🔒</h2>

                {error && <div style={{ color: "red", background: "#fee", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>{error}</div>}
                {message && <div style={{ color: "green", background: "#e8f5e9", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>{message}</div>}

                {!message && ( // Ocultamos el formulario si ya hubo éxito
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "15px", textAlign: "left" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="******"
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px", textAlign: "left" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="******"
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: loading ? "#ccc" : "#0B5CFF",
                                color: "white",
                                border: "none",
                                borderRadius: "50px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? "Actualizando..." : "Cambiar Contraseña"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}