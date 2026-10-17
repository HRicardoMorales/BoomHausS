import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { CheckoutContent } from '../pages/checkout.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { EASE_OUT } from './motion/motionPresets.js';
import './CheckoutDrawer.css';

/*
 * Contenedor del checkout embebido (solo presentación: la lógica de compra
 * vive entera en `CheckoutContent`).
 * Desktop: panel lateral desde la derecha. Mobile: hoja que sube desde abajo.
 * Entra con un resorte y, a diferencia de antes, también tiene salida
 * (`AnimatePresence`): el contenido no desaparece de golpe al cerrar.
 */
const MotionDiv = m.div;

const SPRING = { type: 'spring', stiffness: 360, damping: 36, mass: 0.9 };
const EXIT = { duration: 0.22, ease: EASE_OUT };

const PANEL = {
  side: {
    initial: { x: '100%' },
    animate: { x: 0, transition: SPRING },
    exit: { x: '100%', transition: EXIT },
  },
  sheet: {
    initial: { y: '100%' },
    animate: { y: 0, transition: SPRING },
    exit: { y: '100%', transition: EXIT },
  },
};

const BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function CheckoutDrawer({ open, onClose }) {
  const isSheet = useMediaQuery('(max-width: 720px)');
  const titleId = useId();
  const closeRef = useRef(null);

  // Escape, bloqueo de scroll y foco: al abrir va al botón de cerrar y al
  // cerrar vuelve a lo que lo abrió (el CTA), así el teclado no se pierde.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          key="checkout-drawer"
          className={`cd-drawer ${isSheet ? 'cd-drawer--sheet' : 'cd-drawer--side'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <MotionDiv className="cd-backdrop" onClick={onClose} {...BACKDROP} />

          <MotionDiv className="cd-panel" {...PANEL[isSheet ? 'sheet' : 'side']}>
            {isSheet && <span className="cd-grabber" aria-hidden="true" />}
            <header className="cd-top">
              <h2 className="cd-title" id={titleId}>Finalizar compra</h2>
              <button
                ref={closeRef}
                className="cd-close"
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div className="cd-body">
              <CheckoutContent embedded onClose={onClose} />
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
}
