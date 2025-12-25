// frontend/src/pages/products.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Products() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                // ✅ trae el producto único desde backend
                const res = await api.get("/products/single");
                const product = res.data?.data;

                if (!product?._id) {
                    // si por alguna razón no hay single, volvemos al home
                    navigate("/", { replace: true });
                    return;
                }

                // ✅ redirige al detalle
                navigate(`/products/${product._id}`, { replace: true });
            } catch (err) {
                console.error("Error loading single product:", err);
                navigate("/", { replace: true });
            }
        })();
    }, [navigate]);

    return null; // no mostramos listado nunca
}
