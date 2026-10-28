import { compRows } from '../data';

/* S13 — Tabla comparativa (C9) */
export default function Comparison() {
  return (
    <div className="led-comp-section">
      <h2 className="led-comp-title">Amelor VS OTRAS MARCAS</h2>
      <p className="led-comp-sub">Nos enorgullecemos de la calidad de nuestros productos; no podemos decir lo mismo de otras marcas.</p>
      <div className="led-comp-table">
        <div className="led-comp-header">
          <div className="led-comp-col-feature"></div>
          <div className="led-comp-col-us">Amelor</div>
          <div className="led-comp-col-them">Otras marcas</div>
        </div>
        {compRows.map((row, i) => (
          <div key={i} className={`led-comp-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
            <div className="led-comp-col-feature">{row}</div>
            <div className="led-comp-col-us"><span className="led-comp-check">✓</span></div>
            <div className="led-comp-col-them"><span className="led-comp-cross">✗</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
