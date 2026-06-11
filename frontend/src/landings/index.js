// src/landings/index.js
import portaCepillos         from './porta-cepillos';
import consolaRetro          from './consola-retro';
import mochilaTransparente   from './mochila-transparente';
import mochilaFashion        from './mochila-fashion';
import nebulizadorMesh       from './nebulizador-mesh';
import soporteNasalSN300     from './soporte-nasal-sn300';
import lamparaMagnetica      from './lampara-magnetica';
import parchesDetox          from './parches-detox';
import sillonPuffInflable    from './sillon-puff-inflable';
import kitBelleza6en1        from './kit-belleza-6en1';
import masajeadorEmsEyes     from './masajeador-ems-eyes';
import masajeadorFacialIones from './masajeador-facial-iones-lambo';
import escultorLed           from './escultor-led';
import depiladoraIpl         from './depiladora-ipl';

export const LANDING_CONFIGS = {
  'porta-cepillos':           portaCepillos,
  'consola-retro':            consolaRetro,
  'mochila-transparente':     mochilaTransparente,
  'mochila-fashion':          mochilaFashion,
  'nebulizador-mesh':         nebulizadorMesh,
  'nebulizador':              nebulizadorMesh,
  'soporte-nasal-sn300':      soporteNasalSN300,
  'lampara-magnetica':        lamparaMagnetica,
  // Renderizado por ParchesDetoxLanding.jsx (componente dedicado, ruta /lp/parches-detox)
  'parches-detox':            parchesDetox,
  // Renderizado por SillonPuffLanding.jsx (componente dedicado, ruta /lp/sillon-puff-inflable)
  'sillon-puff-inflable':     sillonPuffInflable,
  // Renderizado por KitBelleza6en1Landing.jsx (componente dedicado, ruta /lp/kit-belleza-6en1)
  'kit-belleza-6en1':         kitBelleza6en1,
  // Renderizado por MasajeadorEmsEyesLanding.jsx (componente dedicado, ruta /lp/masajeador-ems-eyes)
  'masajeador-ems-eyes':      masajeadorEmsEyes,
  // Renderizado por MasajeadorFacialIonesLanding.jsx (componente dedicado, ruta /lp/masajeador-facial-iones-lambo)
  'masajeador-facial-iones-lambo': masajeadorFacialIones,
  // Renderizado por LuxCoveLED.jsx (componente dedicado, ruta /lp/escultor-led)
  'escultor-led':                  escultorLed,
  // Renderizado por DepiladoraIPL.jsx (componente dedicado, ruta /lp/depiladora-ipl)
  'depiladora-ipl':                depiladoraIpl,
};

