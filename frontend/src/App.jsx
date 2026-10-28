import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';

import Navbar from './components/navbar.jsx';
import RouteSeo from './seo/RouteSeo.jsx';
import { getLayoutChrome } from './routes/layoutChrome.js';
import Marquee from './components/marquee.jsx';
import Footer from './components/Footer.jsx';

// Home queda en el chunk inicial (es la entrada desde Instagram/Facebook).
// Todo lo demás se descarga recién al navegar a la ruta: admin, landings,
// checkout y ProductDetail (5k líneas) no deberían pesar en la primera carga.
import Home from './pages/home.jsx';
import RouteFallback from './components/RouteFallback.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { lazyWithRetry, whenIdle } from './utils/lazyWithRetry.js';

import AdminRoute from './components/AdminRoute.jsx';
import { getStoredAuth } from './utils/auth';

import { trackPageView } from "./lib/metaPixel";
import ScrollToTop from './components/ScrollToTop.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';

const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/auth/ResetPassword'));

const Products = lazyWithRetry(() => import('./pages/products.jsx'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail.jsx'));
const Cart = lazyWithRetry(() => import('./pages/Cart.jsx'));
const Checkout = lazyWithRetry(() => import('./pages/checkout.jsx'));
const Login = lazyWithRetry(() => import('./pages/login.jsx'));
const Register = lazyWithRetry(() => import('./pages/register.jsx'));
const MyOrders = lazyWithRetry(() => import('./pages/myOrders.jsx'));
const Terms = lazyWithRetry(() => import('./pages/Terms.jsx'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy.jsx'));
const Returns = lazyWithRetry(() => import('./pages/Returns.jsx'));
const SuccessPayment = lazyWithRetry(() => import('./pages/SuccessPayment'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound.jsx'));

const AdminHome = lazyWithRetry(() => import('./pages/AdminHome.jsx'));
const AdminOrders = lazyWithRetry(() => import('./pages/AdminOrders.jsx'));
const AdminProducts = lazyWithRetry(() => import('./pages/AdminProducts.jsx'));
const AdminCoupons = lazyWithRetry(() => import('./pages/AdminCoupons.jsx'));

const MundialLanding = lazyWithRetry(() => import('./pages/MundialLanding.jsx'));
const ParchesDetoxLanding = lazyWithRetry(() => import('./landings/ParchesDetox/ParchesDetox.jsx'));
const SillonPuffLanding = lazyWithRetry(() => import('./pages/SillonPuffLanding.jsx'));
const KitBelleza6en1Landing = lazyWithRetry(() => import('./pages/KitBelleza6en1Landing.jsx'));
const MasajeadorEmsEyesLanding = lazyWithRetry(() => import('./pages/MasajeadorEmsEyesLanding.jsx'));
const MasajeadorFacialIonesLanding = lazyWithRetry(() => import('./pages/MasajeadorFacialIonesLanding.jsx'));
const LuxCoveLED = lazyWithRetry(() => import('./landings/LuxCoveLED/LuxCoveLED'));
const DepiladoraIPL = lazyWithRetry(() => import('./landings/DepiladoraIPL/DepiladoraIPL'));
const AntimohoPisos = lazyWithRetry(() => import('./landings/AntimohoPisos/AntimohoPisos'));

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

  // Qué partes del layout global lleva cada ruta: ver routes/layoutChrome.js.
  const chrome = getLayoutChrome(location.pathname);

  // PageView en cada cambio de ruta SPA. El primer PageView lo dispara
  // metaPixelInit al bootear la app.
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

  // Desde la home, el siguiente paso casi siempre es la ficha de producto:
  // precargamos ese chunk cuando el navegador queda ocioso.
  useEffect(() => whenIdle(() => { ProductDetail.preload(); }), []);

  return (
    <div className="app-shell">
      <SkipLink targetId="contenido" />
      <ScrollToTop />
      <RouteSeo />
      {chrome.marquee && <Marquee countdownKey="pd_countdown" />}
      {chrome.navbar && <Navbar />}
      
      {/* ❌ CartToast ELIMINADO AQUÍ (Ahora vive en ProductDetail) */}

      {/* Destino del skip-link. No es <main> porque cada página ya define el suyo. */}
      <div className="app-body" id="contenido" tabIndex={-1}>
        <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
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
          {/* ✅ Escultor Facial LED (nombre real en BD) — componente dedicado LuxCoveLED */}
          <Route path="/lp/escultor-led" element={<LuxCoveLED />} />
          {/* ✅ Depiladora IPL Profesional — componente dedicado */}
          <Route path="/lp/depiladora-ipl" element={<DepiladoraIPL />} />
          {/* ✅ Anti-Moho PRO (pisos y juntas) — componente dedicado, header propio sin navbar/marquee/footer */}
          <Route path="/lp/antimoho-pisos" element={<AntimohoPisos />} />
          {/* ✅ Landing pages — ProductDetail con slug, sin navbar/footer */}
          <Route path="/lp/:slug" element={<ProductDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          {/* Alias viejo: /products ya resuelve el producto principal (con esqueleto y reintento). */}
          <Route path="/tienda" element={<Navigate to="/products" replace />} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/success-payment" element={<SuccessPayment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>

      {chrome.footer && <Footer />}
      {chrome.whatsapp && <WhatsAppButton />}
    </div>
  );
}

/**
 * Skip-link: mueve el foco al contenido sin tocar la URL (un hash cambiaría
 * la location del router y dispararía efectos de ruta como ScrollToTop).
 */
function SkipLink({ targetId }) {
  const onClick = (e) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    e.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  };
  return (
    <a className="skip-link" href={`#${targetId}`} onClick={onClick}>
      Saltar al contenido
    </a>
  );
}
