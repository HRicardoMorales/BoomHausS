/* S7–S9 — Bloques de modo EMS, luz roja y luz verde (GIF + texto) */
export default function FeatureBlocks() {
  return (
    <>
      <div className="led-feat-section" style={{ background: '#fff' }}>
        <div className="led-feat-inner">
          <div className="led-feat-img">
            <img
              src="//www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=750"
              srcSet="//www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=360 360w, //www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=535 535w, //www.luxcove.co/cdn/shop/files/GIF1-LFS-ezgif.com-video-to-gif-converter.gif?v=1753723012&width=750 750w"
              sizes="(min-width: 750px) 50vw, 100vw"
              alt="Modo EMS"
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
            />
          </div>
          <div className="led-feat-text">
            <h2 className="led-feat-title">Conseguí un lifting facial instantáneo en casa.</h2>
            <p className="led-feat-desc">Nuestro modo EMS avanzado (Estimulación Muscular Eléctrica) estimula los músculos faciales, favoreciendo una apariencia más firme y tonificada.</p>
            <p className="led-feat-desc">Decile adiós a la piel flácida, la papada, el cuello de pavo y la doble mentón.</p>
          </div>
        </div>
      </div>

      {/* ══ S8 — FEATURE LUZ ROJA ══ */}
      <div className="led-feat-section" style={{ background: '#FFC6C6' }}>
        <div className="led-feat-inner led-feat-reverse">
          <div className="led-feat-img">
            <img
              src="//www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=750"
              srcSet="//www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=360 360w, //www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=535 535w, //www.luxcove.co/cdn/shop/files/LFS-GIF31-ezgif.com-video-to-gif-converter.gif?v=1753723174&width=750 750w"
              sizes="(min-width: 750px) 50vw, 100vw"
              alt="Luz roja"
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
            />
          </div>
          <div className="led-feat-text">
            <h2 className="led-feat-title">Suavizá las líneas finas y las arrugas.</h2>
            <p className="led-feat-desc">Nuestro modo de luz roja estimula la producción de colágeno para suavizar las líneas de expresión, mejorar la textura de la piel y aumentar su elasticidad para lograr un brillo juvenil.</p>
          </div>
        </div>
      </div>

      {/* ══ S9 — FEATURE LUZ VERDE ══ */}
      <div className="led-feat-section" style={{ background: '#fff' }}>
        <div className="led-feat-inner">
          <div className="led-feat-img">
            <img
              src="//www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=750"
              srcSet="//www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=360 360w, //www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=535 535w, //www.luxcove.co/cdn/shop/files/LFS-GIF3-ezgif.com-video-to-gif-converter.gif?v=1753723244&width=750 750w"
              sizes="(min-width: 750px) 50vw, 100vw"
              alt="Luz verde"
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
            />
          </div>
          <div className="led-feat-text">
            <h2 className="led-feat-title">Unificá el tono y la textura de la piel.</h2>
            <p className="led-feat-desc">Nuestro modo de luz verde actúa sobre la producción excesiva de melanina, reduciendo la hiperpigmentación y atenuando las manchas oscuras para un tono de piel más claro y uniforme.</p>
          </div>
        </div>
      </div>
    </>
  );
}
