import { useState } from 'react';
import SafeImg from '../../../components/SafeImg';
import { COMP_WIDTHS } from '../../../components/landing/imageSizes';
import { COMP_PRODUCT_IMG, COMP_TABS } from '../data';

/* S9 — Comparativa con otros métodos (tabs) */
export default function Comparison() {
  const [compTab, setCompTab] = useState('otras');

  return (
    <section className="ipl-ctabs-section">
      <div className="ipl-container">
        <h2 className="ipl-ctabs-title">¿Y si uso otros métodos de depilación?</h2>
        <p className="ipl-ctabs-desc">Descubrí por qué la Depiladora IPL es mejor que tu método actual.</p>

        <div className="ipl-ctabs-nav">
          {COMP_TABS.map(tab => (
            <button
              key={tab.id}
              className={`ipl-ctab-btn${compTab === tab.id ? ' active' : ''}`}
              onClick={() => setCompTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {COMP_TABS.filter(tab => tab.id === compTab).map(tab => (
          <div key={tab.id} className="ipl-ctab-content">
            <div className="ipl-ctab-images">
              <div className="ipl-ctab-img-wrap">
                <SafeImg src={COMP_PRODUCT_IMG} alt="Depiladora IPL" width={170} height={227} sizes="170px" widths={COMP_WIDTHS} />
              </div>
              <div className="ipl-ctab-img-wrap">
                {tab.competitorImg
                  ? <SafeImg src={tab.competitorImg} alt={tab.label} width={170} height={227} sizes="170px" widths={COMP_WIDTHS} />
                  : <div className="ipl-ctab-img-ph">🖼</div>
                }
              </div>
            </div>
            <div className="ipl-ctab-points">
              {tab.points.map((pt, i) => (
                <div key={i} className={`ipl-ctab-row${i === tab.points.length - 1 ? ' last' : ''}`}>
                  <div className="ipl-ctab-point ipl-ctab-point--good">
                    <span className="ipl-ctab-icon">✅</span>
                    <span>{pt.good}</span>
                  </div>
                  <div className="ipl-ctab-point ipl-ctab-point--bad">
                    <span className="ipl-ctab-icon">❌</span>
                    <span>{pt.bad}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
