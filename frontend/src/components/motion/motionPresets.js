// Presets de animación compartidos (fuera de los componentes para que Fast
// Refresh siga funcionando en los archivos .jsx).

/* Curva "expo out": arranca rápido y se asienta suave, sin rebote. */
export const EASE_OUT = [0.22, 1, 0.36, 1];

const STAGGER_S = 0.07;

/* `custom` = posición en el grupo; el delay se topa para que el elemento 12
   de una lista no espere casi un segundo. */
export const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  shown: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay: Math.min(i, 6) * STAGGER_S },
  }),
};

/* Se revela una sola vez, apenas asoma (margen inferior negativo para que no
   se dispare con 1 px visible). */
export const REVEAL_VIEWPORT = { once: true, amount: 0.15, margin: "0px 0px -40px 0px" };
