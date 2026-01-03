import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api"; // Tu configuración de axios


export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            // Llamada al backend
            await api.post("/auth/forgot-password", { email });
            setMessage("✅ Te enviamos un correo. Revisa tu bandeja de entrada (y spam).");
        } catch (err) {
            setError(err.response?.data?.message || "Error al enviar el correo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", padding: "20px" }}>
            <div className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                <h2 style={{ color: "#0B5CFF", marginBottom: "10px" }}>Recuperar Acceso 🔐</h2>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                    Ingresa tu email y te enviaremos un link mágico para volver a entrar.
                </p>

                {error && <div style={{ color: "red", background: "#fee", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>{error}</div>}
                {message && <div style={{ color: "green", background: "#e8f5e9", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px", textAlign: "left" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333" }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="ejemplo@correo.com"
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
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
                        {loading ? "Enviando..." : "Enviar Link de Recuperación"}
                    </button>
                </form>

                <div style={{ marginTop: "20px" }}>
                    <Link to="/login" style={{ color: "#0B5CFF", textDecoration: "none", fontWeight: "500" }}>
                        ← Volver a Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}