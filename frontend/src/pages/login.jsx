import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveAuth, normalizeAuthResponse } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      // ✅ soporta múltiples formatos
      const auth =
        normalizeAuthResponse(res.data) || normalizeAuthResponse(res.data?.data) || {
          token: "",
          user: null,
        };

      const okSaved = saveAuth(auth); // ✅ saveAuth acepta objeto {token,user}

      if (!okSaved) {
        setError(res.data?.message || "No se pudo iniciar sesión (no vino token).");
        return;
      }

      const from = location.state?.from?.pathname || "/my-orders";
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401 ? "Email o contraseña incorrectos." : null) ||
        "Error al iniciar sesión.";

      setError(msg);
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
            <span className="badge">Acceso</span>
            <div className="authHeaderBrand">
              <div className="authDot" aria-hidden="true" />
              <div>
                <div className="authBrandName">{storeName}</div>
                <div className="authBrandSub">Ingresá para ver pedidos y subir comprobantes.</div>
              </div>
            </div>
          </div>

          <h1 className="authTitle">Iniciar sesión</h1>
          <p className="muted authSubtitle">
            Entrás en 10 segundos. Tu cuenta te permite ver el estado del pedido y adjuntar el comprobante.
          </p>
        </section>

        {/* Layout pro (2 columnas) */}
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
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

              {/* 👇 AQUÍ AGREGUÉ EL LINK DE RECUPERAR CONTRASEÑA */}
              <Link to="/forgot-password" className="authForgot">
                ¿Olvidaste tu contraseña?
              </Link>

              <button className="authPrimaryBtn" type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar →"}
              </button>

              <div className="authMetaRow">
                <div className="muted">
                  ¿No tenés cuenta?{" "}
                  <Link to="/register" className="authLink">
                    Registrate
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
              <div className="authSideBadge">Compra segura</div>
              <div className="authSideTitle">Tu cuenta te da control total</div>
              <div className="muted authSideText">
                Seguís el estado del pedido y subís el comprobante en segundos.
              </div>
            </div>

            <div className="authBenefits">
              <div className="authBenefit">
                <div className="authBenefitIco">✅</div>
                <div>
                  <div className="authBenefitT">Mis pedidos</div>
                  <div className="muted authBenefitP">Ves el estado, total y datos del envío.</div>
                </div>
              </div>

              <div className="authBenefit">
                <div className="authBenefitIco">📎</div>
                <div>
                  <div className="authBenefitT">Subir comprobante</div>
                  <div className="muted authBenefitP">Adjuntás la captura y confirmamos.</div>
                </div>
              </div>

              <div className="authBenefit">
                <div className="authBenefitIco">💬</div>
                <div>
                  <div className="authBenefitT">Soporte rápido</div>
                  <div className="muted authBenefitP">Te ayudamos por WhatsApp si hace falta.</div>
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

        <style>{`
          /* ... ESTILOS NUEVOS PARA EL ENLACE DE RECUPERAR ... */
          .authForgot {
            text-align: right;
            font-size: 0.9rem;
            color: var(--primary);
            font-weight: 700;
            text-decoration: none;
            margin-top: -0.2rem;
            margin-bottom: 0.5rem;
            opacity: 0.9;
            transition: opacity 0.2s;
          }
          .authForgot:hover {
            opacity: 1;
            text-decoration: underline;
          }

          /* ... TUS ESTILOS EXISTENTES ... */
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
            font-weight: 900;
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