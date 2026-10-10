import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, useEffect } from 'react';

import Navbar from './components/navbar.jsx';
import RouteSeo from './seo/RouteSeo.jsx';
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
const TiendaRedirect = lazyWithRetry(() => import('./pages/tiendaRedirect.jsx'));
const Terms = lazyWithRetry(() => import('./pages/Terms.jsx'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy.jsx'));
const Returns = lazyWithRetry(() => import('./pages/Returns.jsx'));
const SuccessPayment = lazyWithRetry(() => import('./pages/SuccessPayment'));

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

  // ✅ Navbar/marquee ocultos en checkout y landing B2B
  const hideChrome = location.pathname === '/checkout' || location.pathname === '/lp/antimoho-pisos';
  // ✅ Marquee oculto además en landings con header propio
  const hideMarquee = hideChrome || location.pathname === '/lp/escultor-led' || location.pathname === '/lp/depiladora-ipl' || location.pathname === '/lp/parches-detox' || location.pathname === '/lp/antimoho-pisos';
  // ✅ Footer oculto en checkout y landing B2B mundial
  const hideFooter = location.pathname === '/lp/mundial-revendedores' || location.pathname === '/checkout' || location.pathname === '/lp/masajeador-facial-iones-lambo' || location.pathname === '/lp/escultor-led' || location.pathname === '/lp/depiladora-ipl' || location.pathname === '/lp/parches-detox' || location.pathname === '/lp/antimoho-pisos';
  // ✅ WhatsApp global oculto donde la pagina renderiza su propio boton
  //    (evita duplicar). Alcance:
  //    - landings (/lp/*): todas tienen su <WaTab> propio con estilo custom
  //    - product detail (/products/:id): tiene <WaTab>
  //    - admin (/admin/*): no queremos WA de cliente en el panel admin
  //    - checkout: UI densa, floating extra molesta
  //    Excepcion /lp/antimoho-pisos: la landing NO tiene WaTab propio
  //    todavia (WIP), asi que dejamos el global para no dejarla sin WA.
  //    TODO: cuando se termine AntimohoPisos, agregarle su WaTab y sacar
  //    la excepcion.
  //    Home (/, /public) SI muestra el global (antes tenia un .hc-wa-fab
  //    local duplicado; se removio para consolidar en el componente global).
  const hideWhatsApp =
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/products/') ||
    (location.pathname.startsWith('/lp/') && location.pathname !== '/lp/antimoho-pisos');

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

  // Animación Reveal. Las rutas lazy montan su contenido después de este
  // effect, así que además de los nodos actuales observamos los que se
  // agreguen al DOM (MutationObserver).
  useEffect(() => {
    const root = document.querySelector('.app-shell');
    if (!root || typeof IntersectionObserver === 'undefined') return;
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
    const observeAll = () => {
      root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
    };
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <RouteSeo />
      {!hideMarquee && <Marquee countdownKey="pd_countdown" />}
      {!hideChrome && <Navbar />}
      
      {/* ❌ CartToast ELIMINADO AQUÍ (Ahora vive en ProductDetail) */}

      <div className="app-body">
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
        </Suspense>
        </ErrorBoundary>
      </div>

      {!hideChrome && !hideFooter && <Footer />}
      {!hideWhatsApp && <WhatsAppButton />}
    </div>
  );
}