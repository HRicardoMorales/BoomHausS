import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/navbar.jsx';
import Footer from './components/Footer.jsx';

import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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
import SuccessPayment from './pages/SuccessPayment';
import AdminRoute from './components/AdminRoute.jsx';
import { getStoredAuth } from './utils/auth';

import { trackPageView } from "./lib/metaPixel";
import ScrollToTop from './components/ScrollToTop.jsx';
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

  // ✅ PageView por ruta (SPA)
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // ✅ SCROLL TOP REFORZADO (FIX DEFINITIVO)
  useEffect(() => {
    // 1. Intenta scrollear la ventana principal
    window.scrollTo(0, 0);
    
    // 2. Intenta scrollear el documento raíz (a veces necesario en móviles)
    document.documentElement.scrollTo(0, 0);
    
    // 3. Intenta scrollear tus contenedores CSS específicos
    // (Si usas un layout donde el scroll está dentro de un div y no en el body)
    const shell = document.querySelector('.app-shell');
    const bodyDiv = document.querySelector('.app-body');
    
    if (shell) shell.scrollTo(0, 0);
    if (bodyDiv) bodyDiv.scrollTo(0, 0);
    
  }, [location.pathname]); // Se ejecuta cada vez que cambia la ruta (ej: ir a checkout)

  // Animación Reveal
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
      <ScrollToTop />
      <Navbar />
      
      {/* ❌ CartToast ELIMINADO AQUÍ (Ahora vive en ProductDetail) */}

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/success-payment" element={<SuccessPayment />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}