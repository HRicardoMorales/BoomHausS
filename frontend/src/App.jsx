// frontend/src/App.jsx

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

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

function PrivateRoute({ children }) {
  const location = useLocation();
  const { token, user } = getStoredAuth();

  // ✅ si no hay sesión, mandamos a login con "from"
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  const location = useLocation();

  // ✅ Animación pro: revela elementos con clase .reveal al entrar en viewport
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
      // si ya es visible, no lo vuelvas a observar
      if (el.classList.contains('is-visible')) return;
      io.observe(el);
    });

    return () => io.disconnect();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />

      <div className="app-body">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Cliente */}
          <Route
            path="/my-orders"
            element={
              <PrivateRoute>
                <MyOrders />
              </PrivateRoute>
            }
          />
          <Route path="/tienda" element={<TiendaRedirect />} />


          {/* Admin */}
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />

          {/* Legales */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/returns" element={<Returns />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer />

      <style>{`
        .app-shell{
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-body{
          flex: 1;
        }
      `}</style>
    </div>
  );
}
