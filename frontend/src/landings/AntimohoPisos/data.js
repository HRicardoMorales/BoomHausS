// Textos, precios placeholder y listas de la landing Anti-Moho PRO.
// Sin JSX: los íconos se referencian como componentes desde ./icons.
// ⚠️ Buscá "PLACEHOLDER" / "EDITAR" antes de publicar (ver AntimohoPisos.jsx).
import { LANDING_PRODUCT_SLUGS } from '../../routes/landingProducts.js';
import {
  IconShield, IconDropletOff, IconStanding, IconHome, IconTruck,
  IconLock, IconPackage, IconRefresh, IconSparkle,
} from './icons';

/* ── Constantes de producto ──────────────────────────────────────────── */
export const PRODUCT_SLUG   = LANDING_PRODUCT_SLUGS.antimohoPisos;
export const CHECKOUT_NAME  = 'Anti-Moho PRO — Kit para Pisos y Juntas'; // EDITAR
export const BRAND_NAME     = 'RENOVA'; // Marca usada SOLO en esta landing (no BoomHausS)
export const CONTACT_EMAIL  = 'contacto@renova.com'; // PLACEHOLDER — reemplazar
export const GUARANTEE_DAYS = 30; // PLACEHOLDER — política real de devolución

// 🖼 PLACEHOLDER — se usa solo si el producto en la base no tiene imágenes
// cargadas todavía. En cuanto subas fotos reales en /admin/products, la
// landing las va a mostrar automáticamente (ver galería más abajo).
export const FALLBACK_GALLERY = [
  { label: 'Foto 1 — Botella del producto sola' },
  { label: 'Foto 2 — Aplicando en las juntas' },
  { label: 'Foto 3 — Antes / Después' },
  { label: 'Foto 4 — Kit completo con cepillo' },
  { label: 'Foto 5 — Detalle de textura del piso' },
];

// 💰 PLACEHOLDER — precios en ARS, editables. compareAt = precio tachado.
export const BUNDLES = [
  {
    id: 0,
    qty: 1,
    label: '1 Botella + Cepillo',
    badge: '',
    pctLabel: '10% OFF',
    price: 13990,
    compareAt: 15990,
  },
  {
    id: 1,
    qty: 2,
    label: '2 Botellas + Cepillo',
    badge: 'MÁS ELEGIDO',
    pctLabel: '15% OFF',
    price: 24990,
    compareAt: 31980,
  },
  {
    id: 2,
    qty: 3,
    label: '3 Botellas + Cepillo doble',
    badge: 'MAYOR AHORRO',
    pctLabel: '20% OFF',
    price: 34990,
    compareAt: 47970,
  },
];
export const DEFAULT_BUNDLE_IDX = 1; // "Más elegido" preseleccionado, como el modelo

/* ── Datos de contenido (copy adaptado en español, tono BoomHausS) ─────── */
export const TRUST_BADGES = [
  { icon: IconShield, text: `Garantía de ${GUARANTEE_DAYS} días` },
  { icon: IconDropletOff, text: 'Sin ácido clorhídrico ni cloro' },
  { icon: IconStanding, text: 'Limpiá de pie, sin arrodillarte' },
  { icon: IconHome, text: 'Pensado para el hogar argentino' },
];

export const STATS = [
  { val: '+1.000', lbl: 'Familias que ya lo usaron' }, // PLACEHOLDER — actualizar con dato real
  { val: '4.8★', lbl: 'Puntaje promedio' },             // PLACEHOLDER
  { val: `${GUARANTEE_DAYS} días`, lbl: 'Garantía de devolución' },
  { val: 'AR', lbl: 'Envíos a todo el país' },
];

export const TRUSTROW = [
  { icon: IconTruck, text: 'Envío a todo el país' },
  { icon: IconLock, text: 'Pago 100% seguro' },
  { icon: IconPackage, text: 'Seguimiento de envío' },
  { icon: IconShield, text: 'Devolución fácil' },
];