export const LANDING_META = [
  {
    slug: 'porta-cepillos',
    name: 'Porta Cepillo Esterilizador',
    desc: 'Conectada al producto con slug "porta-cepillos" en el admin.',
    status: 'active',
    emoji: '🦷',
  },
  {
    slug: 'consola-retro',
    name: 'Consola Retro M15 Pro',
    desc: 'Game Stick 64GB, 2 controles inalámbricos, +10.000 juegos. Slug: "consola-retro".',
    status: 'active',
    emoji: '🎮',
  },
  {
    slug: 'mochila-transparente',
    name: 'Mochila Transparente PT-4133',
    desc: 'Mochila con cupula panoramica 360 para mascotas. Producto slug: "mochila-transparente-pt4133".',
    status: 'active',
    emoji: '🐱',
  },
  {
    slug: 'mochila-fashion',
    name: 'Mochila Fashion para Mascotas',
    desc: 'Mochila estilo fashion para mascotas de hasta 6kg. Producto slug: "mochila-fashion".',
    status: 'active',
    emoji: '🎀',
  },
  {
    slug: 'nebulizador-mesh',
    name: 'Nebulizador Recargable Mesh',
    desc: 'Nebulizador portatil silencioso con tecnologia Mesh, recargable USB-C. Producto slug: "nebulizador-mesh".',
    status: 'active',
    emoji: '💨',
  },
  {
    slug: 'mundial-revendedores',
    name: 'Mundial Argentina — Revendedores (B2B)',
    desc: 'Landing B2B mayorista con calculadora de ganancia. Página propia: MundialLanding.jsx (no usa la plantilla genérica).',
    status: 'active',
    emoji: '🇦🇷',
  },
  {
    slug: 'soporte-nasal-sn300',
    name: 'Soporte Nasal SN-300',
    desc: 'Kit dual: tiras adhesivas externas + dilatadores internos de silicona. Reduce ronquidos y mejora el sueño. Slug: "soporte-nasal-sn300".',
    status: 'active',
    emoji: '👃',
  },
  {
    slug: 'lampara-magnetica',
    name: 'Lámpara Magnética 3 en 1',
    desc: 'Lámpara inalámbrica con acople magnético, rotación 360°, CCT y batería USB-C. 2 variantes: Negro Kit Completo y Madera Básica.',
    status: 'active',
    emoji: '💡',
  },
  {
    slug: 'parches-detox',
    name: 'Desintoxica Tu Cuerpo Mientras Duermes',
    desc: 'Parches herbales 2x1 + Ebook. Ritual nocturno: se colocan en la planta del pie antes de dormir. Slug admin: "parches-detox". Renderiza ParchesDetoxLanding.jsx.',
    status: 'active',
    emoji: '🌿',
  },
  {
    slug: 'sillon-puff-inflable',
    name: 'Sillón Puff Inflable Sunfield',
    desc: 'Kit completo con posapié y compresor de regalo. Material flocado premium. Slug admin: "sillon-puff-inflable". Renderiza SillonPuffLanding.jsx.',
    status: 'active',
    emoji: '🛋️',
  },
  {
    slug: 'kit-belleza-6en1',
    name: 'Kit de Belleza 6 en 1 Boxili',
    desc: 'Multifunción BXL-833: 6 cabezales intercambiables (depila, afeita, limpia, exfolia, masajea, recorta). Recarga USB-C. Slug admin: "kit-belleza-6en1". Renderiza KitBelleza6en1Landing.jsx.',
    status: 'active',
    emoji: '✂️',
  },
  {
    slug: 'masajeador-ems-eyes',
    name: 'Masajeador Facial EMS EYES',
    desc: '4 tecnologías: EMS + Luz Roja 620-630nm + Vibración Sónica + Calor 42°C. Cabezal 270°, sensor inteligente, USB-C. Slug admin: "masajeador-ems-eyes". Renderiza MasajeadorEmsEyesLanding.jsx.',
    status: 'active',
    emoji: '💡',
  },
  {
    slug: 'masajeador-facial-iones-lambo',
    name: 'Masajeador Facial 5 en 1',
    desc: '5 tecnologías: Iones + LED + EMS + Calor 42°C + Ultrasónico. Recarga USB-C, apto todo tipo de piel. Slug admin: "masajeador-facial-iones-lambo". Renderiza MasajeadorFacialIonesLanding.jsx.',
    status: 'active',
    emoji: '✨',
  },
  {
    slug: 'escultor-led',
    name: 'Escultor Facial LED 7 en 1',
    desc: 'Landing Luxcove-inspired: 16 secciones, diseño rosa/blanco alterno, Montserrat. Slug admin: "escultor-led". Renderiza LuxCoveLED.jsx.',
    status: 'active',
    emoji: '💡',
  },
  {
    slug: 'depiladora-ipl',
    name: 'Depiladora IPL Profesional',
    desc: 'Landing IPL: 13 secciones, diseño rose/dark, comparativa vs cera/laser. Slug admin: "depiladora-ipl". Renderiza DepiladoraIPL.jsx.',
    status: 'active',
    emoji: '✨',
  },
  // Para agregar una nueva landing:
  // 1. Crear frontend/src/landings/mi-producto.js (copiar TEMPLATE.js)
  // 2. Importar arriba y agregar a LANDING_CONFIGS
  // 3. Agregar entrada aquí en LANDING_META
  // 4. Crear el producto en el admin con el mismo slug
  // URL resultante: /lp/mi-producto
];