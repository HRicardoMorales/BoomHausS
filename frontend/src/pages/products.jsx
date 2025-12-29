// frontend/src/pages/products.jsx
// "Tienda" en modo one-product: busca el producto único y redirige al detalle.

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

            // ✅ redirige al detalle
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

    return (
        <main className="section">
            <div className="container">
                <section className="card reveal" style={{ padding: "1.2rem" }}>
                    <span className="badge">Tienda</span>
                    <h1 style={{ marginTop: ".6rem" }}>
                        {loading ? "Cargando tienda..." : "No se pudo abrir la tienda"}
                    </h1>

                    {errMsg ? (
                        <p style={{ marginTop: ".35rem", fontWeight: 900 }}>
                            Error: {errMsg}
                        </p>
                    ) : (
                        <p className="muted" style={{ marginTop: ".35rem" }}>
                            Estamos buscando el producto...
                        </p>
                    )}

                    <div
                        className="card"
                        style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            borderRadius: 16,
                            border: "1px solid var(--border)",
                        }}
                    >
                        <div style={{ fontWeight: 950, marginBottom: ".35rem" }}>
                            Debug rápido
                        </div>
                        <div className="muted" style={{ wordBreak: "break-all" }}>
                            <div>API base: {baseURL}</div>
                            <div>URL llamada: {calledUrl}</div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: ".6rem",
                            flexWrap: "wrap",
                            marginTop: "1rem",
                        }}
                    >
                        <button className="btnPrimary" onClick={load} disabled={loading}>
                            {loading ? "Cargando..." : "Reintentar →"}
                        </button>

                        <a className="btn" href={calledUrl} target="_blank" rel="noreferrer">
                            Abrir /products/single →
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
