// frontend/src/pages/products.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { baseURL } from "../services/api";
import StatePanel from "../components/ui/StatePanel.jsx";
import Skeleton, { SkeletonGroup } from "../components/ui/Skeleton.jsx";
import "./products.css";

/**
 * /products resuelve el producto principal y redirige a su detalle.
 * Mientras tanto muestra un esqueleto con la forma de ProductDetail (galería
 * + info) para que la transición no "salte"; si falla, un estado de error
 * con reintento. El panel de diagnóstico (URL de la API) solo existe en dev:
 * antes se le mostraba al cliente.
 */
export default function Products() {
    const navigate = useNavigate();
    const [errMsg, setErrMsg] = useState("");
    // Cada reintento suma 1 y vuelve a disparar el efecto.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        api.get("/products/single")
            .then((res) => {
                if (cancelled) return;
                const product = res.data?.data;
                if (product?._id) navigate(`/products/${product._id}`, { replace: true });
                else setErrMsg(res.data?.message || "No se encontró el producto.");
            })
            .catch((err) => {
                if (!cancelled) setErrMsg(err?.response?.data?.message || err?.message || "No se pudo abrir la tienda.");
            });
        return () => { cancelled = true; };
    }, [attempt, navigate]);

    const retry = () => {
        setErrMsg("");
        setAttempt((n) => n + 1);
    };

    if (!errMsg) {
        return (
            <main className="section">
                <SkeletonGroup label="Cargando la tienda…" className="container products-skel">
                    <Skeleton className="products-skel__media" height="auto" radius="var(--radius-xl)" />
                    <div className="products-skel__info">
                        <Skeleton height={14} width="32%" />
                        <Skeleton height={34} width="88%" />
                        <Skeleton height={34} width="60%" />
                        <Skeleton height={18} width="44%" style={{ marginTop: 8 }} />
                        <Skeleton height={64} radius="var(--radius-md)" style={{ marginTop: 12 }} />
                        <Skeleton height={64} radius="var(--radius-md)" />
                        <Skeleton height={54} radius={999} style={{ marginTop: 12 }} />
                    </div>
                </SkeletonGroup>
            </main>
        );
    }

    return (
        <main className="section">
            <div className="container">
                <StatePanel
                    tone="error"
                    as="h1"
                    eyebrow="Tienda"
                    title="No pudimos abrir la tienda"
                    actions={
                        <>
                            <button type="button" className="btn btn-primary" onClick={retry}>
                                Reintentar
                            </button>
                            <Link className="btn btn-ghost" to="/">
                                Volver al inicio
                            </Link>
                        </>
                    }
                >
                    <p>Puede ser la conexión o un momento de mantenimiento. Probá de nuevo en unos segundos.</p>
                    {import.meta.env.DEV && (
                        <pre className="products-debug">
                            {`${errMsg}\nGET ${baseURL}/products/single`}
                        </pre>
                    )}
                </StatePanel>
            </div>
        </main>
    );
}
