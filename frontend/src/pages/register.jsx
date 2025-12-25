// frontend/src/pages/Register.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth, normalizeAuthResponse } from "../utils/auth";

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();

    const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const passMismatch = confirm.length > 0 && password !== confirm;

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/auth/register", {
                name,
                email,
                password,
            });

            // ✅ soporta múltiples formatos
            const auth =
                normalizeAuthResponse(res.data) || normalizeAuthResponse(res.data?.data) || {
                    token: "",
                    user: null,
                };

            const okSaved = saveAuth(auth);

            // Si tu backend NO loguea automáticamente al registrar, okSaved puede ser false.
            // En ese caso mandamos a login directamente.
            if (!okSaved) {
                navigate("/login", { replace: true, state: { from: location.state?.from } });
                return;
            }

            const from = location.state?.from?.pathname || "/my-orders";
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);

            if (err?.response?.status === 409) {
                setError("Ese email ya está registrado. Probá iniciar sesión.");
            } else {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Error al registrarte."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="section">
            <div className="container">
                {/* Header compacto */}
                <section className="card reveal authHeader">
                    <div className="authHeaderTop">
                        <span className="badge">Cuenta</span>

                        <div className="authHeaderBrand">
                            <div className="authDot" aria-hidden="true" />
                            <div>
                                <div className="authBrandName">{storeName}</div>
                                <div className="authBrandSub">Creá tu cuenta para ver pedidos y subir comprobantes.</div>
                            </div>
                        </div>
                    </div>

                    <h1 className="authTitle">Crear cuenta</h1>
                    <p className="muted authSubtitle">
                        Te toma 30 segundos. Después podés comprar y seguir el estado de tu pedido.
                    </p>
                </section>

                {/* Layout pro */}
                <section className="reveal authGrid">
                    {/* FORM */}
                    <div className="card authCard">
                        {error ? (
                            <div className="authAlert" role="alert">
                                <div className="authAlertIcon">!</div>
                                <div className="authAlertText">{error}</div>
                            </div>
                        ) : null}

                        <form onSubmit={handleSubmit} className="authForm">
                            <label className="authLabel">
                                Nombre
                                <div className="authField">
                                    <span className="authFieldIcon" aria-hidden="true">👤</span>
                                    <input
                                        className="authInput"
                                        type="text"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre"
                                        required
                                    />
                                </div>
                            </label>

                            <label className="authLabel">
                                Email
                                <div className="authField">
                                    <span className="authFieldIcon" aria-hidden="true">✉</span>
                                    <input
                                        className="authInput"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tuemail@gmail.com"
                                        required
                                    />
                                </div>
                            </label>

                            <label className="authLabel">
                                Contraseña
                                <div className="authField">
                                    <span className="authFieldIcon" aria-hidden="true">🔒</span>
                                    <input
                                        className="authInput"
                                        type={showPass ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="authPassBtn"
                                        onClick={() => setShowPass((s) => !s)}
                                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPass ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>
                            </label>

                            <label className="authLabel">
                                Repetir contraseña
                                <div className="authField">
                                    <span className="authFieldIcon" aria-hidden="true">🔁</span>
                                    <input
                                        className="authInput"
                                        type={showConfirm ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Repetí la contraseña"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="authPassBtn"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showConfirm ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>

                                {passMismatch ? (
                                    <div style={{ marginTop: ".35rem", fontWeight: 900, color: "rgba(255,80,80,.95)" }}>
                                        Las contraseñas no coinciden.
                                    </div>
                                ) : null}
                            </label>

                            <button className="authPrimaryBtn" type="submit" disabled={loading}>
                                {loading ? "Creando cuenta..." : "Crear cuenta →"}
                            </button>

                            <div className="authMetaRow">
                                <div className="muted">
                                    ¿Ya tenés cuenta?{" "}
                                    <Link to="/login" className="authLink">
                                        Iniciar sesión
                                    </Link>
                                </div>

                                <Link to="/" className="authBack">
                                    ← Volver al inicio
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* INFO / BENEFICIOS */}
                    <aside className="card authSide">
                        <div className="authSideTop">
                            <div className="authSideBadge">Rápido y seguro</div>
                            <div className="authSideTitle">¿Por qué crear cuenta?</div>
                            <div className="muted authSideText">
                                Porque te da seguimiento del pedido y te evita problemas con el comprobante.
                            </div>
                        </div>

                        <div className="authBenefits">
                            <div className="authBenefit">
                                <div className="authBenefitIco">📦</div>
                                <div>
                                    <div className="authBenefitT">Historial de pedidos</div>
                                    <div className="muted authBenefitP">Vas a “Mis pedidos” y ves todo ordenado.</div>
                                </div>
                            </div>

                            <div className="authBenefit">
                                <div className="authBenefitIco">📎</div>
                                <div>
                                    <div className="authBenefitT">Subir comprobante</div>
                                    <div className="muted authBenefitP">Adjuntás la captura/PDF sin vueltas.</div>
                                </div>
                            </div>

                            <div className="authBenefit">
                                <div className="authBenefitIco">🛡️</div>
                                <div>
                                    <div className="authBenefitT">Compra protegida</div>
                                    <div className="muted authBenefitP">Tu pedido queda registrado y confirmado.</div>
                                </div>
                            </div>
                        </div>

                        <div className="authChips">
                            <span className="badge">Transferencia</span>
                            <span className="badge">Comprobante</span>
                            <span className="badge">Envíos</span>
                            <span className="badge">Soporte</span>
                        </div>
                    </aside>
                </section>

                {/* mismo CSS del Login para que se vea igual */}
                <style>{`
          .authHeader{
            padding: 1.2rem;
            position: relative;
            overflow: hidden;
          }
          .authHeader::before{
            content:"";
            position:absolute;
            inset:-2px;
            background: radial-gradient(900px 360px at 8% 0%, rgba(0,90,255,.20), transparent 60%),
                        radial-gradient(700px 280px at 92% 20%, rgba(0,170,255,.18), transparent 55%);
            pointer-events:none;
          }
          .authHeader > *{ position: relative; }

          .authHeaderTop{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:.75rem;
            flex-wrap:wrap;
          }
          .authHeaderBrand{
            display:flex;
            align-items:center;
            gap:.65rem;
          }
          .authDot{
            width:12px; height:12px;
            border-radius:999px;
            background: var(--primary);
            box-shadow: 0 0 0 6px rgba(0,90,255,.12);
          }
          .authBrandName{ font-weight: 950; letter-spacing:-.02em; }
          .authBrandSub{ font-size:.9rem; opacity:.8; }

          .authTitle{
            margin:.75rem 0 .25rem;
            letter-spacing:-.05em;
            font-size: clamp(1.9rem, 3.5vw, 2.6rem);
          }
          .authSubtitle{ margin-top:.35rem; max-width: 70ch; line-height:1.6; }

          .authGrid{
            margin-top: 1rem;
            display:grid;
            grid-template-columns: 1fr .9fr;
            gap: 1rem;
            align-items: start;
          }
          @media (max-width: 980px){
            .authGrid{ grid-template-columns: 1fr; }
          }

          .authCard{ padding: 1.1rem; }
          .authForm{ display:grid; gap:.9rem; margin-top: .2rem; }

          .authLabel{
            display:grid;
            gap:.45rem;
            font-weight: 800;
            letter-spacing:-.01em;
          }
          .authField{
            display:flex;
            align-items:center;
            gap:.55rem;
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: .55rem .65rem;
            background: rgba(255,255,255,.03);
          }
          .authField:focus-within{
            border-color: rgba(0,90,255,.55);
            box-shadow: 0 0 0 4px rgba(0,90,255,.15);
          }
          .authFieldIcon{ opacity:.9; }

          .authInput{
            width:100%;
            border: 0;
            outline: 0;
            background: transparent;
            color: inherit;
            padding: .25rem 0;
            font-size: 1rem;
          }
          .authPassBtn{
            border: 0;
            background: rgba(0,90,255,.10);
            color: inherit;
            padding: .35rem .55rem;
            border-radius: 12px;
            cursor:pointer;
            font-weight: 950;
            letter-spacing:-.01em;
          }
          .authPassBtn:hover{ background: rgba(0,90,255,.18); }

          .authPrimaryBtn{
            border: 0;
            cursor: pointer;
            border-radius: 14px;
            padding: .9rem 1rem;
            font-weight: 950;
            letter-spacing: -.02em;
            background: var(--primary);
            color: white;
            box-shadow: 0 16px 36px rgba(0,0,0,.18);
          }
          .authPrimaryBtn:disabled{ opacity:.7; cursor:not-allowed; }

          .authMetaRow{
            margin-top: .25rem;
            display:flex;
            justify-content: space-between;
            gap: .75rem;
            flex-wrap: wrap;
            align-items: center;
          }
          .authLink{
            font-weight: 950;
            text-decoration: none;
          }
          .authBack{
            text-decoration:none;
            font-weight: 900;
            opacity:.9;
          }

          .authAlert{
            display:flex;
            gap:.65rem;
            align-items:flex-start;
            border: 1px solid rgba(255,80,80,.45);
            background: rgba(255,80,80,.08);
            border-radius: 14px;
            padding: .75rem .85rem;
            margin-bottom: .85rem;
          }
          .authAlertIcon{
            width: 26px; height: 26px;
            border-radius: 999px;
            display:grid; place-items:center;
            font-weight: 950;
            background: rgba(255,80,80,.20);
          }
          .authAlertText{ font-weight: 800; line-height: 1.4; }

          .authSide{
            padding: 1.1rem;
            position: sticky;
            top: 90px;
            overflow:hidden;
          }
          .authSide::before{
            content:"";
            position:absolute;
            inset:-2px;
            background: radial-gradient(700px 300px at 15% 0%, rgba(0,90,255,.16), transparent 60%),
                        radial-gradient(650px 280px at 95% 10%, rgba(0,200,255,.14), transparent 55%);
            pointer-events:none;
          }
          .authSide > *{ position: relative; }

          @media (max-width: 980px){
            .authSide{ position: relative; top:auto; }
          }

          .authSideBadge{
            display:inline-flex;
            align-items:center;
            gap:.4rem;
            padding: .35rem .6rem;
            border-radius: 999px;
            border: 1px solid rgba(0,90,255,.35);
            background: rgba(0,90,255,.10);
            font-weight: 950;
            width: fit-content;
          }
          .authSideTitle{
            margin-top:.7rem;
            font-weight: 950;
            letter-spacing:-.03em;
            font-size: 1.2rem;
          }
          .authSideText{ margin-top:.35rem; line-height: 1.6; }

          .authBenefits{
            margin-top: .9rem;
            display:grid;
            gap: .75rem;
          }
          .authBenefit{
            display:flex;
            gap:.7rem;
            align-items:flex-start;
            padding: .75rem;
            border-radius: 16px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,.03);
          }
          .authBenefitIco{
            width: 34px; height: 34px;
            border-radius: 12px;
            display:grid; place-items:center;
            background: rgba(0,90,255,.12);
          }
          .authBenefitT{ font-weight: 950; letter-spacing:-.02em; }
          .authBenefitP{ margin-top:.2rem; line-height:1.55; }

          .authChips{
            margin-top: 1rem;
            display:flex;
            gap:.5rem;
            flex-wrap:wrap;
          }
        `}</style>
            </div>
        </main>
    );
}
