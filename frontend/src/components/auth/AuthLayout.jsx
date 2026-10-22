import { Link } from "react-router-dom";
import "./Auth.css";

const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Encontratodo";

/**
 * Esqueleto común de las páginas de auth: encabezado con marca, columna del
 * formulario y panel lateral de beneficios. Sin `side` queda en una sola
 * columna angosta (recuperar / restablecer contraseña). Solo presentación:
 * cada página maneja su estado y su request.
 *
 * `notice` es el mensaje de éxito (role="status"); `error`, el de falla
 * (role="alert"). La región de estado está siempre montada para que los
 * lectores de pantalla anuncien el cambio.
 */
export default function AuthLayout({
  badge,
  brandSub,
  title,
  subtitle,
  error,
  notice = "",
  side,
  footer,
  back = { to: "/", label: "Volver al inicio" },
  children,
}) {
  return (
    <main className={`section authPage${side ? "" : " authPage--compact"}`}>
      <div className="container">
        <header className="card reveal authHeader">
          <div className="authHeaderTop">
            <span className="badge">{badge}</span>
            <div className="authHeaderBrand">
              <span className="authDot" aria-hidden="true" />
              <div>
                <p className="authBrandName">{STORE_NAME}</p>
                <p className="authBrandSub">{brandSub}</p>
              </div>
            </div>
          </div>
          <h1 className="authTitle">{title}</h1>
          <p className="muted authSubtitle">{subtitle}</p>
        </header>

        <div className="reveal authGrid">
          <section className="card authCard" aria-label={title}>
            {error ? (
              <div className="authAlert" role="alert">
                <span className="authAlertIcon" aria-hidden="true">!</span>
                <p className="authAlertText">{error}</p>
              </div>
            ) : null}
            <div className={notice ? "authNotice" : undefined} role="status">
              {notice ? (
                <>
                  <span className="authNoticeIcon" aria-hidden="true">✓</span>
                  <p className="authNoticeText">{notice}</p>
                </>
              ) : null}
            </div>
            {children}
            <div className="authMetaRow">
              {footer ? <p className="muted">{footer}</p> : null}
              <Link to={back.to} className="authBack">
                <span aria-hidden="true">← </span>
                {back.label}
              </Link>
            </div>
          </section>

          {side ? <AuthSide {...side} /> : null}
        </div>
      </div>
    </main>
  );
}

function AuthSide({ badge, title, text, benefits = [] }) {
  return (
    <aside className="card authSide" aria-labelledby="auth-side-title">
      <span className="authSideBadge">{badge}</span>
      <h2 id="auth-side-title" className="authSideTitle">
        {title}
      </h2>
      <p className="muted authSideText">{text}</p>

      <ul className="authBenefits">
        {benefits.map((b) => (
          <li key={b.title} className="authBenefit">
            <span className="authBenefitIco" aria-hidden="true">
              {b.icon}
            </span>
            <div>
              <h3 className="authBenefitT">{b.title}</h3>
              <p className="muted authBenefitP">{b.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <ul className="authChips" aria-label="Medios y servicios">
        {["Transferencia", "Comprobante", "Envíos", "Soporte"].map((c) => (
          <li key={c} className="badge">
            {c}
          </li>
        ))}
      </ul>
    </aside>
  );
}
