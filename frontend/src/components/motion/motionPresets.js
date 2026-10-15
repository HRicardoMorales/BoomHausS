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

/* Se revela una sola vez, cuando su borde superior pasa el 10 % inferior del
   viewport. Umbral por posición ("some" + margen) y no por proporción visible:
   con `amount: 0.15` una sección más alta que ~6,5 pantallas (los comentarios
   de la ficha miden ~5.800 px en mobile) nunca llegaba al 15 % y quedaba
   invisible para siempre. */
export const REVEAL_VIEWPORT = { once: true, amount: "some", margin: "0px 0px -10% 0px" };

/* Resorte de elementos que "persiguen" a otro (píldora de pestañas): rápido,
   con un sobrepaso mínimo para que se sienta físico sin rebotar. */
export const PILL_SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.9 };

/* Feedback táctil de botones circulares (flechas). */
export const TAP_PRESS = { scale: 0.88 };
