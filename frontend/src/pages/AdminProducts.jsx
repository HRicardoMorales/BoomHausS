// frontend/src/pages/AdminProducts.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const DEFAULT_PRODUCT = {
    name: "Producto",
    subtitle: "Frase corta de venta",
    price: 19999,
    compareAtPrice: 26999,
    description: "Descripción del producto...",
    imageUrl: "",
    images: [],
    bullet1: "Beneficio 1",
    bullet2: "Beneficio 2",
    bullet3: "Beneficio 3",
    soldCount: 4766,
    rating: 4.8,
    reviewCount: 1168,
};

function normalizeProduct(p) {
    if (!p) return null;
    return {
        ...DEFAULT_PRODUCT,
        ...p,
        images: Array.isArray(p.images)
            ? p.images.filter(Boolean)
            : typeof p.images === "string"
                ? p.images.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
                : [],
    };
}

export default function AdminProducts() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [productId, setProductId] = useState(null);
    const [form, setForm] = useState(DEFAULT_PRODUCT);

    // Estado para el textarea de imágenes
    const [imagesRaw, setImagesRaw] = useState("");

    useEffect(() => {
        fetchSingle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchSingle() {
        setLoading(true);
        setError("");
        try {
            // 1) Intentar endpoint específico
            const res = await api.get("/products/single").catch(() => null);
            let p = res?.data?.data;

            // 2) Fallback: buscar el primero de la lista
            if (!p?._id) {
                const res2 = await api.get("/products?limit=1").catch(() => null);
                const arr = res2?.data?.data;
                p = Array.isArray(arr) ? arr[0] : null;
            }

            // 3) Si sigue sin existir, crear uno por defecto
            if (!p?._id) {
                const created = await api.post("/products", DEFAULT_PRODUCT);
                p = created.data?.data;
            }

            if (p?._id) {
                const normalized = normalizeProduct(p);
                setProductId(p._id);
                setForm(normalized);
                setImagesRaw((normalized.images || []).join("\n"));
            } else {
                setError("No se pudo obtener ni crear el producto.");
            }
        } catch (e) {
            console.error(e);
            setError("Error de conexión al cargar el producto.");
        } finally {
            setLoading(false);
        }
    }

    function setField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onImagesTextChange(v) {
        setImagesRaw(v);
        const parsed = v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        setField("images", parsed);
    }

    async function onSave() {
        if (!productId) return;
        setSaving(true);
        setError("");

        const parsedImages = imagesRaw.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

        const payload = {
            ...form,
            price: Number(form.price) || 0,
            compareAtPrice: Number(form.compareAtPrice) || 0,
            soldCount: Number(form.soldCount) || 0,
            rating: Number(form.rating) || 0,
            reviewCount: Number(form.reviewCount) || 0,
            images: parsedImages,
            // Trim strings
            name: form.name?.trim(),
            subtitle: form.subtitle?.trim(),
            description: form.description?.trim(),
            imageUrl: form.imageUrl?.trim(),
            bullet1: form.bullet1?.trim(),
            bullet2: form.bullet2?.trim(),
            bullet3: form.bullet3?.trim(),
        };

        try {
            // Intentar PUT, si falla intentar PATCH
            try {
                await api.put(`/products/${productId}`, payload);
            } catch {
                await api.patch(`/products/${productId}`, payload);
            }
            await fetchSingle();
            alert("✅ Producto guardado correctamente.");
        } catch (e) {
            console.error(e);
            setError("Error al guardar. Verifica la conexión.");
        } finally {
            setSaving(false);
        }
    }

    const previewUrls = useMemo(() => {
        return [form.imageUrl, ...(form.images || [])].filter(Boolean).slice(0, 8);
    }, [form.imageUrl, form.images]);

    // --- ESTILOS COMPARTIDOS ---
    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.2)', // Fondo oscuro sutil
        color: 'inherit',
        marginTop: '6px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '1rem'
    };

    const labelTitleStyle = {
        fontSize: '0.85rem',
        opacity: 0.7,
        fontWeight: 600
    };

    if (loading) return <div className="container section"><p className="muted">Cargando editor...</p></div>;

    return (
        <main className="section" style={{ paddingBottom: '4rem' }}>
            <div className="container">
                
                {/* Header Fijo / Principal */}
                <div className="card reveal" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className="badge">Editor</span>
                        <h1 style={{ margin: '0.5rem 0 0', letterSpacing: '-0.03em', fontSize: '1.8rem' }}>
                            Editar Producto
                        </h1>
                    </div>
                    
                    <button 
                        className="btn btn-primary" 
                        onClick={onSave} 
                        disabled={saving}
                        style={{ minWidth: '140px', padding: '12px 20px' }}
                    >
                        {saving ? "Guardando..." : "💾 Guardar Cambios"}
                    </button>
                </div>

                {error && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: 8, border: '1px solid rgba(255,0,0,0.3)', color: '#ff6b6b' }}>
                        <b>Error:</b> {error}
                    </div>
                )}

                {/* Grid Layout Automático (Responsive) */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    alignItems: 'start' 
                }}>
                    
                    {/* COLUMNA IZQUIERDA: Información Textual */}
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        
                        {/* 1. Datos Básicos */}
                        <section className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Información General</h3>
                            
                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>Nombre del Producto</div>
                                <input style={inputStyle} value={form.name} onChange={(e) => setField("name", e.target.value)} />
                            </label>

                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>Subtítulo (Gancho de venta)</div>
                                <input style={inputStyle} value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
                            </label>

                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                                <div style={labelTitleStyle}>Descripción Detallada</div>
                                <textarea 
                                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                                    value={form.description} 
                                    onChange={(e) => setField("description", e.target.value)} 
                                />
                            </label>
                        </section>

                        {/* 2. Precios */}
                        <section className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Precios</h3>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ ...labelStyle, flex: 1 }}>
                                    <div style={labelTitleStyle}>Precio Real ($)</div>
                                    <input type="number" style={inputStyle} value={form.price} onChange={(e) => setField("price", e.target.value)} />
                                </label>
                                <label style={{ ...labelStyle, flex: 1 }}>
                                    <div style={labelTitleStyle}>Precio Tachado ($)</div>
                                    <input type="number" style={inputStyle} value={form.compareAtPrice} onChange={(e) => setField("compareAtPrice", e.target.value)} />
                                </label>
                            </div>
                        </section>

                        {/* 3. Beneficios (Bullets) */}
                        <section className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Beneficios Clave</h3>
                            <p className="muted" style={{ fontSize: '0.8rem' }}>Estos puntos suelen aparecer cerca del botón de compra.</p>
                            
                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>Bullet 1</div>
                                <input style={inputStyle} value={form.bullet1} onChange={(e) => setField("bullet1", e.target.value)} />
                            </label>
                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>Bullet 2</div>
                                <input style={inputStyle} value={form.bullet2} onChange={(e) => setField("bullet2", e.target.value)} />
                            </label>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                                <div style={labelTitleStyle}>Bullet 3</div>
                                <input style={inputStyle} value={form.bullet3} onChange={(e) => setField("bullet3", e.target.value)} />
                            </label>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: Social Proof e Imágenes */}
                    <div style={{ display: 'grid', gap: '1.5rem' }}>

                        {/* 4. Social Proof */}
                        <section className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Prueba Social</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                <label style={{ marginBottom: 0 }}>
                                    <div style={labelTitleStyle}>Vendidos</div>
                                    <input type="number" style={inputStyle} value={form.soldCount} onChange={(e) => setField("soldCount", e.target.value)} />
                                </label>
                                <label style={{ marginBottom: 0 }}>
                                    <div style={labelTitleStyle}>Rating (1-5)</div>
                                    <input type="number" step="0.1" style={inputStyle} value={form.rating} onChange={(e) => setField("rating", e.target.value)} />
                                </label>
                                <label style={{ marginBottom: 0 }}>
                                    <div style={labelTitleStyle}>Nº Reseñas</div>
                                    <input type="number" style={inputStyle} value={form.reviewCount} onChange={(e) => setField("reviewCount", e.target.value)} />
                                </label>
                            </div>
                        </section>

                        {/* 5. Imágenes */}
                        <section className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Galería de Imágenes</h3>
                            
                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>URL Imagen Principal (Portada)</div>
                                <input style={inputStyle} value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://..." />
                            </label>

                            <label style={labelStyle}>
                                <div style={labelTitleStyle}>Imágenes Adicionales (1 URL por línea)</div>
                                <textarea 
                                    style={{ ...inputStyle, minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem' }} 
                                    rows={6}
                                    value={imagesRaw}
                                    onChange={(e) => onImagesTextChange(e.target.value)}
                                    placeholder={"https://imagen1.jpg\nhttps://imagen2.jpg\n..."}
                                />
                            </label>

                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={labelTitleStyle}>Vista Previa</div>
                                <div style={{ 
                                    marginTop: '10px', 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                    gap: '10px' 
                                }}>
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} style={{ 
                                            aspectRatio: '1/1', 
                                            borderRadius: 8, 
                                            overflow: 'hidden', 
                                            border: '1px solid var(--border)',
                                            background: '#000',
                                            position: 'relative'
                                        }}>
                                            <img 
                                                src={url} 
                                                alt={`preview-${idx}`} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {e.target.style.display = 'none'}} 
                                            />
                                            {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>Portada</span>}
                                        </div>
                                    ))}
                                    {!previewUrls.length && <p className="muted" style={{ fontSize: '0.8rem', gridColumn: '1/-1' }}>No hay imágenes válidas para mostrar.</p>}
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </main>
    );
}