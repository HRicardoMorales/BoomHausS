import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/navbar.jsx';
import Marquee from './components/marquee.jsx';
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
import AdminHome from './pages/AdminHome.jsx';
import AdminCoupons from './pages/AdminCoupons.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import MundialLanding from './pages/MundialLanding.jsx';
import ParchesDetoxLanding from './landings/ParchesDetox/ParchesDetox.jsx';
import SillonPuffLanding from './pages/SillonPuffLanding.jsx';
import KitBelleza6en1Landing from './pages/KitBelleza6en1Landing.jsx';
import MasajeadorEmsEyesLanding from './pages/MasajeadorEmsEyesLanding.jsx';
import MasajeadorFacialIonesLanding from './pages/MasajeadorFacialIonesLanding.jsx';
import LuxCoveLED from './landings/LuxCoveLED/LuxCoveLED';
import DepiladoraIPL from './landings/DepiladoraIPL/DepiladoraIPL';
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

  // ✅ Navbar/marquee ocultos en checkout y landing B2B
  const hideChrome = location.pathname === '/checkout';
  // ✅ Marquee oculto además en landings con header propio
  const hideMarquee = hideChrome || location.pathname === '/lp/escultor-led' || location.pathname === '/lp/depiladora-ipl' || location.pathname === '/lp/parches-detox';
  // ✅ Footer oculto en checkout y landing B2B mundial
  const hideFooter = location.pathname === '/lp/mundial-revendedores' || location.pathname === '/checkout' || location.pathname === '/lp/masajeador-facial-iones-lambo' || location.pathname === '/lp/escultor-led' || location.pathname === '/lp/depiladora-ipl' || location.pathname === '/lp/parches-detox';

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
      {!hideMarquee && <Marquee countdownKey="pd_countdown" />}
      {!hideChrome && <Navbar />}
      
      {/* ❌ CartToast ELIMINADO AQUÍ (Ahora vive en ProductDetail) */}

      <div className="app-body">
        <Routes>
          {/* ✅ Home público — accesible sin login */}
          <Route path="/" element={<Home />} />
          <Route path="/public" element={<Home />} />

          {/* ✅ Panel admin — requiere rol admin */}
          <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />

          {/* ✅ Landing pages (ads -> directo acá) */}
          {/* ✅ Landing B2B mundial revendedores (ANTES del catch-all de slugs) */}
          <Route path="/lp/mundial-revendedores" element={<MundialLanding />} />
          {/* ✅ Parches Plantares Detox — componente dedicado con secciones propias */}
          <Route path="/lp/parches-detox" element={<ParchesDetoxLanding />} />
          {/* ✅ Sillón Puff Inflable Sunfield — componente dedicado */}
          <Route path="/lp/sillon-puff-inflable" element={<SillonPuffLanding />} />
          {/* ✅ Kit de Belleza 6 en 1 Boxili — componente dedicado */}
          <Route path="/lp/kit-belleza-6en1" element={<KitBelleza6en1Landing />} />
          {/* ✅ Masajeador Facial EMS EYES — componente dedicado */}
          <Route path="/lp/masajeador-ems-eyes" element={<MasajeadorEmsEyesLanding />} />
          {/* ✅ Masajeador Facial 5 en 1 Lambo Lady — componente dedicado */}
          <Route path="/lp/masajeador-facial-iones-lambo" element={<MasajeadorFacialIonesLanding />} />
          {/* ✅ Escultor Facial LED 7 en 1 — componente dedicado LuxCoveLED */}
          <Route path="/lp/escultor-led" element={<LuxCoveLED />} />
          {/* ✅ Depiladora IPL Profesional — componente dedicado */}
          <Route path="/lp/depiladora-ipl" element={<DepiladoraIPL />} />
          {/* ✅ Landing pages — ProductDetail con slug, sin navbar/footer */}
          <Route path="/lp/:slug" element={<ProductDetail />} />
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
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="*" element={<Navigate to="/public" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/success-payment" element={<SuccessPayment />} />
        </Routes>
      </div>

      {!hideChrome && !hideFooter && <Footer />}
    </div>
  );
}