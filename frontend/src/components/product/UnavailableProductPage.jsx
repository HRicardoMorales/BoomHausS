import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import SafeImg from "../SafeImg";
import { moneyARS as money } from "../../utils/pricing.js";
import "./UnavailableProductPage.css";

/* =========================
   UnavailableProductPage
   Se muestra cuando:
   - el producto esta desactivado (isActive:false → 404 del endpoint)
   - el slug no existe en la BD
   - hubo error de red (con boton reintentar)
   Reemplaza el "Error / ← Volver" pelado por una pagina digna con CTA al
   catalogo y sugerencias de productos activos.
========================= */
export default function UnavailableProductPage({ isNetworkError, onRetry }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Sugerencias: primeros 3 productos activos con imagen y precio
    api.get("/products")
      .then(r => {
        const raw = r.data?.data ?? r.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        const filtered = arr.filter(p =>
          Number(p.price) > 0 && ((p.images?.length > 0 && p.images[0]) || p.imageUrl)
        ).slice(0, 3);
        setSuggestions(filtered);
      })
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <main className="section">
      <div className="upx-wrap">
        <div className="upx-icon">{isNetworkError ? "📡" : "🔍"}</div>
        <h1 className="upx-title">
          {isNetworkError
            ? "No pudimos conectar con la tienda"
            : "Este producto no está disponible por el momento"}
        </h1>
        <p className="upx-sub">
          {isNetworkError
            ? "Puede ser un problema temporal de conexión. Probá reintentar en unos segundos o explorá el resto del catálogo."
            : "Puede haber sido pausado o quedar sin stock. Mirá el resto del catálogo — seguro encontrás algo que te guste."}
        </p>
        <div className="upx-actions">
          {isNetworkError && onRetry && (
            <button type="button" className="upx-btn-primary" onClick={onRetry}>
              Reintentar
            </button>
          )}
          <Link className={isNetworkError ? "upx-btn-ghost" : "upx-btn-primary"} to="/public">
            Ver otros productos →
          </Link>
        </div>

        {suggestions.length > 0 && (
          <>
            <p className="upx-sugg-title">También podría interesarte</p>
            <div className="upx-sugg-grid">
              {suggestions.map(p => {
                const href = p.slug ? `/lp/${p.slug}` : `/products/${p._id}`;
                const img = p.images?.[0] || p.imageUrl || "";
                return (
                  <Link key={p._id} className="upx-sugg-card" to={href}>
                    <div className="upx-sugg-img">
                      {img && <SafeImg src={img} alt="" name={p.name} widths={[240, 360]} sizes="120px" width={120} height={120} />}
                    </div>
                    <div className="upx-sugg-name">{p.name}</div>
                    <div className="upx-sugg-price">{money(p.price)}</div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
