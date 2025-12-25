import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TiendaRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const { data } = await axios.get("/api/products/single");
            navigate(`/product/${data._id}`, { replace: true });
        })().catch((e) => {
            console.error(e);
            alert("No se pudo cargar el producto único.");
        });
    }, [navigate]);

    return <div style={{ padding: 16 }}>Cargando producto...</div>;
}
