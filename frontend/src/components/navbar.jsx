import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { clearAuth, getStoredAuth, isAdmin } from '../utils/auth';

function Marquee({ items }) {
    const repeated = [...items, ...items, ...items];
    return (
        <div className="marquee-bar" style={{ width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28, padding: '10px 18px', whiteSpace: 'nowrap', animation: 'marquee 18s linear infinite', willChange: 'transform' }}>
                {repeated.map((text, idx) => (
                    <span key={`${text}-${idx}`} style={{ fontWeight: 950, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                        {text} <span style={{ opacity: 0.55 }}>•</span>
                    </span>
                ))}
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.333%); } }`}</style>
        </div>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { items } = useCart();
    
    // Cálculo seguro del carrito
    const cartCount = useMemo(() => (items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0), [items]);
    
    const [currentUser, setCurrentUser] = useState(() => getStoredAuth().user);
    const [open, setOpen] = useState(false); // Estado para abrir/cerrar menú lateral

    function refreshUser() {
        const { user } = getStoredAuth();
        setCurrentUser(user || null);
    }

    useEffect(() => { refreshUser(); }, [location.pathname]);
    useEffect(() => { window.addEventListener('auth:changed', refreshUser); return () => window.removeEventListener('auth:changed', refreshUser); }, []);
    useEffect(() => { function onFocus() { refreshUser(); } window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, []);
    useEffect(() => setOpen(false), [location.pathname]); // Cerrar menú al cambiar de página

    const admin = isAdmin(currentUser);

    function logout() {
        clearAuth();
        setCurrentUser(null);
        navigate('/login');
    }

    const storeName = import.meta.env.VITE_STORE_NAME || 'BoomHausS';
    const linkBase = ({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`;

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 9000, background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
            {/* Solo mostramos el Marquee en Desktop */}
            <div className="desktop-only">
                <Marquee items={['Envíos gratis a todo el país 🚚', 'Pago por transferencia 💸', 'Soporte por WhatsApp 💬', 'Compra segura ✅']} />
            </div>

            {/* =========================
                NAVBAR DESKTOP (PC)
               ========================= */}
            <div className="container nav-desktop-container" style={{ padding: '0.85rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                    
                    {/* Brand Desktop */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: '#0f172a' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(11,92,255,.25)', background: 'linear-gradient(180deg, rgba(11,92,255,.22), rgba(34,195,255,.14))', display: 'grid', placeItems: 'center', fontWeight: 950, color: '#0B5CFF' }}>
                            {storeName.slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ lineHeight: 1.1 }}>
                            <div style={{ fontWeight: 950, letterSpacing: '-0.03em' }}>{storeName}</div>
                            <div className="muted" style={{ fontSize: '0.85rem', color: '#64748b' }}>Tienda oficial</div>
                        </div>
                    </Link>

                    {/* Menú Desktop */}
                    <nav className="nav-desktop" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <NavLink className={linkBase} to="/">Inicio</NavLink>
                        <NavLink className={linkBase} to="/products">Tienda</NavLink>
                        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''} ${cartCount > 0 ? 'cart-highlight' : ''}`} to="/cart">
                            Carrito {cartCount > 0 ? <span className="nav-pill">{cartCount}</span> : null}
                        </NavLink>
                        <NavLink className={linkBase} to="/checkout">Checkout</NavLink>
                        {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                        {admin ? <><NavLink className={linkBase} to="/admin/orders">Admin pedidos</NavLink><NavLink className={linkBase} to="/admin/products">Admin productos</NavLink></> : null}

                        <div style={{ width: 1, height: 26, background: '#e2e8f0', margin: '0 0.35rem' }} />

                        {!currentUser ? (
                            <>
                                <NavLink className={linkBase} to="/login">Login</NavLink>
                                <NavLink className="btn btn-primary" to="/register" style={{padding: '8px 16px', fontSize: '0.9rem'}}>Registrarse →</NavLink>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <span className="muted" style={{ fontWeight: 900, fontSize: '0.9rem', color: '#334155' }}>{currentUser.name || currentUser.email}</span>
                                <button className="btn btn-ghost" type="button" onClick={logout} style={{color: '#ef4444'}}>Salir</button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>

            {/* =========================
                NAVBAR MOBILE (Celular)
               ========================= */}
            <div className="mobile-nav-container">
                <nav className="mobile-nav">
                    <div className="mn-left">
                        {/* Botón Menú Hamburguesa */}
                        <button className="mn-btn" type="button" onClick={() => setOpen(!open)} aria-label="Abrir menú">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                    
                    <div className="mn-center">
                        <Link to="/" className="mn-brand">{storeName}</Link>
                    </div>
                    
                    <div className="mn-right">
                        {/* Botón Usuario / Mis Pedidos */}
                        <Link to={currentUser ? "/my-orders" : "/login"} className="mn-btn">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </Link>
                        
                        {/* Botón Carrito */}
                        <Link to="/cart" className="mn-btn mn-cart-btn">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            {cartCount > 0 && <span className="mn-badge">{cartCount}</span>}
                        </Link>
                    </div>
                </nav>

                {/* Menú Desplegable Móvil */}
                {open && (
                    <div className="mobile-menu-dropdown card" style={{ margin: '0', borderRadius: '0 0 16px 16px', borderTop: 'none', padding: '1rem', background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <NavLink className={linkBase} to="/">Inicio</NavLink>
                            <NavLink className={linkBase} to="/products">Tienda</NavLink>
                            <NavLink className={linkBase} to="/cart">Carrito ({cartCount})</NavLink>
                            {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                            <div style={{ height: 1, background: '#eee', margin: '0.5rem 0' }} />
                            {!currentUser ? (
                                <><NavLink className={linkBase} to="/login">Ingresar</NavLink><NavLink className="btn btn-primary" to="/register" style={{justifyContent:'center'}}>Registrarse</NavLink></>
                            ) : (
                                <button className="btn btn-ghost" onClick={logout} style={{justifyContent:'flex-start', color:'red'}}>Cerrar Sesión</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                /* === ESTILOS CORREGIDOS (PARA FONDO BLANCO) === */
                .nav-link { 
                    position: relative; 
                    text-decoration: none; 
                    /* CAMBIO CLAVE: Color oscuro para que se vea en fondo blanco */
                    color: #334155; 
                    padding: 10px 12px; 
                    border-radius: 12px; 
                    border: 1px solid transparent; 
                    transition: all .18s ease; 
                    font-weight: 700; 
                    letter-spacing: -0.01em; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 8px; 
                }

                .nav-link:hover { 
                    background: #f1f5f9; /* Gris muy clarito al pasar el mouse */
                    color: #0f172a;
                }
                
                .nav-link--active { 
                    background: #e2e8f0; /* Gris más fuerte para el activo */
                    color: #0f172a;
                    font-weight: 850;
                }
                
                /* Estilo del botón carrito resaltado */
                .cart-highlight { 
                    background: #eff6ff !important; 
                    color: #0B5CFF !important; 
                    border: 1px solid #bfdbfe !important; 
                }
                
                .nav-pill { 
                    display: inline-grid; 
                    place-items: center; 
                    min-width: 22px; 
                    height: 22px; 
                    padding: 0 8px; 
                    border-radius: 999px; 
                    background: #0B5CFF; 
                    color: white;
                    font-size: 0.82rem; 
                    font-weight: 950; 
                    line-height: 1; 
                }

                /* === RESPONSIVE LOGIC === */
                .mobile-nav-container { display: none; }
                .nav-desktop-container { display: block; }
                .desktop-only { display: block; }

                @media (max-width: 980px) {
                    .nav-desktop-container { display: none !important; }
                    .mobile-nav-container { display: block; }
                    .desktop-only { display: none; }
                    
                    /* Ajuste links dentro del menu dropdown movil */
                    .nav-link { width: 100%; } 
                }

                /* === DISEÑO MOBILE === */
                .mobile-nav {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 16px; background: #fff; border-bottom: 1px solid #eee;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
                }
                .mn-left, .mn-right { flex: 1; display: flex; align-items: center; }
                .mn-center { flex: 2; text-align: center; }
                .mn-right { justify-content: flex-end; gap: 12px; }

                .mn-brand { font-size: 1.3rem; font-weight: 800; color: #000; letter-spacing: -0.5px; text-decoration: none; }
                
                .mn-btn {
                    background: none; border: none; padding: 4px; color: #333;
                    cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center;
                }
                .mn-cart-btn { color: #000; }
                
                .mn-badge {
                    position: absolute; top: 0; right: 0;
                    background: #E11D48; color: white;
                    font-size: 0.65rem; width: 16px; height: 16px;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-weight: bold; transform: translate(25%, -25%);
                }
            `}</style>
        </header>
    );
}