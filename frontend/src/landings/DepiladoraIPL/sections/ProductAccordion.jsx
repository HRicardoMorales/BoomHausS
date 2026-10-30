import { useState } from 'react';
import { PRODUCT_TABS } from '../data';

/* Íconos de los 4 tabs, en el mismo orden que PRODUCT_TABS. */
const ICON_PROPS = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' };
const ACCORDION_ICONS = [
  <svg key="clip" {...ICON_PROPS}><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 012 0v1h2V2a1 1 0 012 0v1" /><line x1="7" y1="8" x2="13" y2="8" /><line x1="7" y1="11" x2="13" y2="11" /><line x1="7" y1="14" x2="10" y2="14" /></svg>,
  <svg key="clock" {...ICON_PROPS}><circle cx="10" cy="10" r="7" /><polyline points="10,6 10,10 13,12" /></svg>,
  <svg key="heart" {...ICON_PROPS}><path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" /></svg>,
  <svg key="shield" {...ICON_PROPS}><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" /><polyline points="7,10 9,12 13,8" /></svg>,
];

/* Acordeón de detalles del producto (uno abierto a la vez). */
export default function ProductAccordion() {
  const [openTab, setOpenTab] = useState(null);
  return (
    <div className="ipl-accordion">
      {PRODUCT_TABS.map((tab, i) => (
        <div key={i} className="ipl-acc-item">
          <button
            className="ipl-acc-trigger"
            onClick={() => setOpenTab(openTab === i ? null : i)}
            aria-expanded={openTab === i}
          >
            <span className="ipl-acc-icon">{ACCORDION_ICONS[i]}</span>
            <span className="ipl-acc-title">{tab.title}</span>
            <span className={`ipl-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
          </button>
          <div className={`ipl-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
            <div className="ipl-acc-body-inner">
              {tab.content.map((line, j) => <p key={j}>{line}</p>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
