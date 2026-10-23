import WineLanding from '../components/landing/wine/WineLanding';
import config from '../landings/masajeador-ems-eyes';

/* Estilo inline de las fotos de historia: también aplica al fallback de
   SafeImg cuando la imagen no carga (sin esto el fallback queda en flex). */
const STORY_IMG_PROPS = { style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } };

const theme = {
  icon: '💡',
  fallbackTitle: 'Masajeador Facial EMS EYES',
  initials: ['D', 'V', 'C'],
  countdownKey: 'ems_cd_v2',
  heroFit: 'cover',
  showProductName: true,
  waveLight: '#ffffff',
  storyImgProps: STORY_IMG_PROPS,
  footer: 'night',
};

export default function MasajeadorEmsEyesLanding() {
  return <WineLanding config={config} theme={theme} />;
}
