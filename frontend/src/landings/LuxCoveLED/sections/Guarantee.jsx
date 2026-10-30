/* S14 — Garantía de 90 días + CTA */
export default function Guarantee({ onBuy, soldOut }) {
  return (
    <div className="led-section led-section--white">
      <div className="led-container">
        <div className="led-guarantee">
          <div className="led-guarantee-icon">
            <img
              src="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=360"
              srcSet="//www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=165 165w, //www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=360 360w, //www.luxcove.co/cdn/shop/files/Untitled_design_-_2024-08-10T191415.055_c5c01040-8d0b-4eb2-91b8-433509c299e1.png?v=1723313727&width=535 535w"
              sizes="160px"
              alt="Garantía 90 días"
              loading="lazy"
              className="led-guarantee-img"
            />
          </div>
          <h2 className="led-guarantee-title">Probalo sin riesgos</h2>
          <p className="led-guarantee-text">
            Estamos seguros de que te va a encantar nuestro producto, pero si no es para vos, no te preocupes.
            Probalo durante 90 días y, si no quedás completamente satisfecha/o, devolvelo y te reembolsamos
            el importe íntegro, sin preguntas. Tu satisfacción es nuestra prioridad.
          </p>
          <button className="led-btn-cta-center" onClick={onBuy} disabled={soldOut}>
            {soldOut ? 'AGOTADO' : 'AGREGAR AL CARRITO ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}
