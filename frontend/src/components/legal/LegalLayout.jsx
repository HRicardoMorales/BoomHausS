import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { formatUpdated, otherLegalPages, sectionNumber, whatsappLink } from "./legal.js";
import "./LegalLayout.css";

const DESKTOP = "(min-width: 960px)";
const CONTACT_ID = "contacto";

/** Resalta en el índice la sección que se está leyendo. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const els = key.split("|").map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      // Franja del 20 % al 35 % del viewport: la sección "activa" es la que cruza ahí.
      { rootMargin: "-20% 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);

  return [active, setActive];
}

/**
 * Plantilla de las páginas legales. Antes eran tres copias de ~140 líneas con
 * ~30 `style={{}}` cada una (tarjeta dentro de tarjeta, "badge" como título).
 * Ahora: documento editorial a 68ch, secciones numeradas con `<h2>` reales,
 * índice con anclas (sticky en desktop, `<details>` plegable en mobile) que
 * marca la sección en lectura, y contacto + "otras políticas" al pie.
 *
 * @param {{
 *   path: string, title: string, intro: React.ReactNode, updated: string,
 *   sections: { id: string, title: string, content: React.ReactNode }[],
 *   contact: { text: string, message: string, extra?: React.ReactNode },
 *   note: { label: string, text: string },
 * }} props
 */
export default function LegalLayout({ path, title, intro, updated, sections, contact, note }) {
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(DESKTOP);
  const [tocOpen, setTocOpen] = useState(false);
  const titleId = useId();

  const ids = [...sections.map((s) => s.id), CONTACT_ID];
  const [active, setActive] = useActiveSection(ids);
  const date = formatUpdated(updated);

  const wa = whatsappLink(import.meta.env.VITE_WHATSAPP_NUMBER, contact.message);
  const email = import.meta.env.VITE_SUPPORT_EMAIL || "";
  const others = otherLegalPages(path || pathname);

  const tocItems = [...sections, { id: CONTACT_ID, title: "Contacto" }];

  const onTocClick = (id) => {
    setActive(id);
    if (!isDesktop) setTocOpen(false);
  };

  return (
    <main className="legal" aria-labelledby={titleId}>
      <header className="legal__head">
        <nav className="legal__crumbs" aria-label="Ruta de navegación">
          <ol>
            <li><Link to="/">Inicio</Link></li>
            <li aria-current="page">Legal</li>
          </ol>
        </nav>
        <h1 id={titleId} className="legal__title">{title}</h1>
        <p className="legal__intro">{intro}</p>
        {date && (
          <p className="legal__updated">
            Última actualización: <time dateTime={date.iso}>{date.label}</time>
          </p>
        )}
      </header>

      <div className="legal__grid">
        <nav className="legal__toc" aria-label="En esta página">
          <details
            open={isDesktop || tocOpen}
            onToggle={(e) => { if (!isDesktop) setTocOpen(e.currentTarget.open); }}
          >
            <summary className="legal__toc-summary">
              <span>En esta página</span>
              <span className="legal__toc-count">{tocItems.length} secciones</span>
            </summary>
            <ol className="legal__toc-list">
              {tocItems.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="legal__toc-link"
                    aria-current={active === item.id ? "location" : undefined}
                    onClick={() => onTocClick(item.id)}
                  >
                    <span className="legal__toc-num" aria-hidden="true">{sectionNumber(i)}</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </nav>

        <article className="legal__doc">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="legal__section" aria-labelledby={`${s.id}-h`}>
              <span className="legal__num" aria-hidden="true">{sectionNumber(i)}</span>
              <h2 id={`${s.id}-h`} className="legal__h2">{s.title}</h2>
              <div className="legal__body">{s.content}</div>
            </section>
          ))}

          <section id={CONTACT_ID} className="legal__section legal__contact" aria-labelledby={`${CONTACT_ID}-h`}>
            <span className="legal__num" aria-hidden="true">{sectionNumber(sections.length)}</span>
            <h2 id={`${CONTACT_ID}-h`} className="legal__h2">Contacto</h2>
            <div className="legal__body">
              <p>{contact.text}</p>
              <div className="legal__actions">
                {wa ? (
                  <a className="btn btn-primary" href={wa} target="_blank" rel="noreferrer">
                    WhatsApp →
                  </a>
                ) : (
                  import.meta.env.DEV && <p className="legal__dev">Configurá VITE_WHATSAPP_NUMBER para habilitar WhatsApp</p>
                )}
                {email ? (
                  <a className="btn btn-ghost" href={`mailto:${email}`}>{email}</a>
                ) : (
                  import.meta.env.DEV && <p className="legal__dev">(Opcional) Configurá VITE_SUPPORT_EMAIL</p>
                )}
                {contact.extra}
              </div>
            </div>
          </section>

          <aside className="legal__note" aria-label={note.label}>
            <p className="legal__note-label">{note.label}</p>
            <p>{note.text}</p>
          </aside>

          <nav className="legal__others" aria-label="Otras políticas">
            <p className="legal__note-label">Otras políticas</p>
            <ul>
              {others.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="legal__other">
                    <span>{p.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </div>
    </main>
  );
}
