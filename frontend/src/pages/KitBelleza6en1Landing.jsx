import ShowcaseLanding from '../components/landing/showcase/ShowcaseLanding.jsx';
import config from '../landings/kit-belleza-6en1';

/* Tema verde bosque con CTA rosa. */
const THEME = {
  cta: { from: '#C2185B', to: '#E91E8C', deep: '#880E4F', rgb: '194 24 91' },
  icon: '✂️',
  loaderColors: ['#C2185B', '#E91E8C'],
  fallbackTitle: <>Kit de Belleza<br />6 en 1 Boxili</>,
  countdownKey: 'kbx_cd_v2',
  quoteColor: '#C2185B',
};

export default function KitBelleza6en1Landing() {
  return <ShowcaseLanding config={config} theme={THEME} />;
}
