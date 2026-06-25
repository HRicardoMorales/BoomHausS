import { useState, useEffect } from 'react';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5491123915075";
const WA_MSG = encodeURIComponent("Hola! Tengo una consulta sobre mi pedido");

export default function WhatsAppButton() {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768;
      const stickyActive = document.body.classList.contains('pdx-sticky-active');
      setLifted(isMobile && stickyActive);
    };

    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const bottomValue = lifted ? 'calc(72px + 16px)' : undefined;

  return (
    <>
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float-btn"
        style={bottomValue ? { bottom: bottomValue } : undefined}
        aria-label="Contactar por WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.093a.75.75 0 0 0 .916.937l5.422-1.427A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.953-1.356l-.355-.211-3.68.968.984-3.595-.232-.371A9.722 9.722 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
      </a>
      <style>{`
        .wa-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 8000;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #25D366;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,.22);
          text-decoration: none;
          transition: transform .15s, box-shadow .15s, bottom .3s ease;
        }
        .wa-float-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(0,0,0,.32);
        }
        @media (max-width: 767px) {
          .wa-float-btn { bottom: 16px; right: 16px; width: 50px; height: 50px; }
        }
      `}</style>
    </>
  );
}
