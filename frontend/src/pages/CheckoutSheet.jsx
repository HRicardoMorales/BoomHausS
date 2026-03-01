// src/pages/CheckoutSheet.jsx
import { useEffect, useRef } from "react";
import { CheckoutContent } from "./Checkout";

export function CheckoutSheet({ onClose }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  // Bloquea el scroll del body y anima la entrada
  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      sheetRef.current?.classList.add("co-sheet--open");
      backdropRef.current?.classList.add("co-backdrop--open");
    });
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Swipe hacia abajo para cerrar (mobile nativo)
  const touchStartY = useRef(null);
  const onTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) handleClose();
    touchStartY.current = null;
  };

  function handleClose() {
    sheetRef.current?.classList.remove("co-sheet--open");
    backdropRef.current?.classList.remove("co-backdrop--open");
    setTimeout(onClose, 340);
  }

  return (
    <>
      {/* Fondo oscuro */}
      <div
        ref={backdropRef}
        className="co-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className="co-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar compra"
      >
        {/* Handle de arrastre */}
        <div
          className="co-sheet__handle-wrap"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="co-sheet__handle" />
        </div>

        {/* Contenido del checkout */}
        <div className="co-sheet__scroll">
          <CheckoutContent embedded={true} onClose={handleClose} />
        </div>
      </div>

      <style>{`
        .co-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(11, 17, 32, 0);
          z-index: 9998;
          transition: background 0.34s ease;
        }
        .co-backdrop--open {
          background: rgba(11, 17, 32, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .co-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: #ffffff;
          border-radius: 22px 22px 0 0;
          box-shadow: 0 -16px 60px rgba(11, 17, 32, 0.22);
          max-height: 93dvh;
          max-height: 93vh; /* fallback */
          display: flex;
          flex-direction: column;
          transform: translateY(100%);
          transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .co-sheet--open {
          transform: translateY(0);
        }

        .co-sheet__handle-wrap {
          padding: 10px 0 6px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
          cursor: grab;
        }
        .co-sheet__handle {
          width: 36px;
          height: 4px;
          border-radius: 3px;
          background: rgba(11, 17, 32, 0.14);
        }

        .co-sheet__scroll {
          overflow-y: auto;
          flex: 1;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .co-sheet__scroll::-webkit-scrollbar { display: none; }

        /* Ajustes para que el CheckoutContent se vea bien dentro del sheet */
        .co-sheet .section {
          padding: 0 !important;
        }
        .co-sheet .container {
          padding: 0 16px !important;
          max-width: 100% !important;
        }
        @media (max-width: 860px) {
          .co-sheet .checkout-grid {
            grid-template-columns: 1fr !important;
          }
          .co-sheet .summary-card {
            position: relative !important;
            top: auto !important;
            order: -1;
          }
        }
      `}</style>
    </>
  );
}
