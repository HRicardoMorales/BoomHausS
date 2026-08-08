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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
