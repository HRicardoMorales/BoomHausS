// src/landings/index.js
import portaCepillos         from './porta-cepillos';
import consolaRetro          from './consola-retro';
import mochilaTransparente   from './mochila-transparente';
import mochilaFashion        from './mochila-fashion';

export const LANDING_CONFIGS = {
  'porta-cepillos':           portaCepillos,
  'consola-retro':            consolaRetro,
  'mochila-transparente':     mochilaTransparente,
  'mochila-fashion':          mochilaFashion,
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
  // Para agregar una nueva landing:
  // 1. Crear frontend/src/landings/mi-producto.js (copiar TEMPLATE.js)
  // 2. Importar arriba y agregar a LANDING_CONFIGS
  // 3. Agregar entrada aquí en LANDING_META
  // 4. Crear el producto en el admin con el mismo slug
  // URL resultante: /lp/mi-producto
];