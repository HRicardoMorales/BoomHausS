// frontend/src/pages/products.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { baseURL } from "../services/api";

export default function Products() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");

    const calledUrl = useMemo(() => `${baseURL}/products/single`, []);

    async function load() {
        setLoading(true);
        setErrMsg("");

        try {
            const res = await api.get("/products/single");
            const product = res.data?.data;

            if (!product?._id) {
                setErrMsg(res.data?.message || "No se encontró el producto único.");
                setLoading(false);
                return;
            }

            // ✅ Éxito: redirige al detalle inmediatamente
            navigate(`/products/${product._id}`, { replace: true });
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "No se pudo abrir la tienda.";
            setErrMsg(msg);
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 🎨 RENDERIZADO CONDICIONAL

    // 1. Si está cargando, mostramos una pantalla limpia y simple.
    if (loading) {
        return (
            <main className="section">
                <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
                    <h1 className="reveal">Cargando tienda...</h1>
                    <p className="muted">Estamos preparando tus productos.</p>
                </div>
            </main>
        );
    }

    // 2. Si llegamos aquí, es porque loading es false.
    // Si no redirigió, significa que hubo un ERROR. Mostramos el panel de debug.
    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: "1.2rem" }}>
                    <span className="badge" style={{ background: "#ff4d4d", color: "white" }}>Error</span>
                    <h1 style={{ marginTop: ".6rem" }}>
                        No se pudo abrir la tienda
                    </h1>

                    <p style={{ marginTop: ".35rem", fontWeight: 900, color: "#ff4d4d" }}>
                        {errMsg}
                    </p>

                    {/* Panel de Debug (Solo visible si hay error) */}
                    <div
                        className="card"
                        style={{
                            marginTop: "2rem",
                            padding: "1rem",
                            borderRadius: 16,
                            border: "1px solid var(--border)",
                            background: "rgba(0,0,0,0.02)"
                        }}
                    >
                        <div style={{ fontWeight: 950, marginBottom: ".35rem" }}>
                            Debug rápido
                        </div>
                        <div className="muted" style={{ wordBreak: "break-all", fontSize: "0.9rem" }}>
                            <div>API base: {baseURL}</div>
                            <div>URL llamada: {calledUrl}</div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: ".6rem",
                            flexWrap: "wrap",
                            marginTop: "1.5rem",
                        }}
                    >
                        <button className="btnPrimary" onClick={load}>
                            Reintentar →
                        </button>

                        <a className="btn" href={calledUrl} target="_blank" rel="noreferrer">
                            Abrir API Directa →
                        </a>

                        <Link className="btn" to="/">
                            Volver al inicio
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}