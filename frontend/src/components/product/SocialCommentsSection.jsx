import { useRef, useState } from "react";
import SafeImg from "../SafeImg";
import { ICON_WIDTHS } from "../landing/imageSizes";

/* =========================
   Social Comments — estilo Facebook con paginación
========================= */
export default function SocialCommentsSection({ mc = {} }) {
  const data = mc.facebookComments;
  const [page, setPage] = useState(0);
  const sectionRef = useRef(null);

  if (!data?.pages?.length) return null;
  const total = data.pages.length;

  function goTo(n) {
    setPage(n);
    if (sectionRef.current) {
      setTimeout(() => sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  const items = data.pages[page] || [];

  return (
    <section className="fbsc-wrap anim-el" ref={sectionRef}>
      <div className="fbsc-card">
        <h3 className="fbsc-title">{data.title || "Comentarios recientes"}</h3>

        <div className="fbsc-write">
          <svg className="fbsc-fb-icon" viewBox="0 0 24 24" fill="#1877f2" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          <div className="fbsc-input">Escribe un comentario...</div>
        </div>

        <div className="fbsc-list">
          {items.map((item, i) => {
            if (item.type === "thread") {
              return (
                <div key={i} className="fbsc-thread">
                  {item.comments.map((c, j) =>
                    c.reply ? (
                      <div key={j} className="fbsc-reply">
                        <div className="fbsc-comment">
                          <SafeImg className="fbsc-avatar fbsc-avatar--sm" src={c.avatar} alt="" name={c.name} widths={ICON_WIDTHS} sizes="36px" width={36} height={36} />
                          <div className="fbsc-bubble">
                            <div className="fbsc-name">{c.name}</div>
                            <div className="fbsc-text">{c.text}</div>
                            <div className="fbsc-meta">Me gusta · Responder · {c.meta} <span className="fbsc-likes">👍 {c.likes}</span></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={j} className="fbsc-comment">
                        <SafeImg className="fbsc-avatar" src={c.avatar} alt="" name={c.name} widths={ICON_WIDTHS} sizes="42px" width={42} height={42} />
                        <div className="fbsc-bubble">
                          <div className="fbsc-name">{c.name}</div>
                          <div className="fbsc-text">{c.text}</div>
                          <div className="fbsc-meta">Me gusta · Responder · {c.meta} <span className="fbsc-likes">👍 {c.likes}</span></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            }
            return (
              <div key={i} className="fbsc-comment">
                <SafeImg className="fbsc-avatar" src={item.avatar} alt="" name={item.name} widths={ICON_WIDTHS} sizes="42px" width={42} height={42} />
                <div className="fbsc-bubble">
                  <div className="fbsc-name">{item.name}</div>
                  <div className="fbsc-text">{item.text}</div>
                  <div className="fbsc-meta">Me gusta · Responder · {item.meta} <span className="fbsc-likes">👍 {item.likes}</span></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`fbsc-pagination${page > 0 ? " fbsc-pagination--dual" : ""}`}>
          {page > 0 && (
            <button type="button" className="fbsc-btn fbsc-btn--ghost" onClick={() => goTo(page - 1)}>Volver</button>
          )}
          {page < total - 1 && (
            <button type="button" className="fbsc-btn" onClick={() => goTo(page + 1)}>Ver más comentarios</button>
          )}
          {page === total - 1 && total > 1 && (
            <button type="button" className="fbsc-btn fbsc-btn--ghost" onClick={() => goTo(0)}>Ver desde el principio</button>
          )}
        </div>
      </div>
    </section>
  );
}
