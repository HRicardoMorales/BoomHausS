import WineLanding from '../components/landing/wine/WineLanding';
import config from '../landings/masajeador-facial-iones-lambo';

const theme = {
  icon: '✨',
  fallbackTitle: 'Masajeador Facial 5 en 1 Lambo Lady LT-25M33',
  initials: ['M', 'R', 'Y'],
  countdownKey: 'lam_cd_v2',
  heroFit: 'contain',
  waveLight: '#FFF5F8',
  circulacionFirst: true,
  miniReviews: { variant: 'card', label: 'Lo que dicen nuestras clientas' },
  footer: 'wine',
  stickyShowLabel: false,
  // Foto del producto sobre fondo claro (contain) y bloques de historia más compactos.
  vars: {
    '--wine-page-bg': '#FFF5F8',
    '--wine-media-bg': '#FFF5F8',
    '--wine-media-h-md': '460px',
    '--wine-media-h-sm': '420px',
    '--wine-flow-gap': '4px',
    '--wine-flow-title-mb': '6px',
    '--wine-flow-rich-lh': '1.5',
  },
};

export default function MasajeadorFacialIonesLanding() {
  return <WineLanding config={config} theme={theme} />;
}
