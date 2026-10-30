import { useState } from 'react';
import { faqs } from '../data';

/* S16 — Preguntas frecuentes (C10) */
export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="led-faq-section">
      <div className="led-container">
        <h2 className="led-faq-title">Preguntas frecuentes</h2>
        <p className="led-faq-sub">Todo lo que necesitás saber sobre el Escultor Facial LED 3 en 1.</p>
        <div className="led-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="led-faq-item">
              <button
                className="led-faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="led-faq-q">{faq.q}</span>
                <span className={`led-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
              </button>
              <div className={`led-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                <div className="led-faq-body-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
