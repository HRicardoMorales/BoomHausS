import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import SafeImg from "../SafeImg";
import { moneyARS as money } from "../../utils/pricing.js";

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
      <style>{`
        .upx-wrap { max-width: 720px; margin: 0 auto; padding: 48px 20px; text-align: center; }
        .upx-icon { font-size: 3.2rem; margin-bottom: 18px; }
        .upx-title { font-size: 1.6rem; font-weight: 900; color: #0A0A0A; margin: 0 0 10px; letter-spacing: -0.02em; }
        .upx-sub { font-size: 1rem; color: #64748b; margin: 0 0 28px; line-height: 1.55; }
        .upx-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 40px; }
        .upx-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 999px; background: #0A0A0A; color: #fff; font-weight: 700; text-decoration: none; border: none; cursor: pointer; font-family: inherit; font-size: .95rem; }
        .upx-btn-primary:hover { background: #222; color: #fff; }
        .upx-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 999px; border: 1.5px solid #E8E2D9; color: #4A4A4A; font-weight: 700; text-decoration: none; background: transparent; cursor: pointer; font-family: inherit; font-size: .95rem; }
        .upx-btn-ghost:hover { border-color: #0A0A0A; color: #0A0A0A; }
        .upx-sugg-title { font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #9B8B7A; margin: 0 0 18px; }
        .upx-sugg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
        .upx-sugg-card { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid #EDE8DF; border-radius: 14px; background: #fff; text-decoration: none; color: inherit; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .upx-sugg-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.08); border-color: #C4B9AC; }
        .upx-sugg-img { aspect-ratio: 1; background: #F9F5EE; border-radius: 10px; overflow: hidden; }
        .upx-sugg-img img { width: 100%; height: 100%; object-fit: contain; padding: 8px; box-sizing: border-box; }
        .upx-sugg-name { font-size: .85rem; font-weight: 700; color: #0A0A0A; text-align: left; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .upx-sugg-price { font-size: 1rem; font-weight: 900; color: #0A0A0A; text-align: left; }
      `}</style>
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
