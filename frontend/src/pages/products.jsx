// frontend/src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Products() {
    const navigate = useNavigate();

    const [state, setState] = useState({ loading: true, error: null, debug: null });

    // Para mostrar qué baseURL está usando Axios (clave para el deploy)
    const apiBase = useMemo(() => {
        return api?.defaults?.baseURL || import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    }, []);

    async function load() {
        setState({ loading: true, error: null, debug: null });

        try {
            const res = await api.get("/products/single");
            const product = res.data?.data;

            if (product?._id) {
                navigate(`/products/${product._id}`, { replace: true });
                return;
            }

            setState({
                loading: false,
                error: "El backend respondió, pero NO vino un producto válido (falta _id).",
                debug: { apiBase, response: res.data },
            });
        } catch (err) {
            const status = err?.response?.status;
            const url = `${err?.config?.baseURL || apiBase}${err?.config?.url || ""}`;

            setState({
                loading: false,
                error:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Error cargando el producto.",
                debug: {
                    apiBase,
                    status,
                    url,
                    response: err?.response?.data,
                },
            });
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (state.loading) {
        return (
            <main className="section">
                <div className="container">
                    <section className="card reveal" style={{ padding: "1.2rem" }}>
                        <span className="badge">Tienda</span>
                        <h1 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.05em" }}>
                            Cargando producto…
                        </h1>
                        <p className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.7 }}>
                            Conectando con el backend…
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    if (state.error) {
        return (
            <main className="section">
                <div className="container">
                    <section className="card reveal" style={{ padding: "1.2rem" }}>
                        <span className="badge">Tienda</span>
                        <h1 style={{ margin: "0.65rem 0 0.25rem", letterSpacing: "-0.05em" }}>
                            No se pudo abrir la tienda
                        </h1>

                        <p style={{ marginTop: "0.6rem", fontWeight: 900 }}>
                            Error: <span style={{ fontWeight: 700 }}>{state.error}</span>
                        </p>

                        <div className="card" style={{ marginTop: "0.8rem", padding: "0.9rem" }}>
                            <div style={{ fontWeight: 950 }}>Debug rápido</div>
                            <div className="muted" style={{ marginTop: "0.35rem", lineHeight: 1.6 }}>
                                <div><b>API base:</b> {state.debug?.apiBase}</div>
                                {state.debug?.status ? <div><b>Status:</b> {state.debug.status}</div> : null}
                                {state.debug?.url ? <div><b>URL llamada:</b> {state.debug.url}</div> : null}
                            </div>
                        </div>

                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={load} type="button">
                                Reintentar →
                            </button>

                            <a
                                className="btn btn-ghost"
                                href={`${apiBase}/products/single`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Abrir /products/single →
                            </a>

                            <Link className="btn btn-ghost" to="/">
                                Volver al inicio
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    // Si llegó acá, igual no debería (porque navega al detalle), pero por las dudas:
    return null;
}
