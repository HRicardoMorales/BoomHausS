import { useId, useState } from 'react';
import { FAQS } from '../data';

export default function Faq() {
  const [openFaq, setOpenFaq] = useState(null);
  const baseId = useId();
  return (
    <div className="amp-sec">
      <div className="amp-container">
        <h2 className="amp-sec-h2">Preguntas frecuentes</h2>
        <div className="amp-faq-list">
          {FAQS.map((faq, i) => {
            const open = openFaq === i;
            const panelId = `${baseId}-faq-${i}`;
            return (
              <div key={i} className="amp-faq-item">
                <button
                  type="button"
                  className="amp-faq-trigger"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={panelId}
                >
                  <span className="amp-faq-q">{faq.q}</span>
                  <span className={`amp-faq-arrow${open ? ' open' : ''}`} aria-hidden="true">›</span>
                </button>
                {/* inert (no aria-hidden): el panel cerrado sale del árbol de accesibilidad
                    y del orden de tabulación sin dejar contenido enfocable oculto. */}
                <div id={panelId} className={`amp-faq-body${open ? ' open' : ''}`} inert={!open}>
                  <div className="amp-faq-body-inner">{faq.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
