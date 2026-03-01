import { useEffect } from 'react';
import { CheckoutContent } from '../pages/checkout.jsx';

export default function CheckoutDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawerOverlay" role="dialog" aria-modal="true">
      <div className="drawerBackdrop" onClick={onClose} />

      <div className="drawerPanel">
        <div className="drawerTop">
          <div style={{ fontWeight: 1100, letterSpacing: '-0.02em' }}>Finalizar compra</div>
          <button className="drawerClose" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="drawerBody">
          <CheckoutContent embedded onClose={onClose} />
        </div>
      </div>

      <style>{`
        .drawerOverlay{
          position: fixed;
          inset: 0;
          z-index: 99999;
          display:flex;
          align-items: stretch;
          justify-content: flex-end;
        }
        .drawerBackdrop{
          position:absolute;
          inset:0;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(6px);
        }
        .drawerPanel{
          position: relative;
          width: min(560px, 100%);
          height: 100%;
          background: rgba(255,255,255,.98);
          border-left: 1px solid rgba(15,23,42,.12);
          box-shadow: -24px 0 70px rgba(0,0,0,.20);
          display:flex;
          flex-direction: column;
          animation: slideIn .18s ease-out;
        }
        .drawerTop{
          position: sticky;
          top: 0;
          z-index: 2;
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(15,23,42,.10);
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(10px);
        }
        .drawerClose{
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,.12);
          background: rgba(255,255,255,.8);
          cursor:pointer;
          font-weight: 1000;
        }
        .drawerClose:active{ transform: scale(.98); }
        .drawerBody{
          overflow: auto;
          padding: 6px 6px 24px;
        }
        @keyframes slideIn{
          from{ transform: translateX(12px); opacity: .8; }
          to{ transform: translateX(0); opacity: 1; }
        }

        /* Mobile: que se sienta como sheet */
        @media (max-width: 720px){
          .drawerPanel{
            width: 100%;
            border-left: none;
            border-top-left-radius: 18px;
            border-top-right-radius: 18px;
            height: 92vh;
            align-self: flex-end;
            animation: sheetUp .18s ease-out;
          }
          .drawerOverlay{ align-items: flex-end; }
          @keyframes sheetUp{
            from{ transform: translateY(14px); opacity: .8; }
            to{ transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
