import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

// Configuración por defecto si no existe producto
const DEFAULT_PRODUCT = {
    name: "BodySculpt Pro",
    subtitle: "Resultados de clínica en casa",
    price: 129999,
    compareAtPrice: 259999,
    description: "La solución definitiva para esculpir tu cuerpo...",
    imageUrl: "",
    images: [], // Array de strings
    bullet1: "Disuelve grasa rebelde",
    bullet2: "Tensa la piel flácida",
    bullet3: "Resultados en 4 semanas",
    soldCount: 894,
    rating: 4.9,
    reviewCount: 1200,
};

export default function AdminProducts() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [productId, setProductId] = useState(null);
    const [form, setForm] = useState(DEFAULT_PRODUCT);
    const [imagesRaw, setImagesRaw] = useState(""); // Texto del textarea

    useEffect(() => {
        fetchProduct();
    }, []);

    // 1. Lógica robusta para obtener el producto (Single Product Store)
    async function fetchProduct() {
        setLoading(true);
        setError("");
        try {
            // Intentar obtener el producto individual o el primero de la lista
            let p = null;
            
            // Intento A: Endpoint específico
            try {
                const res = await api.get("/products/single");
                if (res.data?.data) p = res.data.data;
            } catch (err) { /* Ignorar error 404 aqui */ }

            // Intento B: Listar todos y agarrar el primero
            if (!p) {
                const resList = await api.get("/products?limit=1");
                const arr = resList.data?.data || resList.data;
                if (Array.isArray(arr) && arr.length > 0) p = arr[0];
            }

            // Intento C: Crear uno si no existe nada
            if (!p) {
                console.log("Creando producto por defecto...");
                const created = await api.post("/products", DEFAULT_PRODUCT);
                p = created.data?.data || created.data;
            }

            if (p && p._id) {
                setProductId(p._id);
                // Normalizar datos para evitar undefined en los inputs
                const normalized = {
                    ...DEFAULT_PRODUCT,
                    ...p,
                    images: Array.isArray(p.images) ? p.images : [],
                };
                setForm(normalized);
                // Convertir array de imágenes a texto para el textarea
                setImagesRaw(
                    [normalized.imageUrl, ...(normalized.images || [])]
                    .filter(Boolean)
                    .join("\n")
                );
            } else {
                setError("No se pudo inicializar el producto. Revisa tu backend.");
            }
        } catch (e) {
            console.error(e);
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }

    // 2. Manejadores de cambios
    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function handleNumberChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }

    // Sincronizar textarea de imágenes con el estado del formulario
    function handleImagesChange(e) {
        const val = e.target.value;
        setImagesRaw(val);
        
        // Procesar las URLs: separar por línea y limpiar espacios
        const urls = val.split(/\r?\n/).map(u => u.trim()).filter(u => u.length > 0);
        
        // La primera URL va a imageUrl (portada), el resto a images (galería)
        if (urls.length > 0) {
            setForm(prev => ({
                ...prev,
                imageUrl: urls[0],
                images: urls.slice(1)
            }));
        } else {
            setForm(prev => ({ ...prev, imageUrl: "", images: [] }));
        }
    }

    // 3. Guardar cambios (Limpiando el payload)
    async function onSave() {
        if (!productId) return;
        setSaving(true);
        setError("");
        setSuccessMsg("");

        // Construir payload limpio para evitar errores de validación en backend
        const payload = {
            name: form.name.trim(),
            subtitle: form.subtitle?.trim(),
            description: form.description?.trim(),
            price: Number(form.price),
            compareAtPrice: Number(form.compareAtPrice),
            soldCount: Number(form.soldCount),
            rating: Number(form.rating),
            reviewCount: Number(form.reviewCount),
            bullet1: form.bullet1?.trim(),
            bullet2: form.bullet2?.trim(),
            bullet3: form.bullet3?.trim(),
            imageUrl: form.imageUrl?.trim(),
            images: form.images.filter(Boolean), // Array limpio
        };

        try {
            // Intentar PUT primero (estándar REST), fallback a PATCH
            try {
                await api.put(`/products/${productId}`, payload);
            } catch (err) {
                await api.patch(`/products/${productId}`, payload);
            }
            
            setSuccessMsg("¡Producto actualizado correctamente!");
            setTimeout(() => setSuccessMsg(""), 3000);
            
            // Recargar para asegurar sincronización
            await fetchProduct(); 
        } catch (e) {
            console.error(e);
            setError("Error al guardar. Verifica que el servidor esté activo.");
        } finally {
            setSaving(false);
        }
    }

    // Preview de imágenes para la UI
    const allImages = useMemo(() => {
        return [form.imageUrl, ...form.images].filter(Boolean);
    }, [form.imageUrl, form.images]);

    if (loading) return (
        <div className="section container" style={{textAlign:'center', padding:'50px'}}>
            <div className="spinner"></div>
            <p className="muted">Cargando panel de administración...</p>
        </div>
    );

    return (
        <main className="section" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
            <div className="container">
                
                {/* === HEADER === */}
                <div className="admin-header card shadow-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>Administrar Producto</h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Edita el contenido de tu landing page principal.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to={`/product/${productId}`} target="_blank" className="btn btn-ghost" style={{border:'1px solid #cbd5e1'}}>
                            👁️ Ver Tienda
                        </Link>
                        <button 
                            className="btn btn-primary" 
                            onClick={onSave} 
                            disabled={saving}
                            style={{ minWidth: '150px', background: saving ? '#94a3b8' : '#0B5CFF' }}
                        >
                            {saving ? "Guardando..." : "💾 Guardar Cambios"}
                        </button>
                    </div>
                </div>

                {/* === MENSAJES === */}
                {error && <div className="alert-error" style={alertStyle.error}>{error}</div>}
                {successMsg && <div className="alert-success" style={alertStyle.success}>{successMsg}</div>}

                {/* === GRID DEL FORMULARIO === */}
                <div className="admin-grid">
                    
                    {/* COLUMNA IZQUIERDA: DATOS PRINCIPALES */}
                    <div className="admin-col">
                        
                        {/* 1. INFO GENERAL */}
                        <section className="card admin-card">
                            <h3 className="card-title">Información General</h3>
                            
                            <div className="form-group">
                                <label>Nombre del Producto</label>
                                <input className="form-input" name="name" value={form.name} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>Subtítulo (Gancho Marketing)</label>
                                <input className="form-input" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Ej: Resultados de clínica en casa" />
                            </div>

                            <div className="form-group">
                                <label>Descripción Completa</label>
                                <textarea 
                                    className="form-input" 
                                    name="description" 
                                    value={form.description} 
                                    onChange={handleChange} 
                                    rows={6}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </section>

                        {/* 2. PRECIOS */}
                        <section className="card admin-card">
                            <h3 className="card-title">Estrategia de Precios</h3>
                            <div className="row-2">
                                <div className="form-group">
                                    <label>Precio Real ($)</label>
                                    <input type="number" className="form-input price-real" name="price" value={form.price} onChange={handleNumberChange} />
                                </div>
                                <div className="form-group">
                                    <label>Precio Tachado (Comparación)</label>
                                    <input type="number" className="form-input price-compare" name="compareAtPrice" value={form.compareAtPrice} onChange={handleNumberChange} />
                                </div>
                            </div>
                        </section>

                        {/* 3. BENEFICIOS HERO (Bullets) */}
                        <section className="card admin-card">
                            <h3 className="card-title">Beneficios Destacados (Hero)</h3>
                            <p className="hint">Estos puntos aparecen justo debajo del precio.</p>
                            
                            <div className="form-group">
                                <label>Beneficio 1</label>
                                <input className="form-input" name="bullet1" value={form.bullet1} onChange={handleChange} placeholder="Ej: Envío Gratis" />
                            </div>
                            <div className="form-group">
                                <label>Beneficio 2</label>
                                <input className="form-input" name="bullet2" value={form.bullet2} onChange={handleChange} placeholder="Ej: Garantía 90 días" />
                            </div>
                            <div className="form-group">
                                <label>Beneficio 3</label>
                                <input className="form-input" name="bullet3" value={form.bullet3} onChange={handleChange} placeholder="Ej: Resultados rápidos" />
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: MEDIA & SOCIAL */}
                    <div className="admin-col">
                        
                        {/* 4. IMÁGENES */}
                        <section className="card admin-card">
                            <h3 className="card-title">Galería de Imágenes</h3>
                            <p className="hint">Pega una URL por línea. La primera será la portada.</p>
                            
                            <textarea 
                                className="form-input mono" 
                                value={imagesRaw} 
                                onChange={handleImagesChange} 
                                rows={8}
                                placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg"
                            />

                            <div className="preview-grid">
                                {allImages.map((src, i) => (
                                    <div key={i} className="preview-item">
                                        <img src={src} alt={`preview-${i}`} onError={(e) => e.target.style.display='none'} />
                                        {i === 0 && <span className="cover-badge">Portada</span>}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. PRUEBA SOCIAL */}
                        <section className="card admin-card">
                            <h3 className="card-title">Prueba Social (Fake Stats)</h3>
                            
                            <div className="form-group">
                                <label>Unidades Vendidas</label>
                                <input type="number" className="form-input" name="soldCount" value={form.soldCount} onChange={handleNumberChange} />
                            </div>
                            
                            <div className="row-2">
                                <div className="form-group">
                                    <label>Rating (Ej: 4.9)</label>
                                    <input type="number" step="0.1" max="5" className="form-input" name="rating" value={form.rating} onChange={handleNumberChange} />
                                </div>
                                <div className="form-group">
                                    <label>Cant. Reseñas</label>
                                    <input type="number" className="form-input" name="reviewCount" value={form.reviewCount} onChange={handleNumberChange} />
                                </div>
                            </div>
                        </section>
                    </div>

                </div>
            </div>

            <style>{`
                /* ESTILOS PRO ADMIN */
                .admin-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 25px; align-items: start; }
                @media(max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
                
                .admin-card { padding: 25px; margin-bottom: 25px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius: 12px; background: white; }
                .card-title { margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 1.1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
                
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; font-weight: 600; font-size: 0.85rem; color: #475569; margin-bottom: 6px; }
                
                .form-input { 
                    width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; 
                    font-size: 0.95rem; transition: all 0.2s; color: #1e293b; background: #fff;
                }
                .form-input:focus { outline: none; border-color: #0B5CFF; box-shadow: 0 0 0 3px rgba(11, 92, 255, 0.1); }
                .form-input.mono { font-family: 'Consolas', monospace; font-size: 0.85rem; color: #334155; }
                
                .price-real { font-weight: 700; color: #166534; }
                .price-compare { text-decoration: line-through; color: #94a3b8; }
                
                .hint { font-size: 0.8rem; color: #94a3b8; margin-top: -10px; margin-bottom: 15px; font-style: italic; }
                .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                
                /* Preview Grid Pro (Cuadrado 1:1) */
                .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-top: 15px; }
                .preview-item { 
                    aspect-ratio: 1/1; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; 
                    position: relative; background: #f8fafc; 
                }
                .preview-item img { 
                    width: 100%; height: 100%; 
                    object-fit: contain; /* IMPORTANTE: Igual que en la tienda */
                    padding: 5px;
                }
                .cover-badge { 
                    position: absolute; bottom: 0; left: 0; right: 0; 
                    background: rgba(11, 92, 255, 0.9); color: white; 
                    font-size: 0.65rem; text-align: center; padding: 2px; 
                    font-weight: 700; text-transform: uppercase;
                }
            `}</style>
        </main>
    );
}

const alertStyle = {
    error: { padding: '15px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '20px', fontWeight: '500' },
    success: { padding: '15px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '20px', fontWeight: '500' }
};