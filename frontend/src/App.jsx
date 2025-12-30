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

// ✅ Componente Popup de Carrito (Toast) - ESTILOS INLINE PARA FORZAR VISIBILIDAD
function CartToast() {
  const [show, setShow] = useState(false);
  const [productName, setProductName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAdd = (e) => {
      // console.log("Evento cart:added recibido:", e.detail); // Debug si es necesario
      setProductName(e.detail?.name || 'Producto');
      setShow(true);
      const timer = setTimeout(() => setShow(false), 4000); // 4 segundos
      return () => clearTimeout(timer);
    };

    window.addEventListener('cart:added', handleAdd);
    return () => window.removeEventListener('cart:added', handleAdd);
  }, []);

  if (!show) return null;

  return (
    <div
      className="cart-toast"
      style={{
        position: 'fixed',
        bottom: '25px',
        right: '25px',
        zIndex: 999999, /* 🔥 Z-index extremo para que nada lo tape */
        background: '#ffffff',
        border: '2px solid #0B5CFF',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '90vw',
        color: '#0B1220'
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '1.4rem' }}>✅</div>
        <div>
          <div style={{ fontWeight: 950, fontSize: '1rem', lineHeight: 1.2 }}>¡Agregado!</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {productName}
          </div>
        </div>
      </div>

      <button
        onClick={() => { setShow(false); navigate('/cart'); }}
        style={{
          background: '#0B5CFF',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '10px',
          fontWeight: 800,
          cursor: 'pointer',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          marginLeft: '8px'
        }}
      >
        Ver Carrito →
      </button>

      <style>{`
        @keyframes slideUp { 
          from { transform: translateY(120%); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }
      `}</style>
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

      {/* 🔥 Componente del aviso */}
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
      `}</style>
    </div>
  );
}