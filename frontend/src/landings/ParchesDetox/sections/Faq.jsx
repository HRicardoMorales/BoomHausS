import { useState } from 'react';
import { faqs } from '../data';

/* S13 — Preguntas frecuentes */
export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pdx-faq-section">
      <div className="pdx-container">
        <h2 className="pdx-faq-title">Preguntas frecuentes</h2>
        <p className="pdx-faq-sub">Todo lo que necesitás saber sobre los Parches Plantares Detox.</p>
        <div className="pdx-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="pdx-faq-item">
              <button
                className="pdx-faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="pdx-faq-q">{faq.q}</span>
                <span className={`pdx-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
              </button>
              <div className={`pdx-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                <div className="pdx-faq-body-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
