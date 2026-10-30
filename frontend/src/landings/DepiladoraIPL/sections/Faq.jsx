import { useState } from 'react';
import { faqs } from '../data';

/* S13 — Preguntas frecuentes */
export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="ipl-faq-section">
      <div className="ipl-container">
        <h2 className="ipl-faq-title">Preguntas frecuentes</h2>
        <p className="ipl-faq-sub">Todo lo que necesitás saber sobre la Depiladora IPL.</p>
        <div className="ipl-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="ipl-faq-item">
              <button
                className="ipl-faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="ipl-faq-q">{faq.q}</span>
                <span className={`ipl-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
              </button>
              <div className={`ipl-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                <div className="ipl-faq-body-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