export const FEATURES = [
  { icon: IconRefresh, title: 'Fórmula doble acción', desc: 'Afloja la suciedad incrustada en la junta y después ataca las manchas profundas, no solo la superficie.' },
  { icon: IconDropletOff, title: 'Sin cloro ni ácidos fuertes', desc: 'Limpia como un ácido pero sin los vapores irritantes del clorhídrico ni el olor a lavandina.' },
  { icon: IconStanding, title: 'Limpiá de pie', desc: 'El cepillo incluido se engancha a un palo de escoba estándar. Nada de horas de rodillas.' },
  { icon: IconSparkle, title: 'No decolora', desc: 'Restaura el color original de la junta en lugar de blanquearla de forma pareja e irreal.' },
];

export const STEPS = [
  { num: '1', tag: 'Paso 1', title: 'Aplicá', desc: 'Rociá o volcá el producto directamente sobre las juntas o la zona con moho.' },
  { num: '2', tag: 'Paso 2', title: 'Cepillá de pie', desc: 'Trabajalo con el cepillo incluido, parado, dejando que la fórmula haga el trabajo pesado.' },
  { num: '3', tag: 'Paso 3', title: 'Enjuagá y mirá el resultado', desc: 'Pasá un trapo húmedo y listo: la junta vuelve a su color original.' },
];

export const MINI_FEATURES = [
  { title: 'Elimina', desc: 'Saca años de suciedad y moho incrustado, no solo lo que se ve en la superficie.' },
  { title: 'Restaura', desc: 'Devuelve el color original de la junta, sin necesidad de rejuntar.' },
  { title: 'Facilita', desc: 'Limpiá de pie con el cepillo incluido — sin arrodillarte ni pasar horas frotando.' },
  { title: 'Mantiene', desc: 'Con una limpieza rápida y periódica, conservás el resultado por más tiempo.' },
];

// PLACEHOLDER — reemplazar por reseñas reales y verificadas antes de publicar
export const REVIEWS_DATA = [
  { title: 'No lo podía creer', stars: 5, text: 'Probé un montón de productos para las juntas de la cocina y ninguno funcionó así. Con el cepillo fue mucho más fácil, no tuve que arrodillarme.', name: 'Cliente verificado' },
  { title: 'El mejor que probé', stars: 5, text: 'Las juntas del baño estaban negras. Apliqué, dejé actuar, cepillé y quedaron como nuevas. Muy recomendable.', name: 'Cliente verificado' },
  { title: 'Funciona de verdad', stars: 5, text: 'Tenía dudas porque ya había gastado plata en otros productos que no hacían nada. Este sí notó la diferencia en la primera pasada.', name: 'Cliente verificado' },
];

export const FAQS = [
  { q: '¿Sirve para pisos de cerámica y porcelanato?', a: 'Sí, está pensado para juntas y pisos de cerámica y porcelanato en cocinas, baños y entradas. Te recomendamos probar primero en una zona chica y poco visible.' },
  { q: '¿Tiene cloro o ácido clorhídrico?', a: 'No. La fórmula no lleva lavandina ni ácido clorhídrico, así que no genera los vapores irritantes típicos de esos productos.' },
  { q: '¿Tengo que fregar de rodillas?', a: 'No. El kit incluye un cepillo que se engancha a un palo de escoba estándar (no incluido) para que puedas limpiar parado.' },
  { q: '¿Sirve en mármol o piedra natural?', a: 'No está recomendado para piedra natural. Es apto para cerámica y porcelanato. Ante la duda, probá primero en un sector oculto.' },
  { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Hacemos envíos a todo el país. El tiempo estimado depende de tu localidad — lo vas a ver confirmado al finalizar la compra.' }, // EDITAR con tiempos reales
  { q: '¿Qué pasa si no quedo conforme?', a: `Contás con ${GUARANTEE_DAYS} días desde la compra para contactarnos si no estás conforme con el resultado.` },
];
