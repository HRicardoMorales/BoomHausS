import { useState } from 'react';
import { PRODUCT_TABS } from '../data';

const accordionIcons = [
  <svg key="leaf" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 16c2-6 8-8 12-6-4 0-8 2-10 6"/><path d="M4 16c1-3 4-5 8-5"/><circle cx="4" cy="16" r="1" fill="currentColor"/></svg>,
  <svg key="clock" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><polyline points="10,6 10,10 13,12"/></svg>,
  <svg key="shield2" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z"/><polyline points="7,10 9,12 13,8"/></svg>,
  <svg key="box" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7l7-4 7 4v9l-7 4-7-4V7z"/><path d="M3 7l7 4 7-4M10 11v7"/></svg>,
];

/* Acordeón de detalles del producto */
export default function ProductAccordion() {
  const [openTab, setOpenTab] = useState(null);

  return (
    <div className="pdx-accordion">
      {PRODUCT_TABS.map((tab, i) => (
        <div key={i} className="pdx-acc-item">
          <button
            className="pdx-acc-trigger"
            onClick={() => setOpenTab(openTab === i ? null : i)}
            aria-expanded={openTab === i}
          >
            <span className="pdx-acc-icon">{accordionIcons[i]}</span>
            <span className="pdx-acc-title">{tab.title}</span>
            <span className={`pdx-acc-arrow${openTab === i ? ' open' : ''}`}>›</span>
          </button>
          <div className={`pdx-acc-body${openTab === i ? ' open' : ''}`} aria-hidden={openTab !== i}>
            <div className="pdx-acc-body-inner">
              {tab.content.map((line, j) => <p key={j}>{line}</p>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
