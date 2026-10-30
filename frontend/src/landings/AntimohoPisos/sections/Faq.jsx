import { useState } from 'react';
import { FAQS } from '../data';

export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <h2 className="amp-sec-h2">Preguntas frecuentes</h2>
        <div className="amp-faq-list" style={{ marginTop: 24 }}>
          {FAQS.map((faq, i) => (
            <div key={i} className="amp-faq-item">
              <button
                className="amp-faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="amp-faq-q">{faq.q}</span>
                <span className={`amp-faq-arrow${openFaq === i ? ' open' : ''}`}>›</span>
              </button>
              <div className={`amp-faq-body${openFaq === i ? ' open' : ''}`} aria-hidden={openFaq !== i}>
                <div className="amp-faq-body-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
