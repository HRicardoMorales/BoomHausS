import ShowcaseLanding from '../components/landing/showcase/ShowcaseLanding.jsx';
import config from '../landings/sillon-puff-inflable';

/* Tema verde bosque con CTA rojo. */
const THEME = {
  cta: { from: '#C53030', to: '#E53E3E', deep: '#9B2C2C', rgb: '197 48 48' },
  icon: '🛋️',
  loaderColors: ['#1B4D3E', '#4ade80'],
  fallbackTitle: <>El sillón que querías<br />sin arrastrar nada</>,
  countdownKey: 'spf_cd_v2',
};

export default function SillonPuffLanding() {
  return <ShowcaseLanding config={config} theme={THEME} />;
}
