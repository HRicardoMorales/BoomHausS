import { useEffect, useState } from 'react';
import { annMsgs } from '../data';

/* S1 — Barra de anuncios rotativa (su intervalo ya no re-renderiza la landing) */
export default function AnnouncementBar() {
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => { setAnnIdx(i => (i + 1) % annMsgs.length); setAnnVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pdx-ann-bar">
      <span className={`pdx-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
        {annMsgs[annIdx]}
      </span>
    </div>
  );
}
