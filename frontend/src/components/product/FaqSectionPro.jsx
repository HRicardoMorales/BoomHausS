import { useState } from "react";

export default function FaqSectionPro({ mc = {} }) {
  const [openIndex, setOpenIndex] = useState(null);
  const { faq, faqTitle } = mc;

  return (
    <section className="faq-acc-wrap" id="faq-section">
      {faqTitle && <h2 className="faq-acc-title">{faqTitle}</h2>}
      <div className="faq-acc anim-el">
        {faq.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className={`faq-acc-item${isOpen ? " active" : ""}`}>
              <div
                className="faq-acc-header"
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-acc-indicator" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </div>
              <div className="faq-acc-content">
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
