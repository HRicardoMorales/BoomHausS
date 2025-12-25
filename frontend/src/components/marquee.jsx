// frontend/src/components/Marquee.jsx

import React from 'react';

function Marquee({
    items = [
        'Envío gratis a todo el país',
        'Pagá por transferencia',
        'Soporte por WhatsApp',
        'Compra segura'
    ]
}) {
    // Duplicamos la lista para que el loop sea continuo (el CSS mueve -50%)
    const loop = [...items, ...items];

    return (
        <div className="marquee" aria-label="Beneficios">
            <div className="marquee__track">
                {loop.map((text, i) => (
                    <span key={`${text}-${i}`} className="marquee__item">
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default Marquee;
