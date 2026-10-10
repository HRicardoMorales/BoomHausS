// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';

// ✅ Provider del carrito (persistente)
import { CartProvider } from './context/CartContext.jsx';

// Meta Pixel — snippet base condicional a VITE_META_PIXEL_ID.
// Debe correr antes del primer render para que fbq esté listo cuando
// las páginas empiecen a disparar eventos.
import { initMetaPixel } from './lib/metaPixelInit';
initMetaPixel();

// Vite precarga el CSS de cada chunk lazy y, si un <link> falla, rechaza el
// import() completo y la ruta queda en blanco. Pasa en la práctica: los CSS de
// las landings hacen @import de Google Fonts, que bloqueadores de contenido o
// redes móviles inestables cortan. Seguimos sin ese CSS en vez de romper la
// página. Ojo: Vite despacha el mismo evento cuando falla el import() del JS,
// y si se cancela el import() resuelve `undefined` (React rompe con "reading
// 'default'" y nunca se reintenta). Por eso solo se cancela para CSS; los
// fallos de JS siguen su curso hasta `lazyWithRetry` (recarga una vez para
// traer el index.html del deploy nuevo) y, si persisten, al ErrorBoundary.
window.addEventListener('vite:preloadError', (event) => {
  if (/Unable to preload CSS/i.test(String(event.payload?.message))) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
