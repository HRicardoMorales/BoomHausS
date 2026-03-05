// src/landings/index.js
import portaCepillos from './porta-cepillos';
import consolaRetro from './consola-retro';
// import auriculares from './auriculares';

export const LANDING_CONFIGS = {
  'porta-cepillos': portaCepillos,
  'consola-retro':  consolaRetro,
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
];