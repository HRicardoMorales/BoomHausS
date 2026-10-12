import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { clearAuth, getStoredAuth, isAdmin } from '../utils/auth';
import './navbar.css';


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

    // Al cambiar de ruta: refrescar usuario y cerrar el menú lateral.
    // Se ajusta el estado durante el render (patrón recomendado por React)
    // en lugar de en un useEffect, evitando un render intermedio.
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        setCurrentUser(getStoredAuth().user || null);
        setOpen(false);
    }

    useEffect(() => { window.addEventListener('auth:changed', refreshUser); return () => window.removeEventListener('auth:changed', refreshUser); }, []);
    useEffect(() => { function onFocus() { refreshUser(); } window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, []);

    // Escape cierra el menú móvil (patrón disclosure de WAI-ARIA).
    useEffect(() => {
        if (!open) return undefined;
        function onKey(e) { if (e.key === 'Escape') setOpen(false); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const admin = isAdmin(currentUser);

    function logout() {
        clearAuth();
        setCurrentUser(null);
        navigate('/login');
    }

    const storeName = import.meta.env.VITE_STORE_NAME || 'Amelor';
    const linkBase = ({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`;

    return (
        <header className="site-header">
            {/* =========================
                NAVBAR DESKTOP (PC)
               ========================= */}
            <div className="container nav-desktop-container">
                <div className="nav-desktop-row">

                    {/* Brand Desktop */}
                    <Link to="/" className="nav-brand">
                        <img src="/logo-navbar.webp" alt={storeName} width={148} height={74} decoding="async" className="nav-brand__logo" />
                    </Link>

                    {/* Menú Desktop */}
                    <nav className="nav-desktop" aria-label="Principal">
                        <NavLink className={linkBase} to="/">Inicio</NavLink>
                        <NavLink className={linkBase} to="/products">Tienda</NavLink>
                        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''} ${cartCount > 0 ? 'cart-highlight' : ''}`} to="/cart">
                            Carrito {cartCount > 0 ? <span className="nav-pill">{cartCount}</span> : null}
                        </NavLink>
                        <NavLink className={linkBase} to="/checkout">Checkout</NavLink>
                        {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                        {admin ? (
                            <>
                                <NavLink className={linkBase} to="/admin">Admin</NavLink>
                                <NavLink className={linkBase} to="/admin/orders">Pedidos</NavLink>
                                <NavLink className={linkBase} to="/admin/products">Productos</NavLink>
                            </>
                        ) : null}

                        <div className="nav-divider" aria-hidden="true" />

                        {!currentUser ? (
                            <>
                                <NavLink className={linkBase} to="/login">Login</NavLink>
                                <NavLink className="btn btn-primary nav-cta" to="/register">Registrarse →</NavLink>
                            </>
                        ) : (
                            <div className="nav-user">
                                <span className="nav-user__name">{currentUser.name || currentUser.email}</span>
                                <button className="btn btn-ghost nav-logout" type="button" onClick={logout}>Salir</button>
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
                        <button className="mn-btn" type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="mobile-menu">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                    
                    <div className="mn-center">
                        <Link to="/" className="mn-brand">
                            <img src="/logo-navbar.webp" alt={storeName} width={116} height={58} decoding="async" className="mn-brand__logo" />
                        </Link>
                    </div>
                    
                    <div className="mn-right">
                        {/* Botón Usuario / Mis Pedidos */}
                        <Link to={currentUser ? "/my-orders" : "/login"} className="mn-btn" aria-label={currentUser ? 'Mis pedidos' : 'Ingresar'}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </Link>
                        
                        {/* Botón Carrito */}
                        <Link to="/cart" className="mn-btn mn-cart-btn" aria-label={cartCount > 0 ? `Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}` : 'Carrito'}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            {cartCount > 0 && <span className="mn-badge" aria-hidden="true">{cartCount}</span>}
                        </Link>
                    </div>
                </nav>

                {/* Menú Desplegable Móvil */}
                {open && (
                    <div id="mobile-menu" className="mobile-menu-dropdown card">
                        <nav className="mobile-menu__list" aria-label="Menú">
                            <NavLink className={linkBase} to="/">Inicio</NavLink>
                            <NavLink className={linkBase} to="/products">Tienda</NavLink>
                            <NavLink className={linkBase} to="/cart">Carrito ({cartCount})</NavLink>
                            {currentUser ? <NavLink className={linkBase} to="/my-orders">Mis pedidos</NavLink> : null}
                            {admin ? (
                                <>
                                    <div className="mobile-menu__sep mobile-menu__sep--tight" aria-hidden="true" />
                                    <NavLink className={linkBase} to="/admin">🛠 Admin Home</NavLink>
                                    <NavLink className={linkBase} to="/admin/orders">📦 Pedidos</NavLink>
                                    <NavLink className={linkBase} to="/admin/products">🏷 Productos</NavLink>
                                </>
                            ) : null}
                            <div className="mobile-menu__sep" aria-hidden="true" />
                            {!currentUser ? (
                                <><NavLink className={linkBase} to="/login">Ingresar</NavLink><NavLink className="btn btn-primary mobile-menu__cta" to="/register">Registrarse</NavLink></>
                            ) : (
                                <button className="btn btn-ghost mobile-menu__logout" type="button" onClick={logout}>Cerrar Sesión</button>
                            )}
                        </nav>
                    </div>
                )}
            </div>

        </header>
    );
}