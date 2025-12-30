import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Navbar from './components/navbar.jsx';
import Footer from './components/Footer.jsx';

// Páginas
import Home from './pages/home.jsx';
import Products from './pages/products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/checkout.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import MyOrders from './pages/myOrders.jsx';
import TiendaRedirect from './pages/tiendaRedirect.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Returns from './pages/Returns.jsx';

import AdminRoute from './components/AdminRoute.jsx';
import { getStoredAuth } from './utils/auth';

// ✅ Componente Popup de Carrito (Toast)
function CartToast() {
  const [show, setShow] = useState(false);
  const [productName, setProductName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAdd = (e) => {
      setProductName(e.detail?.name || 'Producto');
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('cart:added', handleAdd);
    return () => window.removeEventListener('cart:added', handleAdd);
  }, []);

  if (!show) return null;

  return (
    <div className="cart-toast">
      <div className="cart-toast-info">
        <div style={{ fontSize: '1.4rem' }}>✅</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 950, fontSize: '1rem', lineHeight: 1.2 }}>¡Agregado!</div>
          <div style={{ 
            fontSize: '0.85rem', 
            opacity: 0.8, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {productName}
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => { setShow(false); navigate('/cart'); }} 
        className="cart-toast-btn"
      >
        Ver Carrito →
      </button>
    </div>
  );
}

function PrivateRoute({ children }) {
  const location = useLocation();
  const { token, user } = getStoredAuth();
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  const location = useLocation();

  // 🔥 NUEVO: Scroll Top Automático
  // Cada vez que cambia la ruta (pathname), sube al inicio de la página.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Animación Reveal (existente)
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    nodes.forEach((el) => {
      if (el.classList.contains('is-visible')) return;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      
      <CartToast />

      <div className="app-body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="/tienda" element={<TiendaRedirect />} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />

      <style>{`
        .app-shell{ min-height: 100vh; display: flex; flex-direction: column; }
        .app-body{ flex: 1; }

        /* Estilos Toast */
        .cart-toast {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 999999;
          background: #ffffff;
          border: 2px solid #0B5CFF;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 16px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 90vw;
          color: #0B1220;
        }
        .cart-toast-info { display: flex; gap: 12px; align-items: center; min-width: 0; flex: 1; }
        .cart-toast-btn {
          background: #0B5CFF; color: white; border: none; padding: 10px 16px;
          border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.9rem;
          white-space: nowrap; transition: background 0.2s;
        }
        .cart-toast-btn:hover { background: #0046d5; }
        @keyframes slideUp { from { transform: translateY(120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Responsive Móvil */
        @media (max-width: 600px) {
          .cart-toast {
            flex-direction: column; 
            align-items: stretch;
            gap: 12px;
            right: 5vw; left: 5vw; width: 90vw;
            bottom: 20px; padding: 14px;
          }
          .cart-toast-info { justify-content: center; text-align: center; }
          .cart-toast-btn { width: 100%; padding: 12px; font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}