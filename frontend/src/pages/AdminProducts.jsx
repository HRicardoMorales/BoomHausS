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
                ? p.images
                    .split(/\r?\n/)
                    .map((x) => x.trim())
                    .filter(Boolean)
                : [],
    };
}

export default function AdminProducts() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [productId, setProductId] = useState(null);
    const [form, setForm] = useState(DEFAULT_PRODUCT);

    // ✅ IMPORTANTE: este state guarda lo que escribís TAL CUAL en el textarea (con enters/espacios)
    const [imagesRaw, setImagesRaw] = useState("");

    async function fetchSingle() {
        setLoading(true);
        setError("");
        try {
            // 1) Endpoint recomendado
            const res = await api.get("/products/single");
            const p = res.data?.data;
            if (p?._id) {
                const normalized = normalizeProduct(p);
                setProductId(p._id);
                setForm(normalized);
                setImagesRaw((normalized.images || []).join("\n")); // ✅ mantiene el textarea editable
                setLoading(false);
                return;
            }

            // 2) Fallback: /products?limit=1
            const res2 = await api.get("/products?limit=1");
            const arr = res2.data?.data;
            const one = Array.isArray(arr) ? arr[0] : null;
            if (one?._id) {
                const normalized = normalizeProduct(one);
                setProductId(one._id);
                setForm(normalized);
                setImagesRaw((normalized.images || []).join("\n"));
                setLoading(false);
                return;
            }

            // 3) Si no existe, creamos uno
            const created = await api.post("/products", DEFAULT_PRODUCT);
            const createdP = created.data?.data;
            if (createdP?._id) {
                const normalized = normalizeProduct(createdP);
                setProductId(createdP._id);
                setForm(normalized);
                setImagesRaw((normalized.images || []).join("\n"));
            } else {
                setError("No se pudo crear el producto único.");
            }
        } catch (e) {
            console.error(e);
            setError(
                "No pude cargar el producto único. Verificá que exista /products/single o /products?limit=1 y POST /products."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSingle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function setField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    // ✅ Ahora el textarea NO se “autolimpia” visualmente.
    // Solo parseamos para guardar en form.images (preview/guardado).
    function onImagesTextChange(v) {
        setImagesRaw(v);

        const parsed = v
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean);

        setField("images", parsed);
    }

    async function onSave() {
        if (!productId) {
            setError("No hay productId. No puedo guardar.");
            return;
        }

        setSaving(true);
        setError("");

        // ✅ Parse final desde imagesRaw (lo que escribiste)
        const parsedImages = imagesRaw
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean);

        const payload = {
            name: form.name?.trim(),
            subtitle: form.subtitle?.trim(),
            description: form.description?.trim(),
            price: Number(form.price) || 0,
            compareAtPrice: Number(form.compareAtPrice) || 0,
            imageUrl: form.imageUrl?.trim(),
            images: parsedImages,
            bullet1: form.bullet1?.trim(),
            bullet2: form.bullet2?.trim(),
            bullet3: form.bullet3?.trim(),
            soldCount: Number(form.soldCount) || 0,
            rating: Number(form.rating) || 0,
            reviewCount: Number(form.reviewCount) || 0,
        };

        try {
            try {
                await api.put(`/products/${productId}`, payload);
            } catch (e) {
                await api.patch(`/products/${productId}`, payload);
            }

            await fetchSingle();
            alert("✅ Producto guardado.");
        } catch (e) {
            console.error(e);
            setError("No se pudo guardar. Revisá el endpoint PUT/PATCH /products/:id.");
        } finally {
            setSaving(false);
        }
    }

    const previewUrls = useMemo(() => {
        return [form.imageUrl, ...(form.images || [])].filter(Boolean).slice(0, 6);
    }, [form.imageUrl, form.images]);

    if (loading) {
        return (
            <main className="section">
                <div className="container">
                    <div className="card" style={{ padding: 16 }}>
                        <b>Admin • Producto</b>
                        <p className="muted" style={{ marginTop: 8 }}>
                            Cargando producto único…
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="section">
            <div className="container">
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontWeight: 1000, letterSpacing: "-0.02em" }}>Admin • Producto único</div>
                            <div className="muted" style={{ marginTop: 6 }}>
                                Este panel edita 1 solo producto (Home + Tienda + Detalle).
                            </div>
                        </div>

                        <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ minWidth: 160 }}>
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                    {error ? (
                        <div className="card" style={{ padding: 12, marginTop: 12, borderColor: "rgba(255,0,0,.18)" }}>
                            <b style={{ color: "crimson" }}>Error</b>
                            <div className="muted" style={{ marginTop: 6 }}>{error}</div>
                        </div>
                    ) : null}

                    <div
                        style={{
                            marginTop: 14,
                            display: "grid",
                            gridTemplateColumns: "1.05fr .95fr",
                            gap: 14,
                            alignItems: "start",
                        }}
                    >
                        {/* LEFT: FORM */}
                        <div className="card" style={{ padding: 14 }}>
                            <div style={{ fontWeight: 1000 }}>Datos básicos</div>

                            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Nombre</div>
                                    <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                                </label>

                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Subtítulo (Home + Detalle)</div>
                                    <input className="input" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
                                </label>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <label>
                                        <div className="muted" style={{ marginBottom: 6 }}>Precio (ARS)</div>
                                        <input className="input" type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} />
                                    </label>

                                    <label>
                                        <div className="muted" style={{ marginBottom: 6 }}>Precio tachado (compareAt)</div>
                                        <input className="input" type="number" value={form.compareAtPrice} onChange={(e) => setField("compareAtPrice", e.target.value)} />
                                    </label>
                                </div>

                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Descripción</div>
                                    <textarea className="input" rows={5} value={form.description} onChange={(e) => setField("description", e.target.value)} />
                                </label>

                                <div style={{ marginTop: 6, fontWeight: 1000 }}>Beneficios (3 bullets)</div>

                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Bullet 1</div>
                                    <input className="input" value={form.bullet1} onChange={(e) => setField("bullet1", e.target.value)} />
                                </label>
                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Bullet 2</div>
                                    <input className="input" value={form.bullet2} onChange={(e) => setField("bullet2", e.target.value)} />
                                </label>
                                <label>
                                    <div className="muted" style={{ marginBottom: 6 }}>Bullet 3</div>
                                    <input className="input" value={form.bullet3} onChange={(e) => setField("bullet3", e.target.value)} />
                                </label>

                                <div style={{ marginTop: 6, fontWeight: 1000 }}>Social proof</div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                    <label>
                                        <div className="muted" style={{ marginBottom: 6 }}>Compraron</div>
                                        <input className="input" type="number" value={form.soldCount} onChange={(e) => setField("soldCount", e.target.value)} />
                                    </label>
                                    <label>
                                        <div className="muted" style={{ marginBottom: 6 }}>Rating</div>
                                        <input className="input" type="number" step="0.1" value={form.rating} onChange={(e) => setField("rating", e.target.value)} />
                                    </label>
                                    <label>
                                        <div className="muted" style={{ marginBottom: 6 }}>Reseñas</div>
                                        <input className="input" type="number" value={form.reviewCount} onChange={(e) => setField("reviewCount", e.target.value)} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: IMAGES */}
                        <div className="card" style={{ padding: 14 }}>
                            <div style={{ fontWeight: 1000 }}>Imágenes</div>
                            <div className="muted" style={{ marginTop: 6 }}>
                                Pegá URLs directas (Cloudinary recomendado).
                            </div>

                            <label style={{ display: "block", marginTop: 10 }}>
                                <div className="muted" style={{ marginBottom: 6 }}>Imagen principal (imageUrl)</div>
                                <input className="input" value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} />
                            </label>

                            <label style={{ display: "block", marginTop: 10 }}>
                                <div className="muted" style={{ marginBottom: 6 }}>Imágenes extra (1 URL por línea)</div>
                                <textarea
                                    className="input"
                                    rows={8}
                                    value={imagesRaw}
                                    onChange={(e) => onImagesTextChange(e.target.value)}
                                    placeholder={"https://...\nhttps://...\nhttps://..."}
                                />
                            </label>

                            <div style={{ marginTop: 12, fontWeight: 1000 }}>Preview</div>

                            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {previewUrls.map((url) => (
                                    <div
                                        key={url}
                                        style={{
                                            borderRadius: 14,
                                            overflow: "hidden",
                                            border: "1px solid rgba(11,92,255,.16)",
                                            background: "rgba(234,241,255,.65)",
                                            aspectRatio: "1/1",
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt="preview"
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                            loading="lazy"
                                        />
                                    </div>
                                ))}

                                {!previewUrls.length ? (
                                    <div className="muted" style={{ gridColumn: "1 / -1", padding: 10 }}>
                                        No hay imágenes cargadas todavía.
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <style>{`
            @media (max-width: 980px){
              .container > .card > div[style*="grid-template-columns: 1.05fr .95fr"]{
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
                </div>
            </div>
        </main>
    );
}
