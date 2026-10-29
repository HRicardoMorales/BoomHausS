import { useEffect, useState } from 'react';
import { annMsgs } from '../data';

/* S1 — Barra de anuncios rotativa */
export default function AnnouncementBar() {
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);

  /* Announcement rotation */
  useEffect(() => {
    const t = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => { setAnnIdx(i => (i + 1) % annMsgs.length); setAnnVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ipl-ann-bar">
      <span className={`ipl-ann-msg ${annVisible ? 'visible' : 'hidden'}`}>
        {annMsgs[annIdx]}
      </span>
    </div>
  );
}
