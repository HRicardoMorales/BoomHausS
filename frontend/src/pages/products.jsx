import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";


export default function Products() {
    const navigate = useNavigate();
    const [err, setErr] = useState("");
    const calledUrl = `${baseURL}/products/single`;

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                const res = await api.get("/products/single");
                const product = res.data?.data;

                if (!product?._id) {
                    setErr("No se recibió producto único (single).");
                    return;
                }

                navigate(`/products/${product._id}`, { replace: true });
            } catch (e) {
                console.error("Error loading single product:", e);
                setErr(e?.message || "Network Error");
            }
        })();
    }, [navigate]);

    if (!err) return null;

    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: "1.2rem" }}>
                    <span className="badge">Tienda</span>
                    <h1 style={{ marginTop: ".7rem" }}>No se pudo abrir la tienda</h1>
                    <p className="muted" style={{ marginTop: ".5rem" }}>
                        <b>Error:</b> {err}
                    </p>

                    <div className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
                        <div style={{ fontWeight: 900, marginBottom: ".4rem" }}>Debug rápido</div>
                        <div className="muted">API base: {baseURL}</div>
                        <div className="muted">URL llamada: {calledUrl}</div>
                    </div>

                    <div style={{ marginTop: "1rem", display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            Reintentar →
                        </button>
                        <a className="btn btn-ghost" href={calledUrl} target="_blank" rel="noreferrer">
                            Abrir /products/single →
                        </a>
                        <button className="btn btn-ghost" onClick={() => navigate("/", { replace: true })}>
                            Volver al inicio
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
