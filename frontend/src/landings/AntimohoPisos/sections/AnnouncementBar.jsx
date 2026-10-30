import { useEffect, useState } from 'react';
import { BRAND_NAME } from '../data';

/* Countdown de la barra roja (reinicia — típico de "oferta activa").
   Vive acá para que el tic de cada segundo re-renderice solo esta barra,
   no la landing entera. */
function useCountdown(hours = 6) {
  const [msLeft, setMsLeft] = useState(hours * 3600 * 1000);
  useEffect(() => {
    const t = setInterval(() => {
      setMsLeft((prev) => (prev <= 1000 ? hours * 3600 * 1000 : prev - 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [hours]);
  const totalSec = Math.floor(msLeft / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function AnnouncementBar() {
  const clock = useCountdown(6);
  return (
    <>
      <div className="amp-topbar">
        <span>Envío a todo el país en compras superiores a $50.000</span>
        <span className="amp-sep">|</span>
        <span>Miles de familias ya confían en {BRAND_NAME}</span>
      </div>
      <div className="amp-salebar">
        <span>Oferta activa: hasta 40% OFF · Por tiempo limitado</span> {/* EDITAR: ajustar % o el bundle de mayor descuento para que coincida */}
        <span className="amp-salebar-clock">⏱ {clock}</span>
      </div>
    </>
  );
}
